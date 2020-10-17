import React from 'react';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import CopyBox from '../../CopyBox/CopyBox';

const WithdrawResult = ({ withdrawal }) => {
  return (
    <React.Fragment>
      <Typography variant="h4" component="h4">
        Transaction successfully submitted for processing!
      </Typography>
      <p>hash:</p>
      <div style={{ maxWidth: "600px", display: "inline-block" }}>
        <CopyBox data={withdrawal.txHash}></CopyBox>
      </div>
      <Button to="/" renderAs={Link}>
        <span className="btn-icon-text">done</span>
      </Button>
    </React.Fragment>
  );
}

export default WithdrawResult;