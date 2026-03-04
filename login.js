const loginSpinner = document.getElementById("loginSpinner");
const loginBtnText = document.getElementById("loginBtnText");

const registerSpinner = document.getElementById("registerSpinner");
const registerBtnText = document.getElementById("registerBtnText");

import { auth } from "./firebaseConfig.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");

const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const errorMsg = document.getElementById("errorMsg");

// Auto redirect if logged in
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "index.html";
});

// Toggle Forms
showRegister.addEventListener("click", () => {
  loginForm.classList.remove("active-form");
  registerForm.classList.add("active-form");
  errorMsg.innerText = "";
});

showLogin.addEventListener("click", () => {
  registerForm.classList.remove("active-form");
  loginForm.classList.add("active-form");
  errorMsg.innerText = "";
});

// Login
loginBtn.addEventListener("click", async () => {

  loginSpinner.classList.remove("hidden");
  loginBtnText.innerText = "Logging in...";
  loginBtn.disabled = true;

  try {
    await signInWithEmailAndPassword(
      auth,
      emailEl.value,
      passwordEl.value
    );

    window.location.href = "index.html";

  } catch (error) {

    loginSpinner.classList.add("hidden");
    loginBtnText.innerText = "Login";
    loginBtn.disabled = false;

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      errorMsg.innerText = "Invalid email or password.";
    } else {
      errorMsg.innerText = "Login failed. Try again.";
    }
  }

});
// Register
registerBtn.addEventListener("click", async () => {

  registerSpinner.classList.remove("hidden");
  registerBtnText.innerText = "Creating...";
  registerBtn.disabled = true;

  try {
    await createUserWithEmailAndPassword(
      auth,
      regEmail.value,
      regPassword.value
    );

    window.location.href = "index.html";

  } catch (error) {

    registerSpinner.classList.add("hidden");
    registerBtnText.innerText = "Create Account";
    registerBtn.disabled = false;

    if (error.code === "auth/email-already-in-use") {
      errorMsg.innerText = "Email is already registered.";
    } else if (error.code === "auth/weak-password") {
      errorMsg.innerText = "Password must be at least 6 characters.";
    } else {
      errorMsg.innerText = "Registration failed. Try again.";
    }
  }

});