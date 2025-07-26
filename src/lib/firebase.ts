// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "sahayak-ai-teacher-dashboard",
  "appId": "1:421218532191:web:0d790f04c27f60923214ea",
  "storageBucket": "sahayak-ai-teacher-dashboard.firebasestorage.app",
  "apiKey": "AIzaSyBf86P485GBD3qMcY0USYtY83jEJlrk5AI",
  "authDomain": "sahayak-ai-teacher-dashboard.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "421218532191"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
