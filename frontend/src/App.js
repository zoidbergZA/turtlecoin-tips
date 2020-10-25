import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import './App.scss';
import NavContainer from './components/NavContainer';
import { AuthProvider } from './contexts/Auth';

const theme = createMuiTheme({
  palette: {
    background: {
      default: '#FFFFFF'
    },
    primary: {
      main: '#00853D'
    },
    secondary: {
      main: '#1E88E5'
    }
  },
  typography: {
    button: {
      textTransform: 'none'
    }
  }
});

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router>
            <NavContainer />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
