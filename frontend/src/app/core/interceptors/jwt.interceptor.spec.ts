import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should attach an Authorization header when a token is present in localStorage', () => {
    localStorage.setItem('token', 'abc123');

    const req = new HttpRequest('GET', '/api/v1/things');
    const next = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => r);

    TestBed.runInInjectionContext(() => jwtInterceptor(req, next));

    expect(next).toHaveBeenCalledTimes(1);
    const forwardedReq = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('should pass the request through unchanged when no token is present', () => {
    const req = new HttpRequest('GET', '/api/v1/things');
    const next = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => r);

    TestBed.runInInjectionContext(() => jwtInterceptor(req, next));

    expect(next).toHaveBeenCalledTimes(1);
    const forwardedReq = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwardedReq).toBe(req);
    expect(forwardedReq.headers.has('Authorization')).toBeFalse();
  });
});
