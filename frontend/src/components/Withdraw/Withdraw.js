import React, { useState } from 'react';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Spinner from '../Spinner/Spinner';
import app from '../../base';
import WithdrawForm from './WithdrawForm/WithdrawForm';
import WithdrawPreview from './WithdrawPreview/WithdrawPreview';
import WithdrawResult from './WithdrawResult/WithdrawResult';

const Withdraw = () => {
  const [busyMessage, setBusyMessage]   = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [preparedTx, setPreparedTx]     = useState(null);
  const [withdrawal, setWithdrawal]     = useState(null);

  const prepareWithdrawal = async (data) => {
    setErrorMessage(null);
    setBusyMessage('preparing transaction...');

    try {
      const prepare = app.functions().httpsCallable('webApp-userPrepareWithdrawal');
      const prepareResult = await prepare({
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

  const sendWithdrawal = async () => {
    try {
      const sendWithdrawal = app.functions().httpsCallable('webApp-userWithdraw');
      const sendResult = await sendWithdrawal({ preparedTxId: preparedTx.id });

      setWithdrawal(sendResult.data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setPreparedTx(null);
      setBusyMessage(null);
    }
  }

  const reset = () => {
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
    return <WithdrawResult withdrawal={withdrawal} />
  }

  if (preparedTx) {
    return <WithdrawPreview preparedTx={preparedTx} onConfirm={sendWithdrawal} onBack={reset} />
  }

  return <WithdrawForm errorMessage={errorMessage} onSubmit={prepareWithdrawal} />
};

export default Withdraw;