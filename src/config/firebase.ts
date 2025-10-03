import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA-NqwAxofQCHHbZvbnlgNKkCgH2177bIM",
  authDomain: "studio-1007817151-84994.firebaseapp.com",
  databaseURL: "https://studio-1007817151-84994-default-rtdb.firebaseio.com/",
  projectId: "studio-1007817151-84994",
  storageBucket: "studio-1007817151-84994.firebasestorage.app",
  messagingSenderId: "151936710847",
  appId: "1:151936710847:web:a455880f76e4c164e7ee0a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
