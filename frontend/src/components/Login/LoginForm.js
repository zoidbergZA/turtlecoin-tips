import React, { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const LoginForm = ({ errorMessage, onSubmit }) => {
  const { handleSubmit, register, errors, formState } = useForm({ mode: 'onChange' });

  return (
    <Fragment>
      {!!errorMessage &&
        <p style={{ color: "red" }}>{errorMessage}</p>
      }
      <div style={{ maxWidth: "500px" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            name="email"
            type="email"
            inputRef={register({ required: true })}
            label="email address"
            variant="outlined" />
          <TextField
            name="password"
            type="password"
            inputRef={register({ required: true })}
            label="password"
            variant="outlined" />
          <div style={{paddingTop: "13px"}}>
            <Button
              type="submit"
              disabled={!formState.isValid}
            >
            <span>login</span>
          </Button>
          </div>
        </form>
      </div>
    </Fragment>
  );
}

export default LoginForm;
