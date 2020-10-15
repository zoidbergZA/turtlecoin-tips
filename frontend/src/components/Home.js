import React, { useContext } from 'react';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { AuthContext } from '../contexts/Auth';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';
import Spinner from './Spinner/Spinner';
import History from './History/History';

const Home = () => {
  let accountView;
  let verifyEmailMessage;

  const { currentUser } = useContext(AuthContext);
  const { turtleAccount } = useContext(TurtleAccountContext);

  if (currentUser && currentUser.email && !currentUser.emailVerified) {
    verifyEmailMessage = (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" component="h2">
            Verify your email address
          </Typography>
          <Typography variant="body2" component="p">
            Your email address <span style={{ textDecoration: "underline" }}>{currentUser.email}</span> has not yet been verified. Verify your email address to access the coins associated with that account. Click here to re-send the verification email.
          </Typography>
        </CardContent>
      </Card>
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