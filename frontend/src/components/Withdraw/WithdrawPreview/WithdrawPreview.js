import React from 'react';
import styles from './withdrawPreview.module.scss';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import Level from 'react-bulma-components/lib/components/level';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

const WithdrawPreview = ({ preparedTx, onConfirm, onBack }) => {
  const fees = preparedTx.fees.nodeFee + preparedTx.fees.serviceFee + preparedTx.fees.txFee;

  return (
    <Section>
      <Container>
        <Heading>Confirm send</Heading>
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
              <td className={styles["tbl-value"]}>{fees / 100} TRTL</td>
            </tr>
          </tbody>
        </table>
        </div>
        <Section>
          <Level>
            <Level.Item type="left">
              <Button onClick={onBack}>
                <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
                <span className="btn-icon-text">back</span>
              </Button>
            </Level.Item>
            <Level.Item type="right">
              <Button onClick={onConfirm} color="primary">
                <FontAwesomeIcon icon={faPaperPlane}></FontAwesomeIcon>
                <span className="btn-icon-text">confirm</span>
              </Button>
            </Level.Item>
          </Level>
        </Section>
      </Container>
    </Section>
  );
}

export default WithdrawPreview;