import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import withdraw from './withdraw.scss';
import * as Form from 'react-bulma-components/lib/components/form';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Button from 'react-bulma-components/lib/components/button';
import Box from 'react-bulma-components/lib/components/box';
import Heading from 'react-bulma-components/lib/components/heading';
import Level from 'react-bulma-components/lib/components/level';
import Spinner from '../Spinner/Spinner';
import CopyBox from '../CopyBox/CopyBox';
import app from '../../base';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faChevronLeft, faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons';

const Withdraw = () => {
  const [busyMessage, setBusyMessage]   = useState(null);
  const [preparedTx, setPreparedTx]     = useState(null);
  const [withdrawal, setWithdrawal]     = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const { handleSubmit, errors, control, formState } = useForm({ mode: 'onChange' });

  const onSubmit = async (data) => {
    setErrorMessage(null);
    setBusyMessage('preparing transaction...');

    try {
      const prepareWithdrawal = app.functions().httpsCallable('userPrepareWithdrawal');
      const prepareResult = await prepareWithdrawal({
        address: data.address,
        amount: Math.ceil(data.amount * 100)
      });

      setPreparedTx(prepareResult.data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyMessage(null);
    }
  };

  const onConfirm = async () => {
    setBusyMessage('sending transaction...');

    try {
      const sendWithdrawal = app.functions().httpsCallable('userWithdraw');
      const sendResult = await sendWithdrawal({ preparedTxId: preparedTx.id });

      setWithdrawal(sendResult.data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setPreparedTx(null);
      setBusyMessage(null);
    }
  }

  const onBack = () => {
    setPreparedTx(null);
  }

  if (busyMessage) {
    return (
      <Section>
        <Container>
          <div style={{ paddingTop: "50px", paddingBottom: "20px" }}>
            <Spinner message={busyMessage} />
          </div>
        </Container>
      </Section>
    );
  }

  if (withdrawal) {
    return (
      <Section>
        <Container>
          <Heading>Transaction sent!</Heading>
          <p>hash:</p>
          <div style={{ maxWidth: "600px", display: "inline-block" }}>
            <CopyBox data={withdrawal.txHash}></CopyBox>
          </div>
          <Section>
            <Button to="/" renderAs={Link}>
              <FontAwesomeIcon icon={faCheck}></FontAwesomeIcon>
              <span className="btn-icon-text">done</span>
            </Button>
          </Section>
          </Container>
      </Section>
    );
  }

  if (preparedTx) {
    const fees = preparedTx.fees.nodeFee + preparedTx.fees.serviceFee + preparedTx.fees.txFee;

    return (
      <Section>
        <Container>
          <Heading>Confirm send</Heading>
          <p className="address-text">{preparedTx.address}</p>
          <div className="amounts-box">
            <table>
            <tbody>
              <tr>
                <td className="tbl-label">amount:</td>
                <td className="tbl-value">{preparedTx.amount / 100} TRTL</td>
              </tr>
              <tr>
                <td className="tbl-label">fee:</td>
                <td className="tbl-value">{fees / 100} TRTL</td>
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

  return (
    <Section>
      <Container>
        <Heading>Withdraw</Heading>
        {
          !!errorMessage &&
          <p style={{ color: "red" }}>{errorMessage}</p>
        }
        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Field>
            <label>Address</label>
            <Form.Control>
              <Controller
                as={Form.Input}
                name="address"
                placeholder="TRTL address"
                defaultValue=""
                control={control}
                rules={{ required: true }}
              />
            </Form.Control>
            <Form.Help color="danger">
              {errors.FirstName && "This field is required"}
            </Form.Help>
          </Form.Field>
          <Form.Field>
            <label>Amount</label>
            <Form.Control>
              <Controller
                as={Form.Input}
                name="amount"
                type="number"
                control={control}
                defaultValue=""
                placeholder="0.00"
                rules={{ required: true }}
              />
            </Form.Control>
          </Form.Field>
          <Form.Field>
            <Level>
            <Level.Item type="left">
              <Button to="/" renderAs={Link}>
                <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
                <span className="btn-icon-text">back</span>
              </Button>
            </Level.Item>
            <Level.Item type="right">
            <Form.Control>
              <Button
                color="primary"
                type="submit"
                value="Submit"
                disabled={!formState.isValid}
              >
                <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
                <span className="btn-icon-text">continue</span>
              </Button>
            </Form.Control>
            </Level.Item>
            </Level>
          </Form.Field>
        </form>
      </Container>
    </Section>
  );
};

export default Withdraw;