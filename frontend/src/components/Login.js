import React, { useContext } from 'react';
import app from '../base';
import * as firebase from 'firebase/app';
import { AuthContext } from '../contexts/Auth';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import { Redirect } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/logo-large.png';

const Login = ({ history }) => {
  const loginClickHandler = () => {
    var provider = new firebase.auth.GithubAuthProvider();

    app.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      app.auth().signInWithRedirect(provider).then(function(result) {
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
    <Section>
      <Container>
        <Heading>TurtleCoin Tips</Heading>
        <div style={{ margin: "40px" }}>
          <img src={logo} width="300" alt="logo" />
        </div>
        <Button onClick={loginClickHandler}>
          <FontAwesomeIcon icon={faGithub}></FontAwesomeIcon>
          <span style={{ paddingLeft: "5px" }}> Login with Github</span>
        </Button>
      </Container>
    </Section>
  );
}

export default Login;