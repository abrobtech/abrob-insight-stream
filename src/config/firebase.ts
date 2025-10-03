import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB5nXV5nGM0I3c9P7pAjJoeWJ9TctXHp_k",
  authDomain: "abrob-gt1.firebaseapp.com",
  databaseURL: "https://studio-1007817151-84994-default-rtdb.firebaseio.com/",
  projectId: "abrob-gt1",
  storageBucket: "abrob-gt1.firebasestorage.app",
  messagingSenderId: "339885770339",
  appId: "1:339885770339:web:fb5eeff3186542a4705a56"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
