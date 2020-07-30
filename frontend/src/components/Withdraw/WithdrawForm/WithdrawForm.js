import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import * as Form from 'react-bulma-components/lib/components/form';
import Level from 'react-bulma-components/lib/components/level';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Button from 'react-bulma-components/lib/components/button';
import Heading from 'react-bulma-components/lib/components/heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const WithdrawForm = ({ errorMessage, onSubmit }) => {
  const { handleSubmit, errors, control, formState, setValue } = useForm({ mode: 'onChange' });
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
    <Section>
      <Container>
        <Heading>Withdraw</Heading>
        {
          !!errorMessage &&
          <p style={{ color: "red" }}>{errorMessage}</p>
        }
        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Field>
            <label>Address</label>
            <Form.Control>
              <Controller
                as={Form.Input}
                name="address"
                placeholder="TRTL address"
                defaultValue=""
                control={control}
                rules={{ required: true }}
              />
            </Form.Control>
            <Form.Help color="danger">
              {errors.FirstName && "This field is required"}
            </Form.Help>
          </Form.Field>
          <Form.Field style={{ maxWidth: "400px", display: "inline-block" }}>
            <label>Amount</label>
            <Form.Control onChange={e => AmountInputHandler(e.target)}>
              <Controller
                as={Form.Input}
                name="amount"
                control={control}
                placeholder="0.00"
                rules={{ required: true }}
              />
            </Form.Control>
          </Form.Field>
          <Form.Field>
            <Level>
            <Level.Item type="left">
              <Button to="/" renderAs={Link}>
                <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
                <span className="btn-icon-text">back</span>
              </Button>
            </Level.Item>
            <Level.Item type="right">
            <Form.Control>
              <Button
                color="primary"
                type="submit"
                value="Submit"
                disabled={!formState.isValid}
              >
                <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
                <span className="btn-icon-text">continue</span>
              </Button>
            </Form.Control>
            </Level.Item>
            </Level>
          </Form.Field>
        </form>
      </Container>
    </Section>
  );
}

export default WithdrawForm;