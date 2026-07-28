import { FormControl, FormGroup } from '@angular/forms';
import { passwordsMatchValidator } from './passwords-match.validator';

describe('passwordsMatchValidator', () => {
  function buildGroup(password: string, confirmPassword: string): FormGroup {
    return new FormGroup(
      {
        password: new FormControl(password),
        confirmPassword: new FormControl(confirmPassword),
      },
      { validators: [passwordsMatchValidator] },
    );
  }

  it('should not set a passwordMismatch error when the passwords match', () => {
    const group = buildGroup('Passw0rd1', 'Passw0rd1');

    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBeFalse();
  });

  it('should set a passwordMismatch error on confirmPassword when the passwords differ', () => {
    const group = buildGroup('Passw0rd1', 'Different1');

    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBeTrue();
  });

  it('should not flag a mismatch while confirmPassword is still empty', () => {
    const group = buildGroup('Passw0rd1', '');

    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBeFalse();
  });

  it('should clear the passwordMismatch error once the passwords are made to match again', () => {
    const group = buildGroup('Passw0rd1', 'Different1');
    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBeTrue();

    // Changing password (not confirmPassword) re-runs the group-level validator, since setValue
    // propagates up to the parent's updateValueAndValidity().
    group.get('password')?.setValue('Different1');

    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBeFalse();
  });

  it('should clear only the passwordMismatch error and preserve any other pre-existing errors on confirmPassword', () => {
    const group = buildGroup('Passw0rd1', 'Different1');
    const confirmPassword = group.get('confirmPassword')!;
    expect(confirmPassword.hasError('passwordMismatch')).toBeTrue();

    // Simulate another validator having also flagged this control (confirmPassword itself has
    // no individually-attached validators in this form, so this is set directly, the same way a
    // real validator would via setErrors()).
    confirmPassword.setErrors({ ...confirmPassword.errors, required: true });
    expect(confirmPassword.hasError('required')).toBeTrue();

    // Re-running the group validator via the password control (not confirmPassword itself, whose
    // own null validator would otherwise wipe every manually-set error on updateValueAndValidity).
    group.get('password')?.setValue('Different1');

    expect(confirmPassword.hasError('passwordMismatch')).toBeFalse();
    expect(confirmPassword.hasError('required')).toBeTrue();
  });

  it('should return null itself, since it only ever mutates confirmPassword, not the group', () => {
    const group = buildGroup('Passw0rd1', 'Different1');

    expect(group.hasError('passwordMismatch')).toBeFalse();
  });
});
