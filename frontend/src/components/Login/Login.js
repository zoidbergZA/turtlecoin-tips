import React, { useState, useContext } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../base';
import * as firebase from 'firebase/app';
import { Redirect } from 'react-router';
import { AuthContext } from '../../contexts/Auth';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import CreateAccountForm from './CreateAccountForm';
import Spinner from '../Spinner/Spinner';
import LoginForm from './LoginForm';

const Login = ({ history }) => {
  const { currentUser } = useContext(AuthContext);
  const [registerErrorMessage, setRegisterErrorMessage] = useState(null);
  const [loginErrorMessage, setLoginErrorMessage] = useState(null);
  const [busyMessage, setBusyMessage] = useState(null);

  const login = async (data) => {
    setLoginErrorMessage(null);
    setBusyMessage('login in...');

    try {
      await signInWithEmailAndPassword(data.email, data.password);
    } catch (error) {
      console.log(error);
      setLoginErrorMessage(error.message);
      setBusyMessage(null);
    }
  }

  const createAccount = async (data) => {
    setRegisterErrorMessage(null);

    if (data.password !== data.confirmPassword) {
      setRegisterErrorMessage('password does not match.');
      return;
    }

    setBusyMessage('creating account...');

    try {
      await createUserWithEmailAndPassword(data.email, data.password);
    } catch (error) {
      console.log(error);
      setRegisterErrorMessage(error.message);
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
        <div style={{ width: "320px", display : 'inline-block' }}>
          <LoginForm errorMessage={loginErrorMessage} onSubmit={login} />
        </div>
        <div style={{paddingTop: "40px"}}></div>
        <Heading size={5}>Create account</Heading>
        <div style={{ width: "320px", display : 'inline-block' }}>
          <CreateAccountForm errorMessage={registerErrorMessage} onSubmit={createAccount} />
        </div>
      </Container>
    </Section>
  );
}

export default Login;