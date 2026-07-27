import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow navigation when a token exists in localStorage', () => {
    localStorage.setItem('token', 'abc123');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /login when no token exists in localStorage', () => {
    const router = TestBed.inject(Router);
    const createUrlTreeSpy = spyOn(router, 'createUrlTree').and.callThrough();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as UrlTree;

    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toBe('/login');
  });
});
