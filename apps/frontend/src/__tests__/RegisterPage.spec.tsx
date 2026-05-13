import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import '@testing-library/jest-dom';
import { RegisterPage } from '../pages/RegisterPage';
import { DarkTheme } from '../utils/themes';
import { vi } from 'vitest';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={DarkTheme}>{ui}</ThemeProvider>);

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form field', () => {
    const view = renderWithTheme(
      <Router>
        <RegisterPage />
      </Router>
    );
    expect(view).toMatchSnapshot();
  });

  it('should display all errors when submitting with all empty fields', async () => {
    renderWithTheme(
      <Router>
        <RegisterPage />
      </Router>
    );
    const submitButton = screen.getByRole('button', {
      name: 'Create My Account',
    });
    submitButton.click();
    const usernameError = await screen.findByText('Username is required');
    const firstNameError = await screen.findByText('First Name is Required');
    const lastNameError = await screen.findByText('Last Name is Required');
    const passwordError = await screen.findByText('Password is Required');
    await waitFor(() => {
      expect(usernameError).toBeInTheDocument();
    });
    expect(firstNameError).toBeInTheDocument();
    expect(lastNameError).toBeInTheDocument();
    expect(passwordError).toBeInTheDocument();
  });

  it('should submit empty username field then remove error after typing and leaving focus', async () => {
    renderWithTheme(
      <Router>
        <RegisterPage />
      </Router>
    );
    const submitButton = screen.getByRole('button');
    submitButton.click();
    const usernameError = await screen.findByText('Username is required');
    await waitFor(() => {
      expect(usernameError).toBeInTheDocument();
    });
    const usernameField = await screen.findByLabelText('Username');
    const firstNameField = await screen.findByLabelText('First Name');
    expect(usernameField).toBeInTheDocument();
    expect(firstNameField).toBeInTheDocument();
    userEvent.type(usernameField, 'helloworld');
    userEvent.click(firstNameField);
    await waitForElementToBeRemoved(() =>
      screen.queryByText('Username is required')
    );
  });
});
