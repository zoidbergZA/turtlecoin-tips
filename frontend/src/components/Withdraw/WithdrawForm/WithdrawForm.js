import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const WithdrawForm = ({ errorMessage, onSubmit }) => {
  const { handleSubmit, register, errors, formState, setValue } = useForm({ mode: 'onChange' });
  const [oldAmount, setOldAmount] = useState(undefined);
  const amountRegex =/^(\d+(\.\d{0,2})?|\.?\d{1,2})$/;

  const AmountInputHandler = (target) => {
    const value = target.value;

    if (value === undefined || value === '') {
      setOldAmount(undefined);
      return;
    }

    if (!amountRegex.test(value)) {
      setValue('amount', oldAmount);
    } else {
      setOldAmount(value);
    }
  }

  return (
    <React.Fragment>
      <Typography variant="h4" component="h4">
        Withdraw
      </Typography>
      {
        !!errorMessage &&
        <p style={{ color: "red" }}>{errorMessage}</p>
      }
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          name="address"
          type="text"
          inputRef={register({ required: true })}
          label="TRTL address"
          variant="outlined" />
        <TextField
          name="amount"
          type="number"
          inputRef={register({ required: true })}
          onChange={e => AmountInputHandler(e.target)}
          label="amount"
          placeholder="0.00"
          variant="outlined" />
        <Button to="/" renderAs={Link}>
          <span>back</span>
        </Button>
        <Button
          color="primary"
          type="submit"
          value="Submit"
          disabled={!formState.isValid}
        >
          <span>continue</span>
        </Button>
      </form>
    </React.Fragment>
  );
}

export default WithdrawForm;