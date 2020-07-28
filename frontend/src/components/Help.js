import React from 'react'
import { Link } from 'react-router-dom';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Message from 'react-bulma-components/lib/components/message';
import Tag from 'react-bulma-components/lib/components/tag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

const Help = () => {
  return (
    <Section>
      <Container>
        <Heading>Help</Heading>
        <Message color="info">
          <Message.Header>.tip</Message.Header>
          <Message.Body>
            Use this command to send a tip to a Github user. Simply comment on an open issue on
            Github repo where this bot is added with the tip amount and mention the user to send the tip to, for example:
            <div style={{ paddingTop: "20px" }}>
              <Tag>.tip 4.20 @username</Tag>
            </div>
          </Message.Body>
        </Message>
        <Button to="/" renderAs={Link}>
          <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
          <span style={{ paddingLeft: "10px" }}>back</span>
        </Button>
      </Container>
    </Section>
  );
}

export default Help;