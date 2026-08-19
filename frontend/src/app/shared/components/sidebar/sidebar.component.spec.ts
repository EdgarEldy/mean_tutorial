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

  it('should render Home, Categories, Products, Customers and Orders nav links', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const navList = compiled.querySelector('mat-nav-list');
    expect(navList).toBeTruthy();

    const links = compiled.querySelectorAll('a[mat-list-item]');
    expect(links.length).toBe(5);

    expect(links[0].getAttribute('ng-reflect-router-link') ?? links[0].getAttribute('href')).toBeTruthy();
    expect(links[0].textContent).toContain('Home');

    expect(links[1].getAttribute('ng-reflect-router-link') ?? links[1].getAttribute('href')).toBeTruthy();
    expect(links[1].textContent).toContain('Categories');

    expect(links[2].getAttribute('ng-reflect-router-link') ?? links[2].getAttribute('href')).toBeTruthy();
    expect(links[2].textContent).toContain('Products');

    expect(links[3].getAttribute('ng-reflect-router-link') ?? links[3].getAttribute('href')).toBeTruthy();
    expect(links[3].textContent).toContain('Customers');

    expect(links[4].getAttribute('ng-reflect-router-link') ?? links[4].getAttribute('href')).toBeTruthy();
    expect(links[4].textContent).toContain('Orders');
  });

  it('should render the brand name', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar-header')?.textContent).toContain('MEAN Tutorial');
  });
});
