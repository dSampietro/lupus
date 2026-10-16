// Paste your Firebase web app config here.
// Firebase console -> Project settings -> Your apps -> Web app -> "SDK setup and configuration".
// These values are not secrets: access is protected by firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyBRfyB_9WmIl4iegFQWnKOchPigmx-XmT0",
  authDomain: "lupus-26309.firebaseapp.com",
  projectId: "lupus-26309",
  storageBucket: "lupus-26309.firebasestorage.app",
  messagingSenderId: "867289862316",
  appId: "1:867289862316:web:caefeac9305ac792704f09"
};


export const isConfigured = !String(firebaseConfig.apiKey).startsWith("YOUR_");
