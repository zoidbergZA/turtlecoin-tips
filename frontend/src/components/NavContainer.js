import React, { useContext } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';

import { AuthContext } from '../contexts/Auth';
import UserNav from './UserNav';
import Start from './Start';
import PrivacyPolicy from './PrivacyPolicy';
import Login from './Login/Login';
import UserManagement from './UserManagement';

function NavContainer() {
  const { currentUser } = useContext(AuthContext);

  return (
    <React.Fragment>
      {!!currentUser ? (
        <UserNav/>
      ) : (
        <Switch>
          <Route exact path="/start" render={(props) => <Start {...props} email={false} github={true} />}/>
          <Route exact path="/github" render={(props) => <Start {...props} github={true} />}/>
          <Route exact path="/login" component={Login}/>
          <Route exact path="/privacy-policy" component={PrivacyPolicy}/>
          <Route exact path="/user-mgmt" component={UserManagement}/>
          <Redirect to="/start" />
        </Switch>
      )
      }
    </React.Fragment>
  );
}

export default NavContainer;