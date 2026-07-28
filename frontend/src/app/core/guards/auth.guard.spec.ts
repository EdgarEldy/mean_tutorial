import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function configure(isAuthenticated: boolean) {
    const authStateStub = { isAuthenticated: signal(isAuthenticated) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authStateStub }],
    });
  }

  it('should allow navigation when the user is authenticated', () => {
    configure(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('should redirect to /login when the user is not authenticated', () => {
    configure(false);
    const router = TestBed.inject(Router);
    const createUrlTreeSpy = spyOn(router, 'createUrlTree').and.callThrough();

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as UrlTree;

    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toBe('/login');
  });
});
