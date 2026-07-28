import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthUser } from '../../../../core/models/auth-user.model';
import { AuthService } from '../../services/auth.service';
import { LoginPageComponent } from './login-page.component';

const user: AuthUser = {
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  roles: [{ id: 1, role_name: 'user' }],
};

describe('LoginPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideNoopAnimations(),
        // The template uses routerLink, which needs the real Router (not a bare spy) to be
        // fully functional; navigate() itself is spied on the real instance below instead.
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent() {
    return TestBed.createComponent(LoginPageComponent);
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark all fields touched and not call authService.login when the form is invalid', () => {
    const fixture = createComponent();
    fixture.detectChanges();

    fixture.componentInstance.submit();

    const form = fixture.componentInstance['form'];
    expect(form.controls.email.touched).toBeTrue();
    expect(form.controls.password.touched).toBeTrue();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call authService.login with the raw form value and navigate to "/" on success', () => {
    authServiceSpy.login.and.returnValue(of(user));

    const fixture = createComponent();
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls.email.setValue('ada@example.com');
    form.controls.password.setValue('Passw0rd1');

    fixture.componentInstance.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Passw0rd1' });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should reset submitting to false and not navigate when login errors', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

    const fixture = createComponent();
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.controls.email.setValue('ada@example.com');
    form.controls.password.setValue('wrong-password');

    fixture.componentInstance.submit();

    expect(fixture.componentInstance['submitting']()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
