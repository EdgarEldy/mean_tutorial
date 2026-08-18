import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { AuthUser } from '../models/auth-user.model';
import { ApiService } from './api.service';
import { AuthStateService } from './auth-state.service';

const adminUser: AuthUser = {
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  roles: [{ id: 1, role_name: 'admin' }],
};

const regularUser: AuthUser = {
  id: 2,
  first_name: 'Alan',
  last_name: 'Turing',
  email: 'alan@example.com',
  roles: [{ id: 2, role_name: 'user' }],
};

describe('AuthStateService', () => {
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    localStorage.clear();
    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put', 'delete']);
  });

  afterEach(() => localStorage.clear());

  // readStoredUser() runs in a field initializer at construction time, so localStorage must be
  // seeded before TestBed.inject() creates the service, not after.
  function createService(): AuthStateService {
    TestBed.configureTestingModule({
      providers: [AuthStateService, { provide: ApiService, useValue: apiServiceSpy }],
    });
    return TestBed.inject(AuthStateService);
  }

  describe('construction / readStoredUser', () => {
    it('should start with no user when localStorage has no "user" key', () => {
      const service = createService();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should read and parse a stored user from localStorage on construction', () => {
      localStorage.setItem('user', JSON.stringify(regularUser));

      const service = createService();

      expect(service.user()).toEqual(regularUser);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should fall back to null when the stored "user" value is malformed JSON', () => {
      localStorage.setItem('user', '{not valid json');

      const service = createService();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('hasRole / isAdmin', () => {
    it('should be true for hasRole("admin") and isAdmin when the user has the admin role', () => {
      const service = createService();
      service.setSession('token123', adminUser);

      expect(service.hasRole('admin')).toBeTrue();
      expect(service.isAdmin()).toBeTrue();
    });

    it('should be false for hasRole("admin") and isAdmin when the user only has the user role', () => {
      const service = createService();
      service.setSession('token123', regularUser);

      expect(service.hasRole('admin')).toBeFalse();
      expect(service.isAdmin()).toBeFalse();
    });

    it('should be false for hasRole/isAdmin when there is no user at all', () => {
      const service = createService();

      expect(service.hasRole('admin')).toBeFalse();
      expect(service.isAdmin()).toBeFalse();
    });
  });

  describe('setSession', () => {
    it('should write the token and user to localStorage and update the user signal', () => {
      const service = createService();

      service.setSession('token123', regularUser);

      expect(localStorage.getItem('token')).toBe('token123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(regularUser));
      expect(service.user()).toEqual(regularUser);
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  describe('clearSession', () => {
    it('should remove the token and user from localStorage and null the user signal', () => {
      const service = createService();
      service.setSession('token123', regularUser);

      service.clearSession();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getToken', () => {
    it('should read the token from localStorage', () => {
      const service = createService();
      localStorage.setItem('token', 'abc123');

      expect(service.getToken()).toBe('abc123');
    });

    it('should return null when no token is stored', () => {
      const service = createService();

      expect(service.getToken()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear the session and complete with undefined on a successful backend call', (done) => {
      const service = createService();
      service.setSession('token123', regularUser);
      const response: ApiResponse<void> = { success: true, message: 'Logged out' };
      apiServiceSpy.post.and.returnValue(of(response));

      service.logout().subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          expect(apiServiceSpy.post).toHaveBeenCalledWith('/auth/logout', {});
          expect(service.user()).toBeNull();
          expect(localStorage.getItem('token')).toBeNull();
          done();
        },
        error: () => fail('expected logout to complete successfully'),
      });
    });

    it('should still clear the session and complete successfully with undefined when the backend call errors', (done) => {
      const service = createService();
      service.setSession('token123', regularUser);
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('network error')));

      let nextFired = false;
      service.logout().subscribe({
        next: (result) => {
          nextFired = true;
          expect(result).toBeUndefined();
          expect(service.user()).toBeNull();
          expect(localStorage.getItem('token')).toBeNull();
        },
        error: () => fail('logout should swallow backend errors and complete, not error'),
        complete: () => {
          expect(nextFired).toBeTrue();
          done();
        },
      });
    });
  });
});
