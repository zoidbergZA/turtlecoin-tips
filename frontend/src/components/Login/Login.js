import React, { useState, useContext } from 'react';
import { Redirect } from 'react-router';
import Typography from '@material-ui/core/Typography';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../base';
import { AuthContext } from '../../contexts/Auth';
import CreateAccountForm from './CreateAccountForm';
import Spinner from '../Spinner/Spinner';
import LoginForm from './LoginForm';

const Login = () => {
  const { currentUser } = useContext(AuthContext);
  const [registerErrorMessage, setRegisterErrorMessage] = useState(null);
  const [loginErrorMessage, setLoginErrorMessage] = useState(null);
  const [busyMessage, setBusyMessage] = useState(null);

  const login = async (data) => {
    console.log(data)

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
      <div style={{ paddingTop: "50px", paddingBottom: "20px" }}>
        <Spinner message={busyMessage} />
      </div>
    );
  }

  return (
    <React.Fragment>
      <Typography variant="h4" component="h4">
        Sign in with email
      </Typography>
      <div style={{ width: "320px", display : 'inline-block' }}>
        <LoginForm errorMessage={loginErrorMessage} onSubmit={login} />
      </div>
      <div style={{paddingTop: "40px"}}></div>
      <Typography variant="h4" component="h4">
        Create account
      </Typography>
      <div style={{ width: "320px", display : 'inline-block' }}>
        <CreateAccountForm errorMessage={registerErrorMessage} onSubmit={createAccount} />
      </div>
    </React.Fragment>
  );
}

export default Login;