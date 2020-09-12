import React from 'react';
import Moment from 'react-moment';
import { Card, CardContent, Typography, makeStyles } from '@material-ui/core';
import styles from './Transaction.module.scss';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

const Transaction = ({ tx }) => {
  const txInfoStyles = [styles.info];
  const amountStyles = [];
  const classes = useStyles();

  if (tx.status === 'failed') {
    txInfoStyles.push(styles.error);
    amountStyles.push(styles.faded);
  }

  return (
    <Card>
      <CardContent className={classes.content}>
        <Typography variant="body2" component="span">
          <Moment unix format="LT">{tx.timestamp / 1000}</Moment>
        </Typography>
        <Typography variant="body2" component="span">
        {tx.transferType}
        </Typography>
        <Typography variant="body2" component="span">
          {getInfoText(tx)}
        </Typography>
        <Typography variant="body2" component="span">
          {getAmountText(tx)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getInfoText(tx) {
  switch (tx.transferType) {
    case 'deposit':
    case 'withdrawal':
      if (tx.status === 'failed')
        return 'FAILED'
      else
        return tx.txHash;
    case 'tip':
      if (tx.amount > 0)
      return `from @${tx.senderUsername}`;
      else
        return `to @${tx.recipientUsername}`;
    case 'tipRefund':
      return `from @${tx.senderUsername}`;
    default:
      return '';
  }
}

function getAmountText(tx) {
  let text = tx.status === 'confirming' ? "(confirming) " : "";

  if (tx.amount > 0) {
    text += '+';
  }

  text += `${((tx.amount + tx.fee) / 100).toFixed(2)} TRTL`;

  return text;
}

export default Transaction;