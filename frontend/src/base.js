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
    console.log(`new auth user: ${app.auth().currentUser.uid}`);

    // TODO: pass in continue url param: call cloud function with userId as query param to refresh linked accounts
    // TODO: add continue url to whitelist
    await credentials.user.sendEmailVerification();
  } catch (error) {
    console.log(error);
  }
}

export async function signInWithEmailAndPassword(email, password) {
  await app.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  await app.auth().signInWithEmailAndPassword(email, password);
}

export async function signInWithRedirect(provider) {
  await app.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  await app.auth().signInWithRedirect(provider);
}