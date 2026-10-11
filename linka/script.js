const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const eyeIcon = document.getElementById("eyeIcon");

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");


function showLoading(text) {

    loadingText.textContent = text;

    loadingScreen.classList.add("show");
    loadingScreen.setAttribute("aria-hidden", "false");
}


function hideLoading() {

    loadingScreen.classList.remove("show");
    loadingScreen.setAttribute("aria-hidden", "true");

    loginButton.classList.remove("loading");
}


// Coming back with the browser Back button:
// never leave the loading screen stuck on.
window.addEventListener("pageshow", hideLoading);


// ================================
// SAMPLE ACCOUNT (demo only)
// Replace with real authentication
// (server-side) before going live.
// ================================

const SAMPLE_ACCOUNT = {
    email: "darz9547@gmail.com",
    password: "og192002",
    name: "Darcy"
};

const HOME_PAGE = "home.html";


// ================================
// SHOW / HIDE PASSWORD
// ================================

passwordToggle.addEventListener("click", () => {

    const isPassword =
        passwordInput.type === "password";

    passwordInput.type =
        isPassword ? "text" : "password";

    passwordToggle.setAttribute(
        "aria-label",
        isPassword
            ? "Hide password"
            : "Show password"
    );


    if (!isPassword) {

        eyeIcon.innerHTML = `
            <path
                d="M3 3L21 21"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <path
                d="M10.58 10.59
                   A2 2 0 0 0
                   13.41 13.42"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <path
                d="M9.88 5.09
                   C10.56 4.89
                   11.27 4.8
                   12 4.8
                   C18.5 4.8
                   22 12
                   22 12
                   C21.34 13.35
                   20.4 14.58
                   19.25 15.6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <path
                d="M6.61 6.61
                   C3.78 8.35
                   2 12
                   2 12
                   C2 12
                   5.5 19.2
                   12 19.2
                   C13.44 19.2
                   14.78 18.9
                   15.99 18.38"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />
        `;

    } else {

        eyeIcon.innerHTML = `
            <path
                d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                stroke-width="1.8"
            />
        `;
    }

});


// ================================
// LOGIN FORM
// ================================

loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value.trim();


    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        return;
    }


    loginButton.classList.add("loading");

    showLoading("Logging you in...");

    message.textContent = "";


    // Short delay so the loading animation is visible
    setTimeout(() => {

        const isValid =
            email.toLowerCase() === SAMPLE_ACCOUNT.email &&
            password === SAMPLE_ACCOUNT.password;


        if (!isValid) {

            hideLoading();

            message.style.color = "#d92d20";

            message.textContent =
                "Incorrect email or password.";

            return;
        }


        // "Remember me" keeps the login after closing the browser,
        // otherwise it only lasts for this tab / session.
        const remember =
            document.getElementById("remember").checked;

        const storage =
            remember ? localStorage : sessionStorage;

        try {
            storage.setItem(
                "linkaUser",
                JSON.stringify({
                    email: SAMPLE_ACCOUNT.email,
                    name: SAMPLE_ACCOUNT.name
                })
            );
        } catch (error) {
            // Storage blocked — still continue to the home page.
        }


        message.style.color = "";

        message.textContent =
            "Welcome back, " + SAMPLE_ACCOUNT.name + "! Redirecting...";

        showLoading("Welcome back, " + SAMPLE_ACCOUNT.name + "!");

        // Keep the loading screen up for a moment, then go home
        setTimeout(() => {

            window.location.href = HOME_PAGE;

        }, 1100);

    }, 1200);

});


// ================================
// INPUT ANIMATION
// ================================

const inputs =
    document.querySelectorAll(".input-wrapper input");


inputs.forEach(input => {

    input.addEventListener("focus", () => {

        input.parentElement.classList.add("focused");

    });


    input.addEventListener("blur", () => {

        input.parentElement.classList.remove("focused");

    });

});


// ================================
// SOCIAL BUTTON DEMO
// ================================

const socialButtons =
    document.querySelectorAll(".social-button");


socialButtons.forEach(button => {

    button.addEventListener("click", () => {

        message.textContent =
            "Social login will be connected later.";

    });

});