import React, { useContext } from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';
import Typography from '@material-ui/core/Typography';

import { toAmountText } from '../utils';
import { AuthContext } from '../contexts/Auth';
import { TurtleAccountContext } from '../contexts/Account';
import History from './History/History';

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  const { turtleAccount } = useContext(TurtleAccountContext);

  return (
    <React.Fragment>
      {currentUser.email && !currentUser.emailVerified && (
        <Alert severity="info">
          <AlertTitle>Verify your email address</AlertTitle>
          Your email address <span style={{ textDecoration: "underline" }}>{currentUser.email}</span> has not yet been verified. Verify your email address to access the coins associated with that account. Click here to re-send the verification email.
        </Alert>
      )}
      <Typography variant="h4" component="h4">
        {toAmountText(turtleAccount.balanceUnlocked)}
      </Typography>
      <History />
    </React.Fragment>
  );
}

export default Home;