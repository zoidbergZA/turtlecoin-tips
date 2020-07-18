import React, { useState, useEffect } from 'react';
import app from '../base';
import { authState } from 'rxfire/auth';
import { doc } from 'rxfire/firestore';
import { switchMap, map } from 'rxjs/operators';
import { from } from 'rxjs';

export const TurtleAccountContext = React.createContext();

export const TurtleAccountProvider = ({ children }) => {
  const [turtleAccount, setTurtleAccount] = useState(null);

  useEffect(() => {
    authState(app.auth())
    .pipe(
      switchMap(u => {
        if (u) {
          return doc(app.firestore().doc(`users/${u.uid}`));
        }
        return from([]);
      }),
      map(userDoc => userDoc.data()),
      switchMap(user => {
        if (user && user.accountId) {
          return doc(app.firestore().doc(`accounts/${user.accountId}`));
        } else {
          return from([]);
        }
      }),
      map(accountDoc => accountDoc.data())
    ).subscribe(account => {
      setTurtleAccount(account);
    });
  }, []);

  return (
    <TurtleAccountContext.Provider value={{ turtleAccount }}>
      { children }
    </TurtleAccountContext.Provider>
  );
};