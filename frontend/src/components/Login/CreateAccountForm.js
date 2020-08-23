import React, { Fragment } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as Form from 'react-bulma-components/lib/components/form';
import Button from 'react-bulma-components/lib/components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const CreateAccountForm = ({ errorMessage, onSubmit }) => {
  const { handleSubmit, errors, control, formState } = useForm({ mode: 'onChange' });

  return (
    <Fragment>
      {
        !!errorMessage &&
        <p style={{ color: "red" }}>{errorMessage}</p>
      }
      <div style={{ maxWidth: "500px" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Field>
            <label>Email address</label>
            <Form.Control>
              <Controller
                as={Form.Input}
                name="email"
                type="email"
                placeholder="email address"
                defaultValue=""
                control={control}
                rules={{ required: true }}
              />
            </Form.Control>
            <Form.Help color="danger">
              {errors.FirstName && "This field is required"}
            </Form.Help>
          </Form.Field>
          <div>
            <Form.Field>
              <label>Password</label>
              <Form.Control>
                <Controller
                  as={Form.Input}
                  name="password"
                  type="password"
                  control={control}
                  placeholder="enter password"
                  rules={{ required: true }}
                />
              </Form.Control>
            </Form.Field>
          </div>
          <div>
            <Form.Field>
              <label>Confirm password</label>
              <Form.Control>
                <Controller
                  as={Form.Input}
                  name="confirmPassword"
                  type="password"
                  control={control}
                  placeholder="re-enter password"
                  rules={{ required: true }}
                />
              </Form.Control>
            </Form.Field>
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
          </div>
        </form>
      </div>
    </Fragment>
  );
}

export default CreateAccountForm;
