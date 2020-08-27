import React, { useContext } from 'react';
import Container from 'react-bulma-components/lib/components/container';
import Section from 'react-bulma-components/lib/components/section';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';
import Spinner from './Spinner/Spinner';

const Home = () => {
  let accountView;

  const { turtleAccount } = useContext(TurtleAccountContext);

  if (turtleAccount) {
    accountView = <AccountOverview {...turtleAccount} />
  } else {
    // TODO: in the case where user has only email login and not yet verfied, dont show spinner but only verify account message
    accountView = (
      <Section>
        <Container>
          <Spinner />
        </Container>
      </Section>
    );
  }

  return (
    <React.Fragment>
      {accountView}
    </React.Fragment>
  );
}

export default Home;