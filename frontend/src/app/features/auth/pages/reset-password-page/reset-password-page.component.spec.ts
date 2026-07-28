import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ResetPasswordPageComponent } from './reset-password-page.component';

describe('ResetPasswordPageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  function createComponent(token = 'reset-123'): ComponentFixture<ResetPasswordPageComponent> {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['resetPassword']);

    const routeStub = {
      snapshot: { paramMap: convertToParamMap({ token }) },
    } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      imports: [ResetPasswordPageComponent],
      providers: [
        provideNoopAnimations(),
        // The template uses routerLink, which needs the real Router (not a bare spy) to be
        // fully functional; navigate() itself is spied on the real instance below instead.
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    return TestBed.createComponent(ResetPasswordPageComponent);
  }

  function fillValidForm(fixture: ComponentFixture<ResetPasswordPageComponent>) {
    const form = fixture.componentInstance['form'];
    form.controls.password.setValue('Passw0rd1');
    form.controls.confirmPassword.setValue('Passw0rd1');
    return form;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark all fields touched and not call authService.resetPassword when the form is invalid', () => {
    const fixture = createComponent();
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should block submit when the passwords do not match', () => {
    const fixture = createComponent();
    fixture.detectChanges();

    const form = fillValidForm(fixture);
    form.controls.confirmPassword.setValue('SomethingElse1');

    fixture.componentInstance.submit();

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should call authService.resetPassword with the route token and password, then navigate to /login on success', () => {
    const fixture = createComponent('reset-123');
    authServiceSpy.resetPassword.and.returnValue(of(undefined));
    fixture.detectChanges();
    fillValidForm(fixture);

    fixture.componentInstance.submit();

    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith({ token: 'reset-123', password: 'Passw0rd1' });
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should reset submitting to false and not navigate when resetPassword errors', () => {
    const fixture = createComponent();
    authServiceSpy.resetPassword.and.returnValue(throwError(() => new Error('Invalid or expired token')));
    fixture.detectChanges();
    fillValidForm(fixture);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance['submitting']()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
