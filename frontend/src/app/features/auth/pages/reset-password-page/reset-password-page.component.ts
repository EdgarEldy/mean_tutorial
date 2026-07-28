import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { passwordsMatchValidator } from '../../../../shared/validators/passwords-match.validator';
import { AuthService } from '../../services/auth.service';

// Route-driven page for /auth/reset-password/:token: the token comes from the URL, only the
// new password is entered here.
@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.css',
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      // Same intentional frontend-only complexity rule as register-page.component.ts; the
      // backend only enforces minLength(8).
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
    const token = this.route.snapshot.paramMap.get('token')!;
    this.submitting.set(true);
    this.authService.resetPassword({ token, password: this.form.getRawValue().password }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.submitting.set(false),
    });
  }
}
