import React from 'react'
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';

const Help = () => {
  return (
    <React.Fragment>
    <Typography variant="h4" component="h4">
      Help
    </Typography>
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2">
          .tip
        </Typography>
        <Typography variant="body2" component="p">
          Use this command to send a tip to a Github user. Simply comment on an open issue on
          Github repo where this bot is added with the tip amount and mention the user to send the tip to, for example:
        </Typography>
        <Typography variant="body2" component="p">
          .tip 4.20 @username
        </Typography>
      </CardContent>
    </Card>
    <Button to="/" renderAs={Link}>
      <span style={{ paddingLeft: "10px" }}>back</span>
    </Button>
    </React.Fragment>
  );
}

export default Help;