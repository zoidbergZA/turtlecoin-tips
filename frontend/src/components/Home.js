import React, { useState, useEffect } from 'react';
import { authState } from 'rxfire/auth';
import { doc } from 'rxfire/firestore';
import Button from 'react-bulma-components/lib/components/button';
import app from '../base';
import { switchMap, map } from 'rxjs/operators';
import { from } from 'rxjs';
import Account from '../components/Account';

const Home = () => {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    // TODO: refactor to Account Context
    authState(app.auth()).pipe(
      switchMap(user => {
        if (user) {
          return doc(app.firestore().doc(`users/${user.uid}`));
        }
        return from([]);
      }),
      map(userDoc => userDoc.data())
    ).pipe(
      switchMap(appUser => {
        if (appUser && appUser.accountId) {
          return doc(app.firestore().doc(`accounts/${appUser.accountId}`));
        } else {
          return from([]);
        }
      }),
      map(accountDoc => accountDoc.data())
    ).subscribe(account => {
      setAccount(account);
    });

  // TODO: cleanup observable

  // TODO: improve accounts security rule
  }, []);

  let accountView;

  if (account) {
    accountView = <Account account={account} />
  }

  return (
    <div>
      <h1 >Home</h1>
      {accountView}
      <Button color="primary" onClick={() => app.auth().signOut()}>Logout</Button>
    </div>
  );
}

export default Home;