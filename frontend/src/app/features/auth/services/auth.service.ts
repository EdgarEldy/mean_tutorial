import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../../core/models/api-response.model';
import { AuthUser } from '../../../core/models/auth-user.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
} from '../models/auth.model';

// Talks to the /auth REST endpoints. Unlike the other feature services, login() also updates
// the shared AuthStateService (core/) on success, since a successful login is the one place
// the app-wide session actually changes. logout() itself lives on AuthStateService instead,
// since the topbar (shared/) needs to trigger it without depending on this feature.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly authState = inject(AuthStateService);
  private readonly toastr = inject(ToastrService);
  private readonly basePath = '/auth';

  register(data: RegisterInput): Observable<RegisterResult> {
    return this.api.post<RegisterResult>(`${this.basePath}/register`, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as RegisterResult),
      catchError((error) => this.handleError(error)),
    );
  }

  activate(token: string): Observable<void> {
    return this.api.get<void>(`${this.basePath}/activate/${token}`).pipe(
      tap((response) => this.toastr.success(response.message)),
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  login(data: LoginInput): Observable<AuthUser> {
    return this.api.post<{ token: string; user: AuthUser }>(`${this.basePath}/login`, data).pipe(
      tap((response) => {
        this.toastr.success(response.message);
        const session = response.data as { token: string; user: AuthUser };
        this.authState.setSession(session.token, session.user);
      }),
      map((response) => (response.data as { token: string; user: AuthUser }).user),
      catchError((error) => this.handleError(error)),
    );
  }

  forgotPassword(data: ForgotPasswordInput): Observable<void> {
    return this.api.post<void>(`${this.basePath}/forgot-password`, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  resetPassword(data: ResetPasswordInput): Observable<void> {
    return this.api.post<void>(`${this.basePath}/reset-password`, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const body = error.error as ApiResponse<unknown> | undefined;
    const message = body?.errors?.length
      ? body.errors.map((validationError) => (validationError as { msg?: string }).msg).join(', ')
      : (body?.message ?? 'Something went wrong. Please try again.');

    this.toastr.error(message);
    return throwError(() => error);
  }
}
