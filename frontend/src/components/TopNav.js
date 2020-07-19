import React, { useContext } from 'react'
import Navbar from 'react-bulma-components/lib/components/navbar';
import { AuthContext } from '../contexts/Auth';
import Icon from 'react-bulma-components/lib/components/icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons';
import app from '../base';

const TopNav = () => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return null;
  }

  return (
    <Navbar fixed="top">
      <Navbar.Brand>
        <Navbar.Item renderAs="a" href="#">
          <img src="https://bulma.io/images/bulma-logo.png" alt="Bulma" width="112" height="28" />
        </Navbar.Item>
        <Navbar.Burger />
      </Navbar.Brand>
      <Navbar.Menu>
        <Navbar.Container position="end">
          <Navbar.Item>
            {currentUser.username}
          </Navbar.Item>
          <Navbar.Item>
            <Icon onClick={() => app.auth().signOut()}>
              <FontAwesomeIcon icon={faLock} />
            </Icon>
          </Navbar.Item>
        </Navbar.Container>
      </Navbar.Menu>
    </Navbar>
  )
}

export default TopNav;