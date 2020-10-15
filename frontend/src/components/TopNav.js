import React, { useContext, useState } from 'react'
import { useLocation } from 'react-router';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Box from '@material-ui/core/Box';
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
import History from '../components/History/History';
import { AuthContext } from '../contexts/Auth';
import app from '../base';
import logo from '../assets/logo-med.png';

import Home from './Home';
import Start from './Start';
import Withdraw from './Withdraw/Withdraw';
import Help from './Help';
import PrivacyPolicy from './PrivacyPolicy';
import Login from './Login/Login';
import UserManagement from './UserManagement';
import { TurtleAccountProvider } from '../contexts/Account'
import PrivateRoute from '../hoc/PrivateRoute';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
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

function TopNav() {
  const dummyCategories = ['Hokusai', 'Hiroshige', 'Utamaro', 'Kuniyoshi', 'Yoshitoshi']
  const classes = useStyles();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleDrawerToggle() {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <div>
      <List>
        {dummyCategories.map((text, index) => (
          <ListItem button key={text}>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
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
          <Typography variant="h6" noWrap>
            Responsive drawer
          </Typography>
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
        <Hidden xsDown implementation="css">
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
          <TurtleAccountProvider>
            <PrivateRoute exact path="/" component={Home}/>
            <PrivateRoute exact path="/withdraw" component={Withdraw}/>
            <PrivateRoute exact path="/history" component={History}/>
            <PrivateRoute exact path="/help" component={Help}/>
          </TurtleAccountProvider>
            <Route exact path="/start" render={(props) => <Start {...props} email={false} github={true} />}/>
            <Route exact path="/github" render={(props) => <Start {...props} github={true} />}/>
            <Route exact path="/login" component={Login}/>
            <Route exact path="/privacy-policy" component={PrivacyPolicy}/>
            <Route exact path="/user-mgmt" component={UserManagement}/>
        </Container>
      </div>
    </div>
  );
}

// const TopNav = () => {
//   const classes = useStyles();

//   const { currentUser } = useContext(AuthContext);
//   const [ dropdownOpen, setDropdownOpen ] = useState(false);
//   const location = useLocation();

//   if (!currentUser || location.pathname === '/user-mgmt') {
//     return null;
//   }

//   // const menuClickHandler = () => {
//   //   setDropdownOpen(!dropdownOpen);
//   // }


//   return (
//     <div className={classes.root}>
//       <AppBar position="static">
//         <Toolbar>
//           <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
//             <MenuIcon />
//           </IconButton>
//           <Typography variant="h6" className={classes.title}>
//             News
//           </Typography>
//           <Button color="inherit">Login</Button>
//         </Toolbar>
//       </AppBar>
//     </div>
//   );

//   // return (
//   //   <Navbar fixed="top" active={dropdownOpen}>
//   //     <Navbar.Brand>
//   //       <Navbar.Item renderAs={Link} to="/">
//   //         <img src={logo} alt="logo" width="28" height="28" /><span>tips</span>
//   //       </Navbar.Item>
//   //       <Navbar.Burger onClick={menuClickHandler} />
//   //     </Navbar.Brand>
//   //     <Navbar.Menu>
//   //       <Navbar.Container position="end">
//   //         <Navbar.Item renderAs="span">
//   //           {currentUser.username}
//   //         </Navbar.Item>
//   //         <Navbar.Item onClick={() => app.auth().signOut()}>
//   //           <Icon>
//   //             <FontAwesomeIcon icon={faLock} />
//   //           </Icon>
//   //           <span>Lock</span>
//   //         </Navbar.Item>
//   //       </Navbar.Container>
//   //     </Navbar.Menu>
//   //   </Navbar>
//   // )
// }

export default TopNav;