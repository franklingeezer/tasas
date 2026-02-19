import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMJXvkm6JC4d4EBZiEhv7b63g25MRcCY4",
  authDomain: "smart-hybrid-attendance.firebaseapp.com",
  projectId: "smart-hybrid-attendance",
  storageBucket: "smart-hybrid-attendance.firebasestorage.app",
  messagingSenderId: "136616104831",
  appId: "1:136616104831:web:ab9bad6498b53ae304004a"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 🔐 Added this line
