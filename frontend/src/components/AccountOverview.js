import React from 'react';
import Heading from 'react-bulma-components/lib/components/heading';
import Container from 'react-bulma-components/lib/components/container';
import Image from 'react-bulma-components/lib/components/image';

const AccountOverview = ( {depositAddress, depositQrCode, balanceLocked, balanceUnlocked} ) => {
  let amountLocked;
  balanceLocked = 4420;
  if (balanceLocked > 0) {
    amountLocked = <Heading size={5} marginless={true}>(+{(balanceLocked / 100).toFixed(2)})</Heading>
  }

  return (
    <React.Fragment>
      <Heading size={1} marginless={true} textAlignment="center">{(balanceUnlocked / 100).toFixed(2)} TRTL</Heading>
      {amountLocked}
      <div style={{ width: 320 }}>
        <Image src={depositQrCode} size="1by1"></Image>
      </div>
      <p>deposit address: {depositAddress}</p>
    </React.Fragment>
  );
}

export default AccountOverview;