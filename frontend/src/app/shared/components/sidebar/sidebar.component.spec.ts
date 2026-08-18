import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }),
  );

  it('should create the sidebar', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a single Home nav link pointing to "/"', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const navList = compiled.querySelector('mat-nav-list');
    expect(navList).toBeTruthy();

    const links = compiled.querySelectorAll('a[mat-list-item]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('ng-reflect-router-link') ?? links[0].getAttribute('href')).toBeTruthy();
    expect(links[0].textContent).toContain('Home');
  });

  it('should render the brand name', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar-header')?.textContent).toContain('MEAN Tutorial');
  });
});
