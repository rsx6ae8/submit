/************************************************
 * CONFIG / KEYS – ON TOP
 ************************************************/
const WEB3FORMS_ACCESS_KEY = "bfcc4445-cda2-4b11-b0e7-a45796eb6979";
const WEB3FORMS_ENDPOINT   = "https://api.web3forms.com/submit";

// localStorage key for auto-saving the message box
const MESSAGE_STORAGE_KEY  = "contactform_message_draft";

// threshold for detecting "paste-like" chunks (Android keyboards etc.)
const PASTE_DETECT_THRESHOLD = 8; // characters added at once

/************************************************/

$(document).ready(function () {
  const $form        = $("#contactForm");
  const $result      = $("#result");
  const $messageField = $('textarea[name="message"]');

  console.log("script.js loaded, jQuery ready.");

  // Put access key into hidden field on page load
  const $accessKeyInput = $('input[name="access_key"]');
  if ($accessKeyInput.length) {
    $accessKeyInput.val(WEB3FORMS_ACCESS_KEY);
  }

  /************************************************
   * Auto-save + paste blocking for the message textarea
   ************************************************/
  if ($messageField.length) {
    // ---- AUTO-SAVE ----
    const savedDraft = localStorage.getItem(MESSAGE_STORAGE_KEY);
    if (savedDraft !== null) {
      $messageField.val(savedDraft);
    }

    const pasteState = {
      lastValue: $messageField.val()
    };

    // auto-save + paste detection .on attach event listener
    $messageField.on("input", function () {
      const current = $messageField.val();
      const prev    = pasteState.lastValue;

      const delta = current.length - prev.length;

      if (delta <= PASTE_DETECT_THRESHOLD) {
        pasteState.lastValue = current;
        localStorage.setItem(MESSAGE_STORAGE_KEY, current);
        return;
      }

      // Large positive jump = likely paste
      $messageField.val(prev);
      pasteState.lastValue = prev;
      showWarning("Pasting large chunks is disabled. Please type your answer.");
    });

    $messageField.on("keyup", function () {
      pasteState.lastValue = $messageField.val();
    });

    // Block context menu
    $messageField.on("contextmenu", function (e) {
      e.preventDefault();
      showWarning("Paste is disabled in this box. Please type your answer.");
    });

    // Block Ctrl+V / Cmd+V
    $messageField.on("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        showWarning("Paste is disabled in this box. Please type your answer.");
      }
    });

    // Block paste event
    $messageField.on("paste", function (e) {
      e.preventDefault();
      showWarning("Paste is disabled in this box. Please type your answer.");
    });

    // Extra: beforeinput for insertFromPaste
    $messageField.on("beforeinput", function (e) {
      const ev = e.originalEvent || e;
      if (ev && (ev.inputType === "insertFromPaste" || ev.inputType === "insertFromDrop")) {
        e.preventDefault();
        showWarning("Paste is disabled in this box. Please type your answer.");
      }
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
   *tab and space
   ************************************************/
const NBSP = "\u00A0";
const TAB_NBSP_COUNT = 4;

$messageField.on("keydown", function (e) {
  const el = this;
  const pos = el.selectionStart;

  // TAB → 4 NBSPs
  if (e.key === "Tab") {
    e.preventDefault();

    const indent = NBSP.repeat(TAB_NBSP_COUNT);
    el.value = el.value.slice(0, pos) + indent + el.value.slice(pos);
    el.selectionStart = el.selectionEnd = pos + TAB_NBSP_COUNT;
    return;
  }

  // SPACE → 1 NBSP
  if (e.key === " ") {
    e.preventDefault();

    el.value = el.value.slice(0, pos) + NBSP + el.value.slice(pos);
    el.selectionStart = el.selectionEnd = pos + 1;
  }
});




  /************************************************
   * Submit handler – Web3Forms JSON + CONFIRM
   ************************************************/
  $form.on("submit", function (e) {
    e.preventDefault();
    console.log("Submit handler triggered.");

    // 🔹 CONFIRMATION POP-UP – THIS MUST RUN FIRST
    const confirmed = window.confirm(
      "Are you sure you want to send your essay now?"
    );
    if (!confirmed) {
      $result.show().text("Submission cancelled.");
      console.log("User cancelled submission.");
      return; // <- nothing is sent
    }

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
        // $form.trigger("reset");
        // localStorage.removeItem(MESSAGE_STORAGE_KEY);

        setTimeout(() => {
          $result.text("");
        }, 3000);
      });
  });
});
