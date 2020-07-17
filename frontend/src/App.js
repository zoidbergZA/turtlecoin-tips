import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.scss';
import { AuthProvider } from './contexts/Auth';
import PrivateRoute from './hoc/PrivateRoute';
import Home from './components/Home';
import Login from './components/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <PrivateRoute exact path="/" component={Home}/>
          <Route exact path="/login" component={Login}/>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
