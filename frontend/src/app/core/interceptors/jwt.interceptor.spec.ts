import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let authStateSpy: jasmine.SpyObj<AuthStateService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authStateSpy = jasmine.createSpyObj<AuthStateService>('AuthStateService', ['getToken', 'clearSession']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: authStateSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should attach an Authorization header when a token is present', () => {
    authStateSpy.getToken.and.returnValue('abc123');

    const req = new HttpRequest('GET', '/api/v1/things');
    const next = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => of(r));

    TestBed.runInInjectionContext(() => jwtInterceptor(req, next).subscribe());

    expect(next).toHaveBeenCalledTimes(1);
    const forwardedReq = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('should pass the request through unchanged when no token is present', () => {
    authStateSpy.getToken.and.returnValue(null);

    const req = new HttpRequest('GET', '/api/v1/things');
    const next = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => of(r));

    TestBed.runInInjectionContext(() => jwtInterceptor(req, next).subscribe());

    expect(next).toHaveBeenCalledTimes(1);
    const forwardedReq = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedReq).toBe(req);
    expect(forwardedReq.headers.has('Authorization')).toBeFalse();
  });

  it('should clear the session and navigate to /login on a 401, while still rethrowing the error', () => {
    authStateSpy.getToken.and.returnValue('abc123');
    const errorResponse = new HttpErrorResponse({ status: 401 });
    const next = jasmine.createSpy('next').and.returnValue(throwError(() => errorResponse));

    const req = new HttpRequest('GET', '/api/v1/things');
    let caughtError: unknown;

    TestBed.runInInjectionContext(() =>
      jwtInterceptor(req, next).subscribe({
        next: () => fail('expected an error'),
        error: (err) => (caughtError = err),
      }),
    );

    expect(authStateSpy.clearSession).toHaveBeenCalledTimes(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(caughtError).toBe(errorResponse);
  });

  it('should not clear the session nor navigate on a non-401 error', () => {
    authStateSpy.getToken.and.returnValue('abc123');
    const errorResponse = new HttpErrorResponse({ status: 500 });
    const next = jasmine.createSpy('next').and.returnValue(throwError(() => errorResponse));

    const req = new HttpRequest('GET', '/api/v1/things');

    TestBed.runInInjectionContext(() =>
      jwtInterceptor(req, next).subscribe({
        next: () => fail('expected an error'),
        error: () => {},
      }),
    );

    expect(authStateSpy.clearSession).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
