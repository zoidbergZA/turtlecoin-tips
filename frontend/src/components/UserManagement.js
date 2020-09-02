import React, { useState, useEffect } from 'react';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import app from '../base';
import useQueryParams from '../hooks/useQueryParams';
import Spinner from './Spinner/Spinner';

const UserManagement = () => {
  const [actionResult, setActionResult] = useState(null);
  const query = useQueryParams(); // TODO: use memo, add use effect dep

  useEffect(() => {
    const mode        = query.get('mode');
    const actionCode  = query.get('oobCode');
    // const apiKey      = query.get('apiKey');
    const continueUrl = query.get('continueUrl');
    const lang        = query.get('lang');

    const handleVerifyEmail = async (actionCode, continueUrl, lang) => {
      console.log(`handle verify email, action code: ${actionCode}`);

      // try to apply the email verification code.
      try {
        await app.auth().applyActionCode(actionCode);
        await fetch(continueUrl);

        // TODO: Display a confirmation message to the user.
        // You could also provide the user with a link back to the app.
        setActionResult((
          <div>email address successfully verified!</div>
        ));

        // TODO: If a continue URL is available, display a button which on
        // click redirects the user back to the app via continueUrl with
        // additional state determined from that URL's parameters.
      } catch (error) {
        // Code is invalid or expired. Ask the user to verify their email address
        // again.
        console.log(error);

        setActionResult((
          <div>Code is invalid or expired.</div>
        ));
      }
    }

    // Handle the user management action.
    switch (mode) {
      // case 'resetPassword':
      //   // Display reset password handler and UI.
      //   handleResetPassword(auth, actionCode, continueUrl, lang);
      //   break;
      // case 'recoverEmail':
      //   // Display email recovery handler and UI.
      //   handleRecoverEmail(auth, actionCode, lang);
      //   break;
      case 'verifyEmail':
        // Display email verification handler and UI.
        handleVerifyEmail(actionCode, continueUrl, lang);
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (actionResult) {
    return (
      <Section>
        <Container>
            {actionResult}
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Container>
          <Spinner />
      </Container>
    </Section>
  );
}

export default UserManagement;