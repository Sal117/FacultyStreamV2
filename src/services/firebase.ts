// firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgpTRq2prAfWj45lyzAShUgU08aRyrmOc",
  authDomain: "facultystream.firebaseapp.com",
  projectId: "facultystream",
  storageBucket: "facultystream.appspot.com",
  messagingSenderId: "370816278537",
  appId: "1:370816278537:web:0212a4ff766e5a469458d8",
  measurementId: "G-YETQ94850X"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

// Configure Storage
const storageRef = storage;
storageRef.maxOperationRetryTime = 10000; // 10 seconds
storageRef.maxUploadRetryTime = 10000; // 10 seconds

export { storageRef };
