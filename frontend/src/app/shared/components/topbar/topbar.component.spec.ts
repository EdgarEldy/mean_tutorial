import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideNoopAnimations()],
    }),
  );

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
});
