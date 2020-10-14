import React, { useContext } from 'react';
import { Redirect } from 'react-router';
import * as firebase from 'firebase/app';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { signInWithRedirect } from '../base';
import { AuthContext } from '../contexts/Auth';
import logo from '../assets/logo-large.png';

const Start = ({ history, email, github }) => {
  const { currentUser } = useContext(AuthContext);

  const emailLoginHandler = () => {
    history.push('/login');
  }

  const githubLoginHandler = async () => {
    var provider = new firebase.auth.GithubAuthProvider();

    try {
      await signInWithRedirect(provider);
      history.push('/');
    } catch (error) {
      console.error(`${error.errorCode} :: ${error.errorMessage}`);
    }
  }

  if (currentUser) {
    return <Redirect to="/" />;
  }

  const btnsContainer = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }

  const btnStyle = {
    width: "250px",
    marginTop: "10px"
  }

  const btnText = {
    paddingLeft: "10px"
  }

  return (
    <React.Fragment>
      <Typography variant="h3" component="h3">
        TurtleCoin Tips
      </Typography>
      <div style={{ margin: "40px" }}>
        <img src={logo} width="200" alt="logo" />
      </div>
      <div style={btnsContainer}>
        {email &&
          <Button style={btnStyle} variant="outlined" onClick={emailLoginHandler}>
            <span style={btnText}> Login with email</span>
          </Button>
        }
        {github &&
          <Button style={btnStyle} variant="outlined" onClick={githubLoginHandler}>
            <span style={btnText}> Login with Github</span>
          </Button>
        }
      </div>
    </React.Fragment>
  );
}

export default Start;

// <FontAwesomeIcon icon={faEnvelope}></FontAwesomeIcon>
// <FontAwesomeIcon icon={faGithub}></FontAwesomeIcon>