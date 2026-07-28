import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Public page requesting a password reset. The backend intentionally returns the same generic
// message whether or not the email exists (see auth.service.js's forgotPassword()) to avoid
// leaking account existence, but since there's no email service, the reset token itself is
// still returned when the account does exist, so this surfaces a direct link to reset-password
// instead of making the user wait for an email that will never arrive.
@Component({
  selector: 'app-forgot-password-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.css',
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly resetToken = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.resetToken.set(result?.resetToken ?? null);
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}
