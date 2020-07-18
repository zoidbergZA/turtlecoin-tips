import React, { useContext } from 'react';
import Button from 'react-bulma-components/lib/components/button';
import app from '../base';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';

const Home = () => {
  let accountView;

  const turtleAccount = useContext(TurtleAccountContext);

  if (turtleAccount) {
    accountView = <AccountOverview account={turtleAccount} />
  } else {
    accountView = <p>loading...</p>
  }

  return (
    <div>
      <h1 >USERSNAME</h1>
      {accountView}
      <Button color="primary" onClick={() => app.auth().signOut()}>Logout</Button>
    </div>
  );
}

export default Home;