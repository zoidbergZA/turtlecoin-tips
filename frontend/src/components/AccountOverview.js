import React from 'react';
import CopyBox from './CopyBox/CopyBox';
import Heading from 'react-bulma-components/lib/components/heading';
import Container from 'react-bulma-components/lib/components/container';
import Image from 'react-bulma-components/lib/components/image';
import Section from 'react-bulma-components/lib/components/section';
import Button from 'react-bulma-components/lib/components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEject } from '@fortawesome/free-solid-svg-icons';

const AccountOverview = ( {depositAddress, depositQrCode, balanceLocked, balanceUnlocked} ) => {
  let amountLocked;

  if (balanceLocked > 0) {
    amountLocked = <Heading size={5} marginless={true}>(+{(balanceLocked / 100).toFixed(2)})</Heading>
  }

  return (
    <Section>
      <Container>
        <Heading size={1} marginless={true}>{(balanceUnlocked / 100).toFixed(2)} TRTL</Heading>
        {amountLocked}
        <div style={{ width: 320, display : 'inline-block' }}>
          <Image src={depositQrCode} size="1by1"></Image>
        </div>
        <p>deposit address:</p>
        <CopyBox data={depositAddress} />
        <Button><FontAwesomeIcon icon={faEject}></FontAwesomeIcon> withdraw</Button>
      </Container>
    </Section>
  );
}

export default AccountOverview;