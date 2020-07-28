import React from 'react';
import { Link } from 'react-router-dom';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import CopyBox from '../../CopyBox/CopyBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const WithdrawResult = ({ withdrawal }) => {
  return (
    <Section>
      <Container>
        <Heading>Transaction sent!</Heading>
        <p>hash:</p>
        <div style={{ maxWidth: "600px", display: "inline-block" }}>
          <CopyBox data={withdrawal.txHash}></CopyBox>
        </div>
        <Section>
          <Button to="/" renderAs={Link}>
            <FontAwesomeIcon icon={faCheck}></FontAwesomeIcon>
            <span className="btn-icon-text">done</span>
          </Button>
        </Section>
        </Container>
    </Section>
  );
}

export default WithdrawResult;