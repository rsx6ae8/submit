  // 👉 Replace these with your actual IDs from EmailJS
  const serviceID = "service_wq8c2qm";   // e.g. "service_abc123"
  const templateID = "template_bqrwyjs"; // e.g. "template_bqrwyjs"


/***********************
 *  FORM ELEMENTS
 ***********************/
const btn       = document.getElementById("button");
const form      = document.getElementById("form");
const statusBox = document.getElementById("status");
const messageField = document.getElementById("message");


/*****************************************
 *  BLOCK PASTE + LIMIT TYPING SPEED
 *****************************************/

// configure max typing speed
// (characters per second)
const MAX_CHARS_PER_SECOND = 5;

let charsTypedInWindow = 0;
let windowStartTime = 0;

// 1) block paste
messageField.addEventListener("paste", (event) => {
  event.preventDefault();
  alert("Pasting is disabled. Please type normally.");
});

// 2) limit typing speed
messageField.addEventListener("beforeinput", (event) => {
  // ignore non-insertions (delete, arrow keys, etc.)
  if (event.inputType !== "insertText") return;

  const now = Date.now();

  // start or reset our 1-second window
  if (windowStartTime === 0 || now - windowStartTime > 1000) {
    windowStartTime = now;
    charsTypedInWindow = 0;
  }

  // number of chars being inserted
  const newChars = event.data ? event.data.length : 1;
  charsTypedInWindow += newChars;

  if (charsTypedInWindow > MAX_CHARS_PER_SECOND) {
    event.preventDefault();
    statusBox.textContent = `Typing too fast — max ${MAX_CHARS_PER_SECOND} chars/sec.`;
    statusBox.className = "status error";
  } else {
    statusBox.textContent = "";
    statusBox.className = "status";
  }
});


/*****************************************
 *  SEND EMAIL (EmailJS sendForm)
 *****************************************/
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const nameValue = form.from_name.value.trim();
  const messageValue = form.message.value.trim();

  if (!nameValue || !messageValue) {
    statusBox.textContent = "Please enter both name and message.";
    statusBox.className = "status error";
    return;
  }

  btn.value = "Sending...";
  btn.disabled = true;
  statusBox.textContent = "";
  statusBox.className = "status";

  // initialize EmailJS once here
  emailjs.init(EMAILJS_PUBLIC_KEY);

  // send everything from <form ...>
  emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
    .then(() => {
      btn.value = "Send Email";
      btn.disabled = false;
      statusBox.textContent = "Message sent successfully!";
      statusBox.className = "status success";

      form.reset();
      windowStartTime = 0;
      charsTypedInWindow = 0;
    })
    .catch((err) => {
      console.error("EmailJS error:", err);
      btn.value = "Send Email";
      btn.disabled = false;
      statusBox.textContent = "Failed to send message. Check console.";
      statusBox.className = "status error";
    });
});
