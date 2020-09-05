import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.scss';
import { AuthProvider } from './contexts/Auth';
import { TurtleAccountProvider } from './contexts/Account'
import PrivateRoute from './hoc/PrivateRoute';
import TopNav from './components/TopNav';
import Home from './components/Home';
import Start from './components/Start';
import Withdraw from './components/Withdraw/Withdraw';
import History from './components/History/History';
import Help from 'components/Help';
import PrivacyPolicy from 'components/PrivacyPolicy';
import Login from 'components/Login/Login';
import UserManagement from 'components/UserManagement';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <React.Fragment>
            <TopNav/>
            <TurtleAccountProvider>
              <PrivateRoute exact path="/" component={Home}/>
              <PrivateRoute exact path="/withdraw" component={Withdraw}/>
              <PrivateRoute exact path="/history" component={History}/>
              <PrivateRoute exact path="/help" component={Help}/>
            </TurtleAccountProvider>
            <Route exact path="/start" render={(props) => <Start {...props} email={false} github={true} />}/>
            <Route exact path="/github" render={(props) => <Start {...props} github={true} />}/>
            <Route exact path="/login" component={Login}/>
            <Route exact path="/privacy-policy" component={PrivacyPolicy}/>
            <Route exact path="/user-mgmt" component={UserManagement}/>
          </React.Fragment>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
