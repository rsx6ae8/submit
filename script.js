/************************************************
 * CONFIG / KEYS – ON TOP
 ************************************************/
const WEB3FORMS_ACCESS_KEY = "bfcc4445-cda2-4b11-b0e7-a45796eb6979";   // <-- Replace with your real key
const WEB3FORMS_ENDPOINT   = "https://api.web3forms.com/submit";

// localStorage key for auto-saving the message box
const MESSAGE_STORAGE_KEY  = "contactform_message_draft";

// threshold for detecting "paste-like" chunks (Android keyboards etc.)
const PASTE_DETECT_THRESHOLD = 8; // characters added at once

/************************************************/

const form   = document.getElementById("contactForm");
const result = document.getElementById("result");

// Put access key into hidden field on page load
const accessKeyInput = document.querySelector('input[name="access_key"]');
if (accessKeyInput) {
  accessKeyInput.value = WEB3FORMS_ACCESS_KEY;
}

/************************************************
 * Auto-save + paste blocking for the message textarea
 ************************************************/
const messageField = document.querySelector('textarea[name="message"]');

if (messageField) {
  // Load saved draft if it exists
  const savedDraft = localStorage.getItem(MESSAGE_STORAGE_KEY);
  if (savedDraft !== null) {
    messageField.value = savedDraft;
  }

  // Save draft on every input change
  messageField.addEventListener("input", function () {
    localStorage.setItem(MESSAGE_STORAGE_KEY, messageField.value);
  });

  // ---- Paste blocking: desktop + iOS (standard events) ----

  // Block right-click paste (context menu)
  messageField.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    showWarning("Paste is disabled in this box. Please type your answer.");
  });

  // Block keyboard paste shortcuts (Ctrl+V / Cmd+V)
  messageField.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
      e.preventDefault();
      showWarning("Paste is disabled in this box. Please type your answer.");
    }
  });

  // Block standard paste event
  messageField.addEventListener("paste", function (e) {
    e.preventDefault();
    showWarning("Paste is disabled in this box. Please type your answer.");
  });

  // ---- Extra: Android / keyboard paste detection ----
  // We keep a previous value and revert if a big chunk suddenly appears.
  const pasteState = {
    lastValue: messageField.value
  };

  // beforeinput: some browsers (incl. Android Chrome) mark paste as insertFromPaste
  messageField.addEventListener("beforeinput", function (e) {
    if (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop") {
      e.preventDefault();
      showWarning("Paste is disabled in this box. Please type your answer.");
    }
  });

  // input: detect sudden big insert and revert
  messageField.addEventListener("input", function (e) {
    const current = messageField.value;
    const prev    = pasteState.lastValue;

    // normal first run
    if (prev === undefined) {
      pasteState.lastValue = current;
      return;
    }

    const delta = current.length - prev.length;

    // Deletions or small edits are fine
    if (delta <= 0 || delta <= PASTE_DETECT_THRESHOLD) {
      pasteState.lastValue = current;
      return;
    }

    // Large positive jump = likely paste on Android keyboard
    messageField.value = prev; // revert change
    pasteState.lastValue = prev; // keep previous
    showWarning("Pasting large chunks is disabled. Please type your answer.");
  });

  // Keep lastValue updated also on keyup (in case of small normal edits)
  messageField.addEventListener("keyup", function () {
    pasteState.lastValue = messageField.value;
  });
}

/************************************************
 * Helper: show warning in the result area
 ************************************************/
function showWarning(msg) {
  if (!result) return;
  result.style.display = "block";
  result.textContent = msg;
}

/************************************************
 * Submit handler – Web3Forms JSON
 ************************************************/
form.addEventListener("submit", function (e) {
  e.preventDefault();

  result.style.display = "block";
  result.innerHTML = "Sending...";

  const formData = new FormData(form);
  const object   = Object.fromEntries(formData);

  // Dynamic subject using the name field
  if (object.name) {
    object.subject = `Message from ${object.name}`;
  } else {
    object.subject = "New submission from your website";
  }

  const jsonBody = JSON.stringify(object);

  fetch(WEB3FORMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: jsonBody
  })
    .then(async (response) => {
      const json = await response.json();
      if (response.ok) {
        result.innerHTML = json.message || "Message sent successfully.";
      } else {
        result.innerHTML = json.message || "Submission failed.";
      }
    })
    .catch((error) => {
      console.error(error);
      result.innerHTML = "Something went wrong!";
    })
    .finally(() => {
      form.reset();
      // clear saved draft after successful submit/reset
      localStorage.removeItem(MESSAGE_STORAGE_KEY);

      setTimeout(() => {
        result.textContent = "";
      }, 3000);
    });
});
