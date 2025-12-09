/************************************************
 * CONFIG / KEYS – ON TOP
 ************************************************/
const WEB3FORMS_ACCESS_KEY = "bfcc4445-cda2-4b11-b0e7-a45796eb6979";   // your real key
const WEB3FORMS_ENDPOINT   = "https://api.web3forms.com/submit";

// localStorage key for auto-saving the message box
const MESSAGE_STORAGE_KEY  = "contactform_message_draft";

// threshold for detecting "paste-like" chunks (Android keyboards etc.)
const PASTE_DETECT_THRESHOLD = 8; // characters added at once

/************************************************/

$(document).ready(function () {
  const $form   = $("#contactForm");
  const $result = $("#result");
  const $messageField = $('textarea[name="message"]');

  // Put access key into hidden field on page load
  const $accessKeyInput = $('input[name="access_key"]');
  if ($accessKeyInput.length) {
    $accessKeyInput.val(WEB3FORMS_ACCESS_KEY);
  }

  /************************************************
   * Auto-save + paste blocking for the message textarea
   ************************************************/
  if ($messageField.length) {
    // Load saved draft if it exists
    const savedDraft = localStorage.getItem(MESSAGE_STORAGE_KEY);
    if (savedDraft !== null) {
      $messageField.val(savedDraft);
    }

    // Save draft on every input change
    $messageField.on("input", function () {
      localStorage.setItem(MESSAGE_STORAGE_KEY, $messageField.val());
    });

    // ---- Paste blocking: desktop + iOS (standard events) ----

    // Block right-click paste (context menu)
    $messageField.on("contextmenu", function (e) {
      e.preventDefault();
      showWarning("Paste is disabled in this box. Please type your answer.");
    });

    // Block keyboard paste shortcuts (Ctrl+V / Cmd+V)
    $messageField.on("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        showWarning("Paste is disabled in this box. Please type your answer.");
      }
    });

    // Block standard paste event
    $messageField.on("paste", function (e) {
      e.preventDefault();
      showWarning("Paste is disabled in this box. Please type your answer.");
    });

    // ---- Extra: Android / keyboard paste detection ----
    // Keep previous value and revert if a big chunk suddenly appears.
    const pasteState = {
      lastValue: $messageField.val()
    };

    // beforeinput: some browsers (incl. Android Chrome) mark paste as insertFromPaste
    $messageField.on("beforeinput", function (e) {
      const ev = e.originalEvent || e;
      if (ev.inputType === "insertFromPaste" || ev.inputType === "insertFromDrop") {
        e.preventDefault();
        showWarning("Paste is disabled in this box. Please type your answer.");
      }
    });

    // input: detect sudden big insert and revert
    $messageField.on("input", function () {
      const current = $messageField.val();
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
      $messageField.val(prev);           // revert change
      pasteState.lastValue = prev;       // keep previous
      showWarning("Pasting large chunks is disabled. Please type your answer.");
    });

    // Keep lastValue updated also on keyup (for small normal edits)
    $messageField.on("keyup", function () {
      pasteState.lastValue = $messageField.val();
    });
  }

  /************************************************
   * Helper: show warning in the result area
   ************************************************/
  function showWarning(msg) {
    if (!$result.length) return;
    $result.show().text(msg);
  }

  /************************************************
   * Submit handler – Web3Forms JSON
   ************************************************/
  $form.on("submit", function (e) {
    e.preventDefault();

    $result.show().html("Sending...");

    const formData = new FormData(this);
    const object   = Object.fromEntries(formData.entries());

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
          $result.html(json.message || "Message sent successfully.");
        } else {
          $result.html(json.message || "Submission failed.");
        }
      })
      .catch((error) => {
        console.error(error);
        $result.html("Something went wrong!");
      })
      .finally(() => {
        $form.trigger("reset");
        // clear saved draft after successful submit/reset
        localStorage.removeItem(MESSAGE_STORAGE_KEY);

        setTimeout(() => {
          $result.text("");
        }, 3000);
      });
  });
});
