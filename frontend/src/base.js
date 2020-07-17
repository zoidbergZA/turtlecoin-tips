import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore'

const config = {
  apiKey: "AIzaSyBmXrykxhR06_o1F4VqQLjfiITh1x2XgUU",
  authDomain: "github-tipbot.firebaseapp.com",
  databaseURL: "https://github-tipbot.firebaseio.com",
  projectId: "github-tipbot",
  storageBucket: "github-tipbot.appspot.com",
  messagingSenderId: "725921159452",
  appId: "1:725921159452:web:d3453568ca5dc6a3b282d9",
  measurementId: "G-DN0YEYNXPE"
}

const app = firebase.initializeApp(config);

export default app;