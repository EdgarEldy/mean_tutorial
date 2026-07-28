import { TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [FooterComponent],
    }),
  );

  it('should create the footer', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compute year as the current full year', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance.year).toBe(new Date().getFullYear());
  });

  it('should render the copyright line with the current year', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.querySelector('.app-footer')?.textContent ?? '';
    expect(text).toContain(`${new Date().getFullYear()}`);
    expect(text).toContain('MEAN Tutorial');
  });
});
