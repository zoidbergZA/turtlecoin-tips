import React from 'react';
import copyBox from './copyBox.scss'
import Button from 'react-bulma-components/lib/components/button';
import Icon from 'react-bulma-components/lib/components/icon';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const CopyBox = ({ data }) => {
  return (
    <div className="data-box">
      <div className="data-item">
      <p>{data}</p>
      </div>
      <div className="copy-btn">
      <Icon>
      <FontAwesomeIcon icon={faCopy} />
    </Icon>
      </div>
    </div>
  )
}

export default CopyBox;