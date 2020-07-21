import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import withdraw from './withdraw.scss';
import * as Form from 'react-bulma-components/lib/components/form';
import Section from 'react-bulma-components/lib/components/section';
import Button from 'react-bulma-components/lib/components/button';
import Box from 'react-bulma-components/lib/components/box';
import Heading from 'react-bulma-components/lib/components/heading';
import Level from 'react-bulma-components/lib/components/level';
import Spinner from '../Spinner/Spinner';
import app from '../../base';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

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
      console.log(`send prepared withdrawal: ${preparedTx.id}`);

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
        <Box>
          <div style={{ paddingTop: "50px", paddingBottom: "20px" }}>
            <Spinner message={busyMessage} />
          </div>
        </Box>
      </Section>
    );
  }

  if (withdrawal) {
    return (
      <Section>
        <Box>
          <p>success!</p>
          <p>tx hash: {withdrawal.txHash} </p>
        </Box>
      </Section>
    );
  }

  if (preparedTx) {
    const fees = preparedTx.fees.nodeFee + preparedTx.fees.serviceFee + preparedTx.fees.txFee;

    return (
      <Section>
        <Box>
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
        </Box>
      </Section>
    );
  }

  return (
    <Section>
      <Box>
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
            <Form.Control>
              <Button type="submit" value="Submit" disabled={!formState.isValid}>continue</Button>
            </Form.Control>
          </Form.Field>
        </form>
      </Box>
    </Section>
  );
};

export default Withdraw;