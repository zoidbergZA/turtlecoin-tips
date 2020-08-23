import React, { useState } from 'react';
import app from '../../base';
import * as firebase from 'firebase/app';
// import { AuthContext } from '../../contexts/Auth';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import CreateAccountForm from './CreateAccountForm';
import Spinner from '../Spinner/Spinner';

const Login = ({ history }) => {
  // const { currentUser } = useContext(AuthContext);
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
          // TODO: maybe set busy here and wait for auth user redirect?
          history.push('/');
          setBusyMessage(null);
        }).catch(function(error) {
          console.error(`${error.errorCode} :: ${error.errorMessage}`);
          setErrorMessage(error.errorMessage);
          setBusyMessage(null);
        });
      });
    } catch (error) {
      setErrorMessage(error.message);
      setBusyMessage(null);
    }
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