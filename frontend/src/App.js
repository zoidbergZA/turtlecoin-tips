import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.scss';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { AuthProvider } from './contexts/Auth';
import TopNav from './components/TopNav';

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
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
