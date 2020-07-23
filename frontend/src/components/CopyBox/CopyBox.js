import React from 'react';
import styles from './copyBox.module.scss'
import Icon from 'react-bulma-components/lib/components/icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const CopyBox = ({ data }) => {

  const copyAddressHandler = () => {
    console.log('copied!');
  }

  return (
    <div className={styles.box}>
      <div className={styles.item}>
        <p>{data}</p>
      </div>
      <div className={styles.btn}>
      <CopyToClipboard text={data} onCopy={copyAddressHandler}>
        <Icon>
          <FontAwesomeIcon icon={faCopy} />
        </Icon>
      </CopyToClipboard>
      </div>
    </div>
  )
}

export default CopyBox;