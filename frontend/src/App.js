import React, { useContext } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import './App.scss';
import { AuthContext } from './contexts/Auth';
import { AuthProvider } from './contexts/Auth';
import TopNav from './components/TopNav';
import Start from './components/Start';
import PrivacyPolicy from './components/PrivacyPolicy';
import Login from './components/Login/Login';
import UserManagement from './components/UserManagement';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#00853D'
    },
    secondary: {
      main: '#1E88E5'
    }
  }
});

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router>
            <TopNav/>
            <Route exact path="/start" render={(props) => <Start {...props} email={false} github={true} />}/>
            <Route exact path="/github" render={(props) => <Start {...props} github={true} />}/>
            <Route exact path="/login" component={Login}/>
            <Route exact path="/privacy-policy" component={PrivacyPolicy}/>
            <Route exact path="/user-mgmt" component={UserManagement}/>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
