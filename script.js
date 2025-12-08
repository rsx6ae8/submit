/************************************************
 * CONFIG / KEYS – ON TOP
 ************************************************/
const WEB3FORMS_ACCESS_KEY = "bfcc4445-cda2-4b11-b0e7-a45796eb6979";   // <-- Replace
const WEB3FORMS_ENDPOINT   = "https://api.web3forms.com/submit";
const WEB3FORMS_SUBJECT    = "New submission from your website";

/************************************************/

const form   = document.getElementById('contactForm');
const result = document.getElementById('result');

// Put keys into hidden fields on page load
document.querySelector('input[name="access_key"]').value = WEB3FORMS_ACCESS_KEY;
document.querySelector('input[name="subject"]').value     = WEB3FORMS_SUBJECT;

form.addEventListener('submit', function(e) {
  e.preventDefault();

  result.style.display = "block";
  result.innerHTML = "Sending...";

  // OPTIONAL email support
  const emailField = document.getElementById("email");
  if (emailField && emailField.value.trim() === "") {
    emailField.value = "(no email provided)";
  }

  const formData = new FormData(form);
  const object   = Object.fromEntries(formData);
  const jsonBody = JSON.stringify(object);

  fetch(WEB3FORMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: jsonBody
  })
  .then(async (response) => {
    let json = await response.json();
    if (response.ok) {
      result.innerHTML = json.message;
    } else {
      result.innerHTML = json.message;
    }
  })
  .catch(error => {
    console.error(error);
    result.innerHTML = "Something went wrong!";
  })
  .finally(() => {
    form.reset();
    setTimeout(() => {
      result.textContent = "";
    }, 3000);
  });
});
