import React from 'react';
import Moment from 'react-moment';
import { Card, CardContent, Typography, makeStyles, useTheme, Hidden } from '@material-ui/core';
import withWidth from '@material-ui/core/withWidth';
import ArrowUpwardRoundedIcon from '@material-ui/icons/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@material-ui/icons/ArrowDownwardRounded';

import { toAmountText } from '../../../utils';
import styles from './Transaction.module.scss';
import AppIcon from 'components/SvgIcons/AppIcon';
import GithubIcon from 'components/SvgIcons/GithubIcon';
import CopyBox from 'components/CopyBox/CopyBox';

const useStyles = makeStyles(theme => ({
  content: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  spacer: {
    flexGrow: 1
  },
  copyBox: {
    margin: theme.spacing(1),
    flexFlow: 'row wrap',
    overflow: 'hidden',
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
  },
  amount: {
    minWidth: '100px'
  },
  itemGap: {
   marginLeft: theme.spacing(1)
  },
  infoText: {
    marginLeft: theme.spacing(2)
  },
  time: {
    minWidth: '80px'
  },
  hash: {
    fontFamily: 'Hack',
    fontSize: 'small'
  }
}));

const Transaction = ({ tx, width }) => {
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
        <Typography variant="body2" component="span" className={[classes.itemGap, classes.time].join(' ')}>
          <Moment unix format="LT">{tx.timestamp / 1000}</Moment>
        </Typography>
        {getPlatformIcon(tx, classes)}
        <Hidden xsDown>
          <p className={classes.infoText}>
            <Typography variant="body2" component="span" className={classes.itemGap}>
              {getInfoText(tx)}
            </Typography>
          </p>
        </Hidden>
        <Hidden xsDown mdUp>
          {getTxHash(tx, true, classes)}
        </Hidden>
        <Hidden smDown>
          {getTxHash(tx, false, classes)}
        </Hidden>
        <div className={classes.spacer}></div>
        <Typography variant="body2" component="span" className={classes.amount}>
          {getTxAmount(tx)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getPlatformIcon(tx, classes) {
  switch (tx.platform) {
    case 'webapp':
      return <AppIcon className={classes.itemGap}/>
    case 'github':
      return <GithubIcon className={classes.itemGap}/>
    default:
      return null
  }
}

function getTxHash(tx, short, classes) {
  if (!tx.txHash) {
    return null;
  }

  if (short) {
    return (
      <Typography variant="body2" component="span" className={[classes.itemGap, classes.hash].join(' ')}>
        hash: {truncate(tx.txHash, 14)}
      </Typography>
    );
  } else {
    return (
      <div className={classes.copyBox}>
        <CopyBox data={tx.txHash}></CopyBox>
      </div>
    )
  }
}

function getInfoText(tx) {
  switch (tx.transferType) {
    case 'tip':
      if (tx.amount > 0)
        return `tip from @${tx.senderUsername}`;
      else
        return `tip to @${tx.recipientUsername}`;
    case 'tipRefund':
      return `tip refund from @${tx.senderUsername}`;
    default:
      return '';
  }
}

function getTxAmount(tx) {
  let text = tx.status === 'confirming' ? "(confirming) " : "";

  if (tx.amount > 0) {
    text += '+';
  }

  text += `${toAmountText(tx.amount + tx.fee)}`;

  return text;
}

function truncate(fullStr, strLen) {
  if (fullStr.length <= strLen) {
    return fullStr;
  }

  const separator = '...';

  const sepLen = separator.length,
      charsToShow = strLen - sepLen,
      frontChars = Math.ceil(charsToShow/2),
      backChars = Math.floor(charsToShow/2);

  return fullStr.substr(0, frontChars) +
         separator +
         fullStr.substr(fullStr.length - backChars);
};

export default withWidth()(Transaction);