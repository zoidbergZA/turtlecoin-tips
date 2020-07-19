import React, { useContext } from 'react';
import { TurtleAccountContext } from '../contexts/Account';
import AccountOverview from './AccountOverview';
import Container from 'react-bulma-components/lib/components/container';
import Section from 'react-bulma-components/lib/components/section';

const Home = () => {
  let accountView;

  const { turtleAccount } = useContext(TurtleAccountContext);

  if (turtleAccount) {
    accountView = <AccountOverview {...turtleAccount} />
  } else {
    accountView = <p>loading...</p>
  }

  return (
    <React.Fragment>
      <Section>
        <Container>
          {accountView}
        </Container>
      </Section>
    </React.Fragment>
  );
}

export default Home;