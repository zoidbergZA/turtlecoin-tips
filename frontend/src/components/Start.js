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
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/logo-large.png';

const Start = ({ history, email, github }) => {
  const { currentUser } = useContext(AuthContext);

  const emailLoginHandler = () => {
    history.push('/login');
  }

  const githubLoginHandler = async () => {
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

  const btnsContainer = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }

  const btnStyle = {
    width: "250px",
    marginTop: "10px"
  }

  const btnText = {
    paddingLeft: "10px"
  }

  return (
    <Section>
      <Container>
        <Heading>TurtleCoin Tips</Heading>
        <div style={{ margin: "40px" }}>
          <img src={logo} width="200" alt="logo" />
        </div>
        <div style={btnsContainer}>
          {email &&
            <Button style={btnStyle} onClick={emailLoginHandler}>
              <FontAwesomeIcon icon={faEnvelope}></FontAwesomeIcon>
              <span style={btnText}> Login with email</span>
            </Button>
          }
          {github &&
            <Button style={btnStyle} onClick={githubLoginHandler}>
              <FontAwesomeIcon icon={faGithub}></FontAwesomeIcon>
              <span style={btnText}> Login with Github</span>
            </Button>
          }
        </div>
      </Container>
    </Section>
  );
}

export default Start;