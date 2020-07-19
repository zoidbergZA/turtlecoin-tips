import React, { useContext } from 'react';
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
    </div>
  );
}

export default Home;