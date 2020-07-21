import React from 'react';
import transaction from './Transaction.scss';

const Transaction = ({ tx }) => {
  return (
    <tr>
      <td className="date-text">{convertTimestamp(tx.timestamp)}</td>
      <td>{tx.transferType}</td>
      <td><div className="info-text">{getInfoText(tx)}</div></td>
      <td>{getAmountText(tx)}</td>
    </tr>
  );
}

function getInfoText(tx) {
  switch (tx.transferType) {
    case 'deposit':
    case 'withdrawal':
      return tx.txHash;
    case 'tip':
      return `@${tx.recipientUsername}`;
    default:
      return '';
  }
}

function getAmountText(tx) {
  const prefix = tx.transferType == ('deposit' || 'tipRefund') ? '+' : '-';
  const amount = `${((tx.amount + tx.fee) / 100).toFixed(2)} TRTL`

  return `${prefix}${amount}`;
}

function convertTimestamp(timestamp) {
  var d = new Date(timestamp),
      yyyy = d.getFullYear(),
      mm = ('0' + (d.getMonth() + 1)).slice(-2),  // Months are zero based. Add leading 0.
      dd = ('0' + d.getDate()).slice(-2),         // Add leading 0.
      hh = d.getHours(),
      h = hh,
      min = ('0' + d.getMinutes()).slice(-2),     // Add leading 0.
      ampm = 'AM',
      time;

  if (hh > 12) {
      h = hh - 12;
      ampm = 'PM';
  } else if (hh === 12) {
      h = 12;
      ampm = 'PM';
  } else if (hh == 0) {
      h = 12;
  }

  // ie: 2014-03-24, 3:00 PM
  time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
  return time;
}

export default Transaction;