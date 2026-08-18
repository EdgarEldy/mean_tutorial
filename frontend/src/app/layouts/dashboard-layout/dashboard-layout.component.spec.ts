import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout.component';

describe('DashboardLayoutComponent', () => {
  let fixture: ComponentFixture<DashboardLayoutComponent>;
  let compiled: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardLayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(DashboardLayoutComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should create the dashboard layout', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the sidenav shell', () => {
    expect(compiled.querySelector('mat-sidenav-container')).toBeTruthy();
  });

  it('should render the sidebar and topbar inside the shell', () => {
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-topbar')).toBeTruthy();
  });
});
