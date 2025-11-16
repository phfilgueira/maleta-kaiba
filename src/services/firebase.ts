import { initializeApp } from "firebase/app";
// FIX: Changed Firebase Firestore import to use a namespace import to resolve potential module resolution errors.
import * as firestore from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration from user
const firebaseConfig = {
    apiKey: "AIzaSyBsdZtXTzAFuq-KNWXZYBKZ2C7NuuejLyg",
    authDomain: "maletakaiba.firebaseapp.com",
    projectId: "maletakaiba",
    storageBucket: "maletakaiba.firebasestorage.app",
    messagingSenderId: "676804605468",
    appId: "1:676804605468:web:ce871e590d54f5f4d8d1d9"
};

// Initialize Firebase and export the services
const app = initializeApp(firebaseConfig);
export const db = firestore.getFirestore(app);
export const auth = getAuth(app);