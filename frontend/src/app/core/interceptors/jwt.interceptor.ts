import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const token = authState.getToken();

  const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // A 401 here means the token is missing/invalid/expired/revoked (see
      // auth.middleware.js's protect()), so the local session is stale either way. This also
      // fires harmlessly on a failed login attempt itself (wrong credentials also return 401)
      // since clearing an already-empty session and staying on /login is a no-op.
      if (error.status === 401) {
        authState.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
