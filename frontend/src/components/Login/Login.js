import React, { useState, useContext } from 'react';
import app from '../../base';
import * as firebase from 'firebase/app';
import { Redirect } from 'react-router';
import { TurtleAccountContext } from '../../contexts/Account'
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import CreateAccountForm from './CreateAccountForm';
import Spinner from '../Spinner/Spinner';

const Login = () => {
  const { turtleAccount } = useContext(TurtleAccountContext);
  const [errorMessage, setErrorMessage] = useState(null);
  const [busyMessage, setBusyMessage]   = useState(null);

  const createAccount = async (data) => {
    setErrorMessage(null);

    if (data.password !== data.confirmPassword) {
      setErrorMessage('password does not match.');
      return;
    }

    setBusyMessage('creating account...');

    try {
      app.auth().setPersistence(firebase.auth.Auth.Persistence.NONE).then(() => {
        app.auth().createUserWithEmailAndPassword(data.email, data.password).then(function(result) {
          // wait for new turtle account to be created before redirecting...
        }).catch(function(error) {
          setErrorMessage(error.message);
          setBusyMessage(null);
        });
      });
    } catch (error) {
      setErrorMessage(error.message);
      setBusyMessage(null);
    }
  }

  if (turtleAccount) {
    return <Redirect to="/" />;
  }

  if (busyMessage) {
    return (
      <Section>
        <Container>
          <div style={{ paddingTop: "50px", paddingBottom: "20px" }}>
            <Spinner message={busyMessage} />
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        <Heading>Sign in with email</Heading>
          <p>Sign in</p>
          <p>Create account</p>
          <CreateAccountForm errorMessage={errorMessage} onSubmit={createAccount} />
      </Container>
    </Section>
  );
}

export default Login;