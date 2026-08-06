import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const snapshot = await getDocs(collection(db, 'institutions'));
  let deleted = 0;
  for (const document of snapshot.docs) {
    if (!document.data().password) {
      await deleteDoc(doc(db, 'institutions', document.id));
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} demo requests.`);
  process.exit(0);
}
run();
