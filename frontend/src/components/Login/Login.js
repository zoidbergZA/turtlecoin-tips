import React, { useState, useContext } from 'react';
import app from '../../base';
import * as firebase from 'firebase/app';
import { Redirect } from 'react-router';
// import { TurtleAccountContext } from '../../contexts/Account';
import { AuthContext } from '../../contexts/Auth';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import CreateAccountForm from './CreateAccountForm';
import Spinner from '../Spinner/Spinner';

const Login = ({ history }) => {
  // const { turtleAccount } = useContext(TurtleAccountContext);
  const { currentUser } = useContext(AuthContext);
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
      await app.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const credentials = await app.auth().createUserWithEmailAndPassword(data.email, data.password);
      await credentials.user.sendEmailVerification();

      // history.push('/');
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message);
      setBusyMessage(null);
    }
  }

  if (currentUser) {
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
        <Heading size={5}>Sign in</Heading>
        <Heading size={5}>Create account</Heading>
        <div style={{ width: "320px", display : 'inline-block' }}>
          <CreateAccountForm errorMessage={errorMessage} onSubmit={createAccount} />
        </div>
      </Container>
    </Section>
  );
}

export default Login;