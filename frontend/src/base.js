import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/analytics';

const config = {
  apiKey: "AIzaSyBmXrykxhR06_o1F4VqQLjfiITh1x2XgUU",
  authDomain: "turtlecoin.tips",
  databaseURL: "https://github-tipbot.firebaseio.com",
  projectId: "github-tipbot",
  storageBucket: "github-tipbot.appspot.com",
  messagingSenderId: "725921159452",
  appId: "1:725921159452:web:d3453568ca5dc6a3b282d9",
  measurementId: "G-DN0YEYNXPE"
}

const app = firebase.initializeApp(config);
firebase.analytics();

// TODO: remove this export
export default app;

export async function createUserWithEmailAndPassword(email, password) {
  await app.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  const credentials = await app.auth().createUserWithEmailAndPassword(email, password);

  try {
    const uid = app.auth().currentUser.uid;

    // TODO: add continueUrl (custom domain) to whitelist
    await credentials.user.sendEmailVerification({
      url: `https://us-central1-github-tipbot.cloudfunctions.net/webApp-onEmailVerified?uid=${uid}`
    });
  } catch (error) {
    console.log(error);
  }
}

export async function signInWithEmailAndPassword(email, password) {
  await app.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  await app.auth().signInWithEmailAndPassword(email, password);
}

export async function signInWithRedirect(provider) {
  await app.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
  await app.auth().signInWithRedirect(provider);
}

export async function signOut() {
  await app.auth().signOut();
}