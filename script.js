/************************************************
 * CONFIG / KEYS – ALL SETTINGS AT THE TOP
 ************************************************/
const WEB3FORMS_ACCESS_KEY = "bfcc4445-cda2-4b11-b0e7-a45796eb6979"; // <-- replace with your real key
const WEB3FORMS_ENDPOINT   = "https://api.web3forms.com/submit";
const EMAIL_SUBJECT_LINE   = "New message from your website";

/************************************************
 * jQuery SCRIPT
 ************************************************/
$(document).ready(function () {
    // Put config values into hidden inputs
    $("#access_key").val(WEB3FORMS_ACCESS_KEY);
    $("#subject").val(EMAIL_SUBJECT_LINE);

    $("#contactForm").on("submit", function (e) {
        e.preventDefault();

        const $form      = $(this);
        const $status    = $("#status");
        const $submitBtn = $("#submitBtn");

        // ===== Make email OPTIONAL =====
        // If user leaves email empty, send a placeholder string
        const emailVal = $("#email").val().trim();
        if (emailVal === "") {
            $("#email").val("(no email provided)");
        }

        $status.removeClass("success error").text("");
        $submitBtn.prop("disabled", true).text("Sending...");

        $.ajax({
            url: WEB3FORMS_ENDPOINT,
            type: "POST",
            data: $form.serialize(),   // serialize form data
            dataType: "json",
            success: function (response) {
                if (response && response.success) {
                    $status
                        .addClass("success")
                        .text("✅ Your message has been sent successfully!");
                    $form.trigger("reset");
                } else {
                    console.log(response);
                    $status
                        .addClass("error")
                        .text("❌ Something went wrong. Please try again.");
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
                $status
                    .addClass("error")
                    .text("❌ Network or server error. Please try again.");
            },
            complete: function () {
                $submitBtn.prop("disabled", false).text("Send Message");
            }
        });
    });
});