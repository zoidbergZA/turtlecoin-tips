import React, { useContext } from 'react';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';

const Home = () => {
  let accountView;

  const { turtleAccount } = useContext(TurtleAccountContext);

  if (turtleAccount) {
    accountView = <AccountOverview {...turtleAccount} />
  } else {
    accountView = null;
  }

  return (
    <React.Fragment>
      {accountView}
    </React.Fragment>
  );
}

export default Home;