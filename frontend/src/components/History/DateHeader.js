import React from 'react';
import Moment from 'react-moment';
import { makeStyles, Typography } from '@material-ui/core';

const useStyles = makeStyles({
  label: {
    marginTop: '20px'
  }
});

const DateHeader = ({timestamp}) => {
  const classes = useStyles();

  return (
    <div className={classes.label}>
      <Typography variant="subtitle2">
        <Moment unix format="MMMM D, YYYY">{timestamp / 1000}</Moment>
      </Typography>
    </div>
  );
}

export default DateHeader;