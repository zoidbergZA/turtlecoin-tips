import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom';
import Navbar from 'react-bulma-components/lib/components/navbar';
import { AuthContext } from '../contexts/Auth';
import Icon from 'react-bulma-components/lib/components/icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons';
import app from '../base';
import logo from '../assets/logo-med.png';

const TopNav = () => {
  const { currentUser } = useContext(AuthContext);
  const [ dropdownOpen, setDropdownOpen ] = useState(false);

  if (!currentUser) {
    return null;
  }

  const menuClickHandler = () => {
    setDropdownOpen(!dropdownOpen);
  }

  return (
    <Navbar fixed="top" active={dropdownOpen}>
      <Navbar.Brand>
        <Navbar.Item renderAs={Link} to="/">
          <img src={logo} alt="logo" width="28" height="28" /><span>tips</span>
        </Navbar.Item>
        <Navbar.Burger onClick={menuClickHandler} />
      </Navbar.Brand>
      <Navbar.Menu>
        <Navbar.Container position="end">
          <Navbar.Item renderAs="span">
            {currentUser.username}
          </Navbar.Item>
          <Navbar.Item onClick={() => app.auth().signOut()}>
            <Icon>
              <FontAwesomeIcon icon={faLock} />
            </Icon>
            <span>Lock</span>
          </Navbar.Item>
        </Navbar.Container>
      </Navbar.Menu>
    </Navbar>
  )
}

export default TopNav;