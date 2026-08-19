import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let compiled: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HomeComponent] });
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should create the home component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the dashboard title', () => {
    expect(compiled.querySelector('.page-title')?.textContent?.trim()).toBe('Dashboard');
  });

  it('should render four stat cards', () => {
    expect(compiled.querySelectorAll('.stat-card').length).toBe(4);
  });

  it('should render the recent orders card', () => {
    expect(compiled.querySelector('.recent-card')).toBeTruthy();
  });
});
