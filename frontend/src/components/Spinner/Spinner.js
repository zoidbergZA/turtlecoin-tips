import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

const Spinner = ({ message }) => {
  return (
    <React.Fragment>
      <CircularProgress />
      {message ? <p>{message}</p> : null}
    </React.Fragment>
  );
};

export default Spinner;