import React, { useContext, useState } from 'react'
import { Redirect, Switch, useHistory } from 'react-router-dom';
import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import CloseIcon from '@material-ui/icons/Close';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Dialog from '@material-ui/core/Dialog';

import { TurtleAccountContext } from '../contexts/Account';
import AppIcon from './SvgIcons/AppIcon';
import History from './History/History';
import { signOut } from '../base';
import Home from './Home';
import Withdraw from './Withdraw/Withdraw';
import Help from './Help';
import PrivateRoute from '../hoc/PrivateRoute';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('md')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: '#ffffff'
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  homeButton: {
    marginRight: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  actionButton: {
    margin: theme.spacing(1)
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth
  },
  content: {
    width: 'calc(100% - 240px)',
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  closeMenuButton: {
    marginRight: 'auto',
    marginLeft: 0,
  },
}));

function UserNav() {
  const theme = useTheme();
  const classes = useStyles();
  const history = useHistory();
  const { turtleAccount } = useContext(TurtleAccountContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

  function handleDrawerToggle() {
    setMobileOpen(!mobileOpen)
  }

  const homeClickHandler = () => {
    history.push('/');
  }

  const receiveClickHandler = () => {
    if (!turtleAccount)
      return;

    setReceiveDialogOpen(true);
  }

  const handleDialogClose = () => {
    setReceiveDialogOpen(false);
  }

  const sendClickHandler = () => {
    history.push('/send');
  }

  const signOutHandler = async () => {
    await signOut();
  }

  const drawer = (
    <div>
      <List>
        <ListItem button>
          <ListItemText primary="Sign out" onClick={signOutHandler} />
      </ListItem>
      </List>
    </div>
  );

  const receiveDialog = (
    <Dialog fullScreen open={receiveDialogOpen} onClose={handleDialogClose}>
      <Container maxWidth='md'>
        <div style={{ backgroundColor: 'red' }}>
          <div>
            <img src={turtleAccount.depositQrCode} />
          </div>
        </div>
      </Container>
    </Dialog>
  );

  return (
    <div className={classes.root}>
      {receiveDialog}
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar} color='default'>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            onClick={homeClickHandler}
            className={classes.homeButton}
          >
            <AppIcon color="primary"/>
          </IconButton>
          <div style={{ flex: 1 }}></div>
          <Button
            variant="contained"
            color="primary"
            className={classes.actionButton}
            onClick={sendClickHandler}
          >
            <Typography variant="body1">
              Send
            </Typography>
          </Button>
          <Button
            variant="contained"
            color="secondary"
            className={classes.actionButton}
            onClick={receiveClickHandler}
          >
            <Typography variant="body1">
              Receive
            </Typography>
          </Button>
        </Toolbar>
      </AppBar>

      <nav className={classes.drawer}>
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            <IconButton onClick={handleDrawerToggle} className={classes.closeMenuButton}>
              <CloseIcon/>
            </IconButton>
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden smDown implementation="css">
          <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
              paper: classes.drawerPaper,
            }}
          >
            <div className={classes.toolbar} />
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      <div className={classes.content}>
        <div className={classes.toolbar} />
        <Container maxWidth='md'>
          <Switch>
            <PrivateRoute exact path="/" component={Home}/>
            <PrivateRoute exact path="/send" component={Withdraw}/>
            <PrivateRoute exact path="/history" component={History}/>
            <PrivateRoute exact path="/help" component={Help}/>
            <Redirect to="/" />
          </Switch>
        </Container>
      </div>
    </div>
  );
}

export default UserNav;