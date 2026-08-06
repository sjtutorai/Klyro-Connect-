import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'sjtutorai@gmail.com', 'some_password');
    console.log("Logged in!", cred.user.uid);
  } catch (e) {
    console.log("Login failed, trying to sign up or wrong password...", e.message);
    try {
      const cred = await signInWithEmailAndPassword(auth, 'sjtutorai@gmail.com', 'Password123!');
      console.log("Logged in!", cred.user.uid);
    } catch(e2) {
      console.log(e2.message);
    }
  }
  
  try {
    const users = await getDocs(collection(db, 'users'));
    console.log(`Users: ${users.size}`);
  } catch(e) {
    console.log("Users query failed:", e.message);
  }
  process.exit(0);
}
run();
