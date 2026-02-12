/************************************************
 * CONFIG / KEYS – ON TOP
 ************************************************/
const WEB3FORMS_ACCESS_KEY = "bfcc4445-cda2-4b11-b0e7-a45796eb6979";
const WEB3FORMS_ENDPOINT   = "https://api.web3forms.com/submit";

// localStorage key for auto-saving the message box
const MESSAGE_STORAGE_KEY  = "contactform_message_draft";

// threshold for detecting "paste-like" chunks
const PASTE_DETECT_THRESHOLD = 8;

// sessionStorage flag (prevents popup showing again on refresh)
const SUCCESS_SHOWN_KEY = "submission_success_shown";

/************************************************/

$(document).ready(function () {
  const $form         = $("#contactForm");
  const $result       = $("#result");
  const $messageField = $('textarea[name="message"]');

  const $undoBtn   = $("#undoBtn");
  const $redoBtn   = $("#redoBtn");
  const $clearBtn  = $("#clearBtn");
  const $submitBtn = $("#submitBtn");

  // Popup elements
  const $popupOverlay  = $("#popupOverlay");
  const $popupTitle    = $("#popupTitle");
  const $popupMessage  = $("#popupMessage");
  const $closePopupBtn = $("#closePopupBtn");

  let bypassPasteCheck = false;

  console.log("script.js loaded.");

  /************************************************
   * Insert access key
   ************************************************/
  $('input[name="access_key"]').val(WEB3FORMS_ACCESS_KEY);

  /************************************************
   * Popup helpers (mouse-only)
   ************************************************/
  function openPopup(title, message) {
    $popupTitle.text(title);
    $popupMessage.text(message);
    $popupOverlay.addClass("is-open");
  }

  function closePopup() {
    $popupOverlay.removeClass("is-open");
  }

  $closePopupBtn.on("click", closePopup);

  // Click outside the box closes popup
  $popupOverlay.on("click", function (e) {
    if (e.target === this) closePopup();
  });

  /************************************************
   * Helpers
   ************************************************/
  function showWarning(msg) {
    if ($result.length) $result.show().text(msg);
  }

  const pasteState = { lastValue: "" };

  function syncDraftNow() {
    const v = $messageField.val();
    pasteState.lastValue = v;
    localStorage.setItem(MESSAGE_STORAGE_KEY, v);
  }

  /************************************************
   * Restore saved draft
   ************************************************/
  const saved = localStorage.getItem(MESSAGE_STORAGE_KEY);
  if (saved !== null) {
    $messageField.val(saved);
  }
  pasteState.lastValue = $messageField.val();

  /************************************************
   * Paste blocking + autosave
   ************************************************/
  $messageField.on("input", function () {
    const current = $messageField.val();
    const prev = pasteState.lastValue;
    const delta = current.length - prev.length;

    if (bypassPasteCheck) {
      bypassPasteCheck = false;
      syncDraftNow();
      return;
    }

    if (delta <= PASTE_DETECT_THRESHOLD) {
      syncDraftNow();
      return;
    }

    $messageField.val(prev);
    showWarning("Pasting large chunks is disabled. Please type your answer.");
  });

  $messageField.on("paste contextmenu", e => {
    e.preventDefault();
    showWarning("Paste is disabled in this box.");
  });

  $messageField.on("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      e.preventDefault();
      showWarning("Paste is disabled.");
    }
  });

  $messageField.on("beforeinput", e => {
    const ev = e.originalEvent;
    if (!ev) return;

    if (ev.inputType === "historyUndo" || ev.inputType === "historyRedo") {
      bypassPasteCheck = true;
      return;
    }

    if (ev.inputType === "insertFromPaste" || ev.inputType === "insertFromDrop") {
      e.preventDefault();
      showWarning("Paste is disabled.");
    }
  });

  /************************************************
   * TAB → NBSP
   ************************************************/
  const NBSP = "\u00A0";
  $messageField.on("keydown", function (e) {
    const el = this;
    const pos = el.selectionStart;
    const end = el.selectionEnd;

    if (e.key === "Tab") {
      e.preventDefault();
      bypassPasteCheck = true;
      el.value = el.value.slice(0, pos) + NBSP.repeat(4) + el.value.slice(end);
      el.selectionStart = el.selectionEnd = pos + 4;
      syncDraftNow();
    }
  });

  /************************************************
   * Undo / Redo buttons
   ************************************************/
  $undoBtn.on("click", () => {
    bypassPasteCheck = true;
    document.execCommand("undo");
    setTimeout(syncDraftNow, 0);
  });

  $redoBtn.on("click", () => {
    bypassPasteCheck = true;
    document.execCommand("redo");
    setTimeout(syncDraftNow, 0);
  });

  /************************************************
   * Clear button
   ************************************************/
  $clearBtn.on("click", () => {
    const confirmed = confirm("Clear all text? This cannot be undone.");
    if (!confirmed) return;

    bypassPasteCheck = true;
    $messageField.val("");
    syncDraftNow();
    $messageField.focus();
  });

  /************************************************
   * Submit handler
   ************************************************/
  $form.on("submit", function (e) {
    e.preventDefault();

    // ✅ Allow success popup again ONLY when submit is clicked again
    sessionStorage.removeItem(SUCCESS_SHOWN_KEY);

    if (!confirm("Are you sure you want to send your essay now?")) {
      $result.text("Submission cancelled.");
      return;
    }

    $result.text("Sending...");
    $submitBtn.prop("disabled", true).text("Sending...");

    const data = Object.fromEntries(new FormData(this).entries());
    data.subject = data.name
      ? `Message from ${data.name}`
      : "New submission from your website";

    fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(json => {
        if (json && json.success) {
          $result.text("");

          if (!sessionStorage.getItem(SUCCESS_SHOWN_KEY)) {
            openPopup(
              "✅ Submission Successful",
              "Your essay has been submitted successfully."
            );
            sessionStorage.setItem(SUCCESS_SHOWN_KEY, "true");
          }
        } else {
          const msg = (json && json.message) ? json.message : "Submission failed.";
          $result.text(msg);
          openPopup("❌ Submission Failed", msg);
        }
      })
      .catch(() => {
        $result.text("Submission failed.");
        openPopup("❌ Submission Failed", "Network error. Please try again.");
      })
      .finally(() => {
        $submitBtn.prop("disabled", false).text("Submit");
        setTimeout(() => $result.text(""), 8000);
      });
  });
});
