import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCOYTgC6dKNz2w8AeJIHJ8e1LyvprjzY_c",
  authDomain: "senseai-8d42d.firebaseapp.com",
  projectId: "senseai-8d42d",
  storageBucket: "senseai-8d42d.firebasestorage.app",
  messagingSenderId: "537746308872",
  appId: "1:537746308872:web:003b1e354258c89e2df6bd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);