import React from 'react';
import Loader from 'react-bulma-components/lib/components/loader';

const Spinner = ({ message }) => {
  return (
    <React.Fragment>
      <Loader
        style={{
          display: "inline-block",
          width: "64px",
          height: "64px",
          border: "4px solid grey",
          borderTopColor: 'transparent',
          borderRightColor: 'transparent' }} />
      {message ? <p>{message}</p> : null}
    </React.Fragment>
  );
};

export default Spinner;