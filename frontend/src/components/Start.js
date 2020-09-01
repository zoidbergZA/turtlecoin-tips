import React, { useContext } from 'react';
import { signInWithRedirect } from '../base';
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

const Start = ({ history }) => {
  const { currentUser } = useContext(AuthContext);

  const loginClickHandler = async () => {
    var provider = new firebase.auth.GithubAuthProvider();

    try {
      await signInWithRedirect(provider);
      history.push('/');
    } catch (error) {
      console.error(`${error.errorCode} :: ${error.errorMessage}`);
    }
  }

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

export default Start;