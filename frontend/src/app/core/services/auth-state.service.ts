import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthUser } from '../models/auth-user.model';
import { ApiService } from './api.service';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Owns the authenticated session as signals so the whole app (guard, interceptor, topbar,
// role-gated UI across every feature) can reactively read login/role state without re-deriving
// it from the JWT, which carries no role info (see auth-user.model.ts). Lives in core/, not in
// features/auth/, because core/guards and core/interceptors need to depend on it and core must
// never depend on a feature. The full user (with roles) comes from the login response body and
// is persisted alongside the token so a page reload doesn't lose role information, since there
// is no GET /auth/me endpoint on the backend to re-fetch it.
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly api = inject(ApiService);
  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly isAdmin = computed(() => this.hasRole('admin'));

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(roleName: string): boolean {
    return this.userSignal()?.roles.some((role) => role.role_name === roleName) ?? false;
  }

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  // Logout should always leave the client logged out, even if the backend call fails (e.g.
  // the token already expired, or a network error), so failures are swallowed here instead of
  // propagated: the whole point of calling the endpoint is to blacklist the token server-side,
  // but the local session is cleared regardless.
  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout', {}).pipe(
      tap(() => this.clearSession()),
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
    );
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
