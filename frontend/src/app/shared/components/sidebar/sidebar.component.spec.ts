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

  it('should render a Home nav link pointing to "/" and a Categories nav link pointing to "/categories"', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const navList = compiled.querySelector('mat-nav-list');
    expect(navList).toBeTruthy();

    const links = compiled.querySelectorAll('a[mat-list-item]');
    expect(links.length).toBe(2);

    expect(links[0].getAttribute('ng-reflect-router-link') ?? links[0].getAttribute('href')).toBeTruthy();
    expect(links[0].textContent).toContain('Home');

    expect(links[1].getAttribute('ng-reflect-router-link') ?? links[1].getAttribute('href')).toBeTruthy();
    expect(links[1].textContent).toContain('Categories');
  });

  it('should render the brand name', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar-brand')?.textContent).toContain('MEAN Tutorial');
  });
});
