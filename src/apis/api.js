import { ref, get, set, push } from "firebase/database";

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase config
const firebaseConfig = {
  databaseURL: "https://record-mine-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

// One-time read
export const readData = () => {
  const userRef = ref(database, "/");
  return get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    })
    .catch((error) => {
      console.error("Error reading data:", error);
    });
};

export const writeData = async (data) => {
  const dataRef = ref(database, "/"); // Root path or specific path where you want to write
  try {
    await set(dataRef, data);
  } catch (error) {
    console.error("Error writing data:", error);
  }
};
