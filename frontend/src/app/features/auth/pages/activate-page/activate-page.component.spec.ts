import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ActivatePageComponent } from './activate-page.component';

describe('ActivatePageComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function createComponent(token = 'tok-123'): ComponentFixture<ActivatePageComponent> {
    const routeStub = {
      snapshot: { paramMap: convertToParamMap({ token }) },
    } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      imports: [ActivatePageComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });

    return TestBed.createComponent(ActivatePageComponent);
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['activate']);
  });

  it('should create the component and start in the "pending" state before the activate response resolves', () => {
    authServiceSpy.activate.and.returnValue(of(undefined));

    const fixture = createComponent('tok-123');

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance['state']()).toBe('pending');
  });

  it('should call authService.activate() with the token read from the route on init', () => {
    authServiceSpy.activate.and.returnValue(of(undefined));

    const fixture = createComponent('tok-123');
    fixture.detectChanges();

    expect(authServiceSpy.activate).toHaveBeenCalledWith('tok-123');
  });

  it('should set state to "success" when activation succeeds', () => {
    authServiceSpy.activate.and.returnValue(of(undefined));

    const fixture = createComponent('tok-123');
    fixture.detectChanges();

    expect(fixture.componentInstance['state']()).toBe('success');
  });

  it('should set state to "error" when activation fails', () => {
    authServiceSpy.activate.and.returnValue(throwError(() => new Error('Invalid or expired token')));

    const fixture = createComponent('bad-token');
    fixture.detectChanges();

    expect(fixture.componentInstance['state']()).toBe('error');
  });
});
