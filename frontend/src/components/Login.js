import React, { useContext } from 'react';
import app from '../base';
import * as firebase from 'firebase/app';
import { AuthContext } from '../contexts/Auth';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import { Redirect } from 'react-router';

const Login = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <Section>
      <Container>
        <Heading>Sign in with email</Heading>
          <p>sign in</p>
          <p>create account</p>
      </Container>
    </Section>
  );
}

export default Login;