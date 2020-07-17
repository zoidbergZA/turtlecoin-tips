import React, { useContext } from 'react';
import app from '../base';
import { AuthContext } from '../contexts/Auth';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import { Redirect } from 'react-router';

import * as firebase from 'firebase/app';

const Login = ({ history }) => {
  const loginClickHandler = () => {
    var provider = new firebase.auth.GithubAuthProvider();

    app.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      app.auth().signInWithPopup(provider).then(function(result) {
        history.push('/');
      }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        console.log(`${errorCode} :: ${errorMessage}`);
      });
    });
  }

  const { currentUser } = useContext(AuthContext);

  if (currentUser) {
    return <Redirect to="/" />;
  }

  return (
    <React.Fragment>
      <Heading>Login</Heading>
      <Button onClick={loginClickHandler}>Login with Github</Button>
    </React.Fragment>
  );
}

export default Login;