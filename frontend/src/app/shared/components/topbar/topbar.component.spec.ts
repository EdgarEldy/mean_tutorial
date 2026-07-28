import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthUser } from '../../../core/models/auth-user.model';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { TopbarComponent } from './topbar.component';

const user: AuthUser = {
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  roles: [{ id: 1, role_name: 'user' }],
};

describe('TopbarComponent', () => {
  let authStateStub: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    user: ReturnType<typeof signal<AuthUser | null>>;
    logout: jasmine.Spy;
  };
  let router: Router;

  beforeEach(() => {
    authStateStub = {
      isAuthenticated: signal(false),
      user: signal<AuthUser | null>(null),
      logout: jasmine.createSpy('logout').and.returnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideNoopAnimations(),
        // The "not authenticated" branch of the template renders a routerLink, which needs the
        // real Router (not a bare spy) to be fully functional; navigate() is spied below instead.
        provideRouter([]),
        { provide: AuthStateService, useValue: authStateStub },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('should create the topbar', () => {
    const fixture = TestBed.createComponent(TopbarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit menuToggle when the menu button is clicked', () => {
    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('menuToggle');
    fixture.componentInstance.menuToggle.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector('button[aria-label="Toggle navigation"]') as HTMLButtonElement;
    expect(menuButton).toBeTruthy();

    menuButton.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit menuToggle when the user menu button is clicked', () => {
    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();

    const emitSpy = jasmine.createSpy('menuToggle');
    fixture.componentInstance.menuToggle.subscribe(emitSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const userMenuButton = compiled.querySelector('button[aria-label="User menu"]') as HTMLButtonElement;
    expect(userMenuButton).toBeTruthy();

    userMenuButton.click();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  describe('when authenticated', () => {
    it('should expose the user and isAuthenticated as true', () => {
      authStateStub.isAuthenticated.set(true);
      authStateStub.user.set(user);

      const fixture = TestBed.createComponent(TopbarComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance['isAuthenticated']()).toBeTrue();
      expect(fixture.componentInstance['user']()).toEqual(user);
    });

    it('logout() should call AuthStateService.logout() and navigate to /login', () => {
      authStateStub.isAuthenticated.set(true);
      authStateStub.user.set(user);

      const fixture = TestBed.createComponent(TopbarComponent);
      fixture.detectChanges();

      fixture.componentInstance.logout();

      expect(authStateStub.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('when not authenticated', () => {
    it('should expose isAuthenticated as false and no user', () => {
      const fixture = TestBed.createComponent(TopbarComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance['isAuthenticated']()).toBeFalse();
      expect(fixture.componentInstance['user']()).toBeNull();
    });
  });
});
