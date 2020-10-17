import React from 'react';
import styles from './withdrawPreview.module.scss';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const WithdrawPreview = ({ preparedTx, onConfirm, onBack }) => {
  const { nodeFee, serviceFee, txFee } = preparedTx.fees;
  const totalFees = nodeFee + serviceFee + txFee;

  return (
    <React.Fragment>
      <Typography variant="h4" component="h4">
        Confirm send
      </Typography>
      <p className="address-text">{preparedTx.address}</p>
      <div className={styles["amounts-box"]}>
        <table>
          <tbody>
            <tr>
              <td className={styles["tbl-label"]}>amount:</td>
              <td className={styles["tbl-value"]}>{preparedTx.amount / 100} TRTL</td>
            </tr>
            <tr>
              <td className={styles["tbl-label"]}>fee:</td>
              <td className={styles["tbl-value"]}>{totalFees / 100} TRTL</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Button onClick={onBack}>
        <span>back</span>
      </Button>
      <Button onClick={onConfirm} color="primary">
        <span>confirm</span>
      </Button>
    </React.Fragment>
  );
}

export default WithdrawPreview;