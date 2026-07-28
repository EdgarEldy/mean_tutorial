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

// The backend's register/forgot-password responses say "check your email", but this tutorial
// has no email service wired up (see auth.service.js's register()/forgotPassword()), so the
// activation/reset token is returned directly in the response body instead, for the pages to
// surface to the user in place of an actual email link.
export interface RegisterResult {
  activationToken: string;
}

export interface ForgotPasswordResult {
  resetToken?: string;
}
