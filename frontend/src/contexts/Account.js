import React, { useState, useEffect, useContext } from 'react';
import app from '../base';
import { doc } from 'rxfire/firestore';

import { AuthContext } from 'contexts/Auth';
import Spinner from 'components/Spinner/Spinner';

export const TurtleAccountContext = React.createContext();

export const TurtleAccountProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [turtleAccount, setTurtleAccount] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.primaryAccountId) {
      doc(app.firestore().doc(`accounts/${currentUser.primaryAccountId}`)).subscribe(accountDoc => {
        const account = accountDoc.data();
        setTurtleAccount(account);
      })
    } else {
      setTurtleAccount(null);
    }
  }, [currentUser]);

  if (!currentUser || !turtleAccount) {
    return (
      <div style={{  paddingTop: "200px" }}>
        <Spinner />
      </div>
    )
  }

  return (
    <TurtleAccountContext.Provider value={{ turtleAccount }}>
      { children }
    </TurtleAccountContext.Provider>
  );
};