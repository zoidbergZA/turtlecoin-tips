import React from 'react';
import app from '../base';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';

import * as firebase from 'firebase/app';

const Login = () => {
  const loginClickHandler = () => {
    var provider = new firebase.auth.GithubAuthProvider();

    app.auth().signInWithPopup(provider).then(function(result) {
      // This gives you a GitHub Access Token. You can use it to access the GitHub API.
      var token = result.credential.accessToken;
      console.log(token);

      // The signed-in user info.
      var user = result.user;
      console.log(user);
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log(`${errorCode} :: ${errorMessage}`);
    });
  }

  return (
    <React.Fragment>
      <Heading>Login</Heading>
      <Button onClick={loginClickHandler}>Login with Github</Button>
    </React.Fragment>
  );
}

export default Login;