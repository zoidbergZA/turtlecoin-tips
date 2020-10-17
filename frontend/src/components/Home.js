import React, { useContext } from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';

import { AuthContext } from '../contexts/Auth';
import { TurtleAccountContext } from '../contexts/Account';
import Spinner from './Spinner/Spinner';
import History from './History/History';

const Home = () => {
  let accountView;
  let verifyEmailMessage;

  const { currentUser } = useContext(AuthContext);
  const { turtleAccount } = useContext(TurtleAccountContext);

  if (currentUser && currentUser.email && !currentUser.emailVerified) {
    verifyEmailMessage = (
      <Alert severity="info">
        <AlertTitle>Verify your email address</AlertTitle>
        Your email address <span style={{ textDecoration: "underline" }}>{currentUser.email}</span> has not yet been verified. Verify your email address to access the coins associated with that account. Click here to re-send the verification email.
      </Alert>
    )
  }

  if (turtleAccount) {
    accountView = <History />
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