import React, { useState, useEffect, useRef } from 'react';
import styles from './copyBox.module.scss'
import Icon from 'react-bulma-components/lib/components/icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const CopyBox = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const copyAddressHandler = () => {
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const iconStyles = copied ? [styles.green] : [];

  return (
    <div className={styles.box}>
      <div className={styles.item}>
        {data}
      </div>
      <div className={styles.btn}>
      <CopyToClipboard text={data} onCopy={copyAddressHandler}>
        <Icon>
          <FontAwesomeIcon className={iconStyles.join(' ')} icon={copied ? faCheck : faCopy} />
        </Icon>
      </CopyToClipboard>
      </div>
    </div>
  )
}

export default CopyBox;