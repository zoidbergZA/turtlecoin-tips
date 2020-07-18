import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.scss';
import { AuthProvider } from './contexts/Auth';
import { TurtleAccountProvider } from './contexts/Account'
import PrivateRoute from './hoc/PrivateRoute';
import Home from './components/Home';
import Login from './components/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <React.Fragment>
          <TurtleAccountProvider>
            <PrivateRoute exact path="/" component={Home}/>
          </TurtleAccountProvider>
          <Route exact path="/login" component={Login}/>
        </React.Fragment>
      </Router>
    </AuthProvider>
  );
}

export default App;
