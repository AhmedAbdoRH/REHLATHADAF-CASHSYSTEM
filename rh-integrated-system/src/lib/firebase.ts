import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove, update } from "firebase/database";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB1CAxFydEJojwNj6shU48ezSC-6aZqQu8",
  authDomain: "rhm-fsystem.firebaseapp.com",
  databaseURL: "https://rhm-fsystem-default-rtdb.firebaseio.com",
  projectId: "rhm-fsystem",
  storageBucket: "rhm-fsystem.firebasestorage.app",
  messagingSenderId: "605865103602",
  appId: "1:605865103602:web:bdea570bff282adc04406b",
  measurementId: "G-QHFN5RRHDB"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { ref, push, onValue, remove, update, doc, getDoc, storageRef, uploadBytes, getDownloadURL };