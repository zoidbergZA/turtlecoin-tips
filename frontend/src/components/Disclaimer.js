import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import app from '../base';

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
    <React.Fragment>
      <Typography variant="h4" component="h4">
        Disclaimer
      </Typography>
      <Typography variant="h5" component="h5">
        Before we continue, please take a minute to read and agree to the below statements.
      </Typography>
      <Typography variant="body2" component="p">
        I understand that no warranty or guarantee is provided, expressed, or implied when
        using this app and any funds lost in using this app are not the responsibility of the
        application creator, publisher, or distributor.
      </Typography>
      <Typography variant="body2" component="p">
        I Understand that this is a beta version which is still undergoing final testing. The
        platform, its software and all content found on it are provided on an
        “as is” and “as available” basis. TurtleCoin Tips does not give any warranties,
        whether express or implied, as to the suitability or usability of the
        app, its software or any of its content.
      </Typography>
      {!busy && !done &&
        <Button
          color="primary"
          onClick={() => agreeHandler()}
          style={{ marginTop: "20px" }}>I agree</Button>
      }
      <p style={{ color: "red" }}>{errorMsg}</p>
    </React.Fragment>
  );
}

export default Disclaimer;