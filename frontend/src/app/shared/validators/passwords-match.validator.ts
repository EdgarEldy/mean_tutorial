import { AbstractControl, ValidationErrors } from '@angular/forms';

// Group-level validator (not on a single control) since it needs to compare two sibling
// fields; attaches the error to confirmPassword so the message renders next to that field
// instead of the group itself, which has no form-field of its own to show an error under.
// Used by both the register and reset-password forms.
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword');

  if (confirmPassword?.value && password !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
  } else if (confirmPassword?.hasError('passwordMismatch')) {
    const { passwordMismatch: _removed, ...rest } = confirmPassword.errors ?? {};
    confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
  }

  return null;
}
