import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';

describe('ForgotPasswordPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['forgotPassword']);

    TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    });
  });

  function createComponent() {
    return TestBed.createComponent(ForgotPasswordPageComponent);
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark the email field touched and not call authService.forgotPassword when the form is invalid', () => {
    const fixture = createComponent();
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(fixture.componentInstance['form'].controls.email.touched).toBeTrue();
    expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should call authService.forgotPassword with the form value and set submitted true, for an existing account', () => {
    authServiceSpy.forgotPassword.and.returnValue(of(undefined));

    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['form'].controls.email.setValue('ada@example.com');

    fixture.componentInstance.submit();

    expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith({ email: 'ada@example.com' });
    expect(fixture.componentInstance['submitted']()).toBeTrue();
    expect(fixture.componentInstance['submitting']()).toBeFalse();
  });

  it('should also set submitted true for an unknown email, since the response is byte-identical either way', () => {
    authServiceSpy.forgotPassword.and.returnValue(of(undefined));

    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['form'].controls.email.setValue('unknown@example.com');

    fixture.componentInstance.submit();

    expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith({ email: 'unknown@example.com' });
    expect(fixture.componentInstance['submitted']()).toBeTrue();
    expect(fixture.componentInstance['submitting']()).toBeFalse();
  });

  it('should reset submitting to false and leave submitted false when the request errors', () => {
    authServiceSpy.forgotPassword.and.returnValue(throwError(() => new Error('boom')));

    const fixture = createComponent();
    fixture.detectChanges();
    fixture.componentInstance['form'].controls.email.setValue('ada@example.com');

    fixture.componentInstance.submit();

    expect(fixture.componentInstance['submitting']()).toBeFalse();
    expect(fixture.componentInstance['submitted']()).toBeFalse();
  });
});
