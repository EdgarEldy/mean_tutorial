import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { AuthUser } from '../../../core/models/auth-user.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ForgotPasswordResult, RegisterResult } from '../models/auth.model';
import { AuthService } from './auth.service';

const user: AuthUser = {
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  roles: [{ id: 1, role_name: 'user' }],
};

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let authStateSpy: jasmine.SpyObj<AuthStateService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put', 'delete']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error']);
    authStateSpy = jasmine.createSpyObj<AuthStateService>('AuthStateService', ['setSession']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: AuthStateService, useValue: authStateSpy },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    const input = { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', password: 'Passw0rd1' };

    it('should post the payload, toast success and return the unwrapped activation token', (done) => {
      const result: RegisterResult = { activationToken: 'tok-123' };
      const response: ApiResponse<RegisterResult> = { success: true, message: 'Registered', data: result };
      apiServiceSpy.post.and.returnValue(of(response));

      service.register(input).subscribe((res) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/register', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Registered');
        expect(res).toEqual(result);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Email already registered' },
        status: 409,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.register(input).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Email already registered');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('activate', () => {
    it('should GET the activation endpoint, toast success and complete with undefined', (done) => {
      const response: ApiResponse<void> = { success: true, message: 'Account activated' };
      apiServiceSpy.get.and.returnValue(of(response));

      service.activate('tok-123').subscribe((res) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/auth/activate/tok-123');
        expect(toastrSpy.success).toHaveBeenCalledWith('Account activated');
        expect(res).toBeUndefined();
        done();
      });
    });

    it('should toast the error message and rethrow when activation fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Invalid or expired token' },
        status: 400,
      });
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.activate('bad-token').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Invalid or expired token');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('login', () => {
    it('should toast success, update the session via AuthStateService and return just the user', (done) => {
      const response: ApiResponse<{ token: string; user: AuthUser }> = {
        success: true,
        message: 'Logged in',
        data: { token: 'jwt-token', user },
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.login({ email: user.email, password: 'Passw0rd1' }).subscribe((res) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/login', { email: user.email, password: 'Passw0rd1' });
        expect(toastrSpy.success).toHaveBeenCalledWith('Logged in');
        expect(authStateSpy.setSession).toHaveBeenCalledWith('jwt-token', user);
        expect(res).toEqual(user);
        done();
      });
    });

    it('should not update the session, should toast the error message and rethrow when login fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Invalid credentials' },
        status: 401,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.login({ email: user.email, password: 'wrong' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(authStateSpy.setSession).not.toHaveBeenCalled();
          expect(toastrSpy.error).toHaveBeenCalledWith('Invalid credentials');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should toast success and return the reset token when the response includes one', (done) => {
      const result: ForgotPasswordResult = { resetToken: 'reset-123' };
      const response: ApiResponse<ForgotPasswordResult> = { success: true, message: 'Check your email', data: result };
      apiServiceSpy.post.and.returnValue(of(response));

      service.forgotPassword({ email: user.email }).subscribe((res) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/forgot-password', { email: user.email });
        expect(toastrSpy.success).toHaveBeenCalledWith('Check your email');
        expect(res).toEqual(result);
        done();
      });
    });

    it('should return null when response.data is missing', (done) => {
      const response: ApiResponse<ForgotPasswordResult> = { success: true, message: 'Check your email' };
      apiServiceSpy.post.and.returnValue(of(response));

      service.forgotPassword({ email: user.email }).subscribe((res) => {
        expect(res).toBeNull();
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Something went wrong' },
        status: 500,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.forgotPassword({ email: user.email }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something went wrong');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('should post the payload, toast success and complete with undefined', (done) => {
      const response: ApiResponse<void> = { success: true, message: 'Password has been reset' };
      apiServiceSpy.post.and.returnValue(of(response));

      service.resetPassword({ token: 'reset-123', password: 'NewPassw0rd1' }).subscribe((res) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/reset-password', {
          token: 'reset-123',
          password: 'NewPassw0rd1',
        });
        expect(toastrSpy.success).toHaveBeenCalledWith('Password has been reset');
        expect(res).toBeUndefined();
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Invalid or expired token' },
        status: 400,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.resetPassword({ token: 'bad-token', password: 'NewPassw0rd1' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Invalid or expired token');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });
});
