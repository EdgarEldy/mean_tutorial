import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { passwordsMatchValidator } from '../../../../shared/validators/passwords-match.validator';
import { RegisterResult } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

// Public page for creating an account. The backend emails the activation link directly (see
// auth.service.js's register()), so this only has to show a confirmation once registration
// succeeds; it never sees the activation token itself.
@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly registered = signal<RegisterResult | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      first_name: ['', [Validators.required, Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      // minLength(8) matches auth.validation.js's isLength({ min: 8 }) exactly; the complexity
      // pattern is intentionally stricter than the backend (which has no complexity rule at
      // all), a deliberate frontend-only nudge toward stronger passwords, not a mirrored rule.
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { confirmPassword: _confirmPassword, ...payload } = this.form.getRawValue();
    this.authService.register(payload).subscribe({
      next: (result) => {
        this.registered.set(result);
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}
