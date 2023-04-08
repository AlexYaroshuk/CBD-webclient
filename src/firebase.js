import firebase from "firebase/app";
import "firebase/auth";

const firebaseConfig = {
  // Your Firebase configuration object
};

// Your Firebase configuration should already be here
firebase.initializeApp(firebaseConfig);

// Add this line to enable Firebase Authentication
firebase.auth().useDeviceLanguage();

export default firebase;
