export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

// The backend now actually emails the activation link (see auth.service.js's register()) and
// returns the created user (no password, no token) instead. forgot-password returns nothing at
// all, on success or failure, so the response is byte-identical whether or not the account
// exists.
export interface RegisterResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  enabled: boolean;
  account_locked: boolean;
}
