import React, { useState, useEffect, useRef } from 'react';
import { green } from '@material-ui/core/colors';
import { FileCopy, Check } from '@material-ui/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './copyBox.module.scss'

const CopyBox = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const copyAddressHandler = () => {
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={styles.box}>
      <div className={styles.item}>
        {data}
      </div>
      <div className={styles.btn}>
      <CopyToClipboard text={data} onCopy={copyAddressHandler}>
        {copied ? <Check style={{ color: green[500] }} /> : <FileCopy />}
      </CopyToClipboard>
      </div>
    </div>
  )
}

export default CopyBox;