import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterResult } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    });
  });

  function createComponent(): ComponentFixture<RegisterPageComponent> {
    return TestBed.createComponent(RegisterPageComponent);
  }

  function fillValidForm(fixture: ComponentFixture<RegisterPageComponent>) {
    const form = fixture.componentInstance['form'];
    form.controls.first_name.setValue('Ada');
    form.controls.last_name.setValue('Lovelace');
    form.controls.email.setValue('ada@example.com');
    form.controls.password.setValue('Passw0rd1');
    form.controls.confirmPassword.setValue('Passw0rd1');
    return form;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('passwordsMatchValidator wiring', () => {
    it('should block submit when confirmPassword does not match password', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const form = fillValidForm(fixture);
      form.controls.confirmPassword.setValue('SomethingElse1');

      fixture.componentInstance.submit();

      expect(form.controls.confirmPassword.hasError('passwordMismatch')).toBeTrue();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should allow submit once the passwords match', () => {
      authServiceSpy.register.and.returnValue(
        of({ id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', enabled: false, account_locked: false }),
      );

      const fixture = createComponent();
      fixture.detectChanges();
      fillValidForm(fixture);

      fixture.componentInstance.submit();

      expect(authServiceSpy.register).toHaveBeenCalled();
    });
  });

  describe('password complexity pattern', () => {
    it('should reject a password missing an uppercase letter, lowercase letter or digit', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const form = fillValidForm(fixture);
      form.controls.password.setValue('alllowercase');

      expect(form.controls.password.hasError('pattern')).toBeTrue();
    });

    it('should accept a password containing an uppercase letter, a lowercase letter and a digit', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const form = fillValidForm(fixture);
      form.controls.password.setValue('Passw0rd1');

      expect(form.controls.password.hasError('pattern')).toBeFalse();
    });
  });

  describe('submit()', () => {
    it('should mark all fields touched and not call register when the form is invalid', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      fixture.componentInstance.submit();

      const form = fixture.componentInstance['form'];
      expect(form.controls.first_name.touched).toBeTrue();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should strip confirmPassword from the payload sent to authService.register()', () => {
      authServiceSpy.register.and.returnValue(
        of({ id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', enabled: false, account_locked: false }),
      );

      const fixture = createComponent();
      fixture.detectChanges();
      fillValidForm(fixture);

      fixture.componentInstance.submit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        password: 'Passw0rd1',
      });
    });

    it('should set the registered signal to the result on success instead of navigating away', () => {
      const result: RegisterResult = {
        id: 1,
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        enabled: false,
        account_locked: false,
      };
      authServiceSpy.register.and.returnValue(of(result));

      const fixture = createComponent();
      fixture.detectChanges();
      fillValidForm(fixture);

      fixture.componentInstance.submit();

      expect(fixture.componentInstance['registered']()).toEqual(result);
      expect(fixture.componentInstance['submitting']()).toBeFalse();
    });

    it('should reset submitting to false and leave registered null when register() errors', () => {
      authServiceSpy.register.and.returnValue(throwError(() => new Error('Email already registered')));

      const fixture = createComponent();
      fixture.detectChanges();
      fillValidForm(fixture);

      fixture.componentInstance.submit();

      expect(fixture.componentInstance['submitting']()).toBeFalse();
      expect(fixture.componentInstance['registered']()).toBeNull();
    });
  });
});
