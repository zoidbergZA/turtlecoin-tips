import React, { useContext } from 'react';
import Container from 'react-bulma-components/lib/components/container';
import Section from 'react-bulma-components/lib/components/section';
import Message from 'react-bulma-components/lib/components/message';
import { AuthContext } from '../contexts/Auth';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';
import Spinner from './Spinner/Spinner';

const Home = () => {
  let accountView;
  let verifyEmailMessage;

  const { currentUser } = useContext(AuthContext);
  const { turtleAccount } = useContext(TurtleAccountContext);

  if (currentUser && currentUser.email && !currentUser.emailVerified) {
    verifyEmailMessage = (
      <Message color="info">
        <Message.Header>Verify your email address</Message.Header>
        <Message.Body>
          Your email address <span style={{ textDecoration: "underline" }}>{currentUser.email}</span> has not yet been verified. Verify your email address to access the coins associated with that account. Click here to re-send the verification email.
        </Message.Body>
      </Message>
    )
  }

  if (turtleAccount) {
    accountView = <AccountOverview {...turtleAccount} />
  } else if (currentUser.primaryAccountId) {
    accountView = <Spinner />;
  }

  return (
    <div>
      {verifyEmailMessage}
      {accountView}
    </div>
  );
}

export default Home;