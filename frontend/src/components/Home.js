import React, { useContext } from 'react';
import Button from 'react-bulma-components/lib/components/button';
import app from '../base';
import { AuthContext } from '../contexts/Auth';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';

const Home = () => {
  let accountView;

  const { currentUser } = useContext(AuthContext);
  const { turtleAccount } = useContext(TurtleAccountContext);

  if (turtleAccount) {
    accountView = <AccountOverview {...turtleAccount} />
  } else {
    accountView = <p>loading...</p>
  }

  return (
    <div>
      <h1 >{ currentUser ? currentUser.username : '' }</h1>
      {accountView}
      <Button color="primary" onClick={() => app.auth().signOut()}>Logout</Button>
    </div>
  );
}

export default Home;