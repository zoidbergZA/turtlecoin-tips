import React from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bulma-components/lib/components/button';
import app from '../base';

const Home = () => {
  return (
    <div>
      <h1 >Home</h1>
      <Button color="primary" onClick={() => app.auth().signOut()}>Logout</Button>
    </div>
  );
}

export default Home;