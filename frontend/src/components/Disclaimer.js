import React, { useState } from 'react';
import app from '../base';
import Heading from 'react-bulma-components/lib/components/heading';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Button from 'react-bulma-components/lib/components/button';

const Disclaimer = () => {
  const [busy, setBusy]         = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [done, setDone]         = useState(false);

  const agreeHandler = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await app.functions().httpsCallable('webApp-userAgreeDisclaimer')();
      setDone(true);
    } catch (error) {
      setErrorMsg('An error occured, please try again later.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section>
      <Container style={{ maxWidth: "890px" }}>
        <Heading size={2}>Disclaimer</Heading>
        <Heading size={6}>Before we continue, please take a minute to read and agree to the below statements.</Heading>
        <p>
          I understand that no warranty or guarantee is provided, expressed, or implied when
          using this app and any funds lost in using this app are not the responsibility of the
          application creator, publisher, or distributor.
        </p>
        <p style={{ marginTop: "20px" }}>
          I Understand that this is a beta version which is still undergoing final testing. The
          platform, its software and all content found on it are provided on an
          “as is” and “as available” basis. TurtleCoin Tips does not give any warranties,
          whether express or implied, as to the suitability or usability of the
          app, its software or any of its content.
        </p>
        <Button
          loading={busy || done}
          color="primary"
          onClick={() => agreeHandler()}
          style={{ marginTop: "20px" }}>I agree</Button>
        <p style={{ color: "red" }}>{errorMsg}</p>
        </Container>
    </Section>
  );
}

export default Disclaimer;