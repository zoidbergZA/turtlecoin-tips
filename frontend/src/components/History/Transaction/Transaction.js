import React from 'react';
import Moment from 'react-moment';
import { Card, CardContent, Typography, makeStyles, Icon } from '@material-ui/core';
import ArrowUpwardRoundedIcon from '@material-ui/icons/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@material-ui/icons/ArrowDownwardRounded';
import styles from './Transaction.module.scss';
import AppIcon from 'components/SvgIcons/AppIcon';
import GithubIcon from 'components/SvgIcons/GithubIcon';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  spacer: {
    flexGrow: 1
  },
  itemGap: {
   marginLeft: '10px'
  },
  time: {
    minWidth: '80px'
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
        {
          tx.amount > 0
          ? <ArrowDownwardRoundedIcon color="primary"/>
          : <ArrowUpwardRoundedIcon color="secondary"/>
        }
        <Typography variant="body2" component="span" className={classes.itemGap, classes.time}>
          <Moment unix format="LT">{tx.timestamp / 1000}</Moment>
        </Typography>
        <div className={classes.itemGap}>
          {getPlatformIcon(tx)}
        </div>
        <Typography variant="body2" component="span" className={classes.itemGap}>
        {tx.transferType}
        </Typography>
        <Typography variant="body2" component="span" className={classes.itemGap}>
          {getInfoText(tx)}
        </Typography>
        <div className={classes.spacer}></div>
        <Typography variant="body2" component="span">
          {getAmountText(tx)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getPlatformIcon(tx) {
  switch (tx.platform) {
    case 'webapp':
      return <AppIcon/>
    case 'github':
      return <GithubIcon/>
    default:
      return null
  }
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