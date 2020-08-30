import React from 'react';
import useQuery from '../hooks/useQuery';

const UserManagement = () => {
  let query = useQuery();

  const name = query.get('name');

  return <p>user management, name query param: [{name}]</p>
}

export default UserManagement;