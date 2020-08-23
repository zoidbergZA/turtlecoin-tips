import React, { useState, useEffect, useContext } from 'react';
import { combineLatest } from 'rxjs';
import { mergeAll } from 'rxjs/operators';
import app from '../../base';
import { collectionData } from 'rxfire/firestore';
import { AuthContext } from 'contexts/Auth';
import Transaction from './Transaction/Transaction';
import Heading from 'react-bulma-components/lib/components/heading';
import Container from 'react-bulma-components/lib/components/container';
import Section from 'react-bulma-components/lib/components/section';
import Table from 'react-bulma-components/lib/components/table';
import Spinner from '../Spinner/Spinner';

const History = () => {
  const { currentUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.primaryAccountId) {
      collectionData(
        app.firestore()
        .collection(`users/${currentUser.uid}/turtle_accounts`)
      ).subscribe(accs => {
        const streams = accs.map(acc => {
          return collectionData(
            app.firestore().collection(`accounts/${acc.accountId}/transactions`)
            .orderBy('timestamp', 'desc')
            .limit(40)
          );
        });

        combineLatest(streams).pipe(mergeAll()).subscribe(txs => {
          setTransactions(txs);
        });
      });
    }
  }, [currentUser]);

  let history;

  if (transactions) {
    history = (
      <Table>
        <tbody>
          {transactions.map(tx => <Transaction key={tx.id} tx={tx}></Transaction>)}
        </tbody>
      </Table>
    )
  } else {
    history = <Spinner />
  }

  return (
    <React.Fragment>
      <Heading>Transaction history</Heading>
      <Section>
        <Container>
          {history}
        </Container>
      </Section>
    </React.Fragment>
  );
}

export default History;