import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent, boolean>>;

  function createComponent(data: ConfirmDialogData) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ConfirmDialogComponent, boolean>>('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    return TestBed.createComponent(ConfirmDialogComponent);
  }

  it('should create the dialog', () => {
    const fixture = createComponent({ title: 'Delete category', message: 'Are you sure?' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title, message and default button labels', () => {
    const fixture = createComponent({ title: 'Delete category', message: 'Are you sure?' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Delete category');
    expect(compiled.textContent).toContain('Are you sure?');

    const buttons = compiled.querySelectorAll('button');
    expect(buttons[0].textContent?.trim()).toBe('Cancel');
    expect(buttons[1].textContent?.trim()).toBe('Delete');
  });

  it('should render the custom confirm/cancel labels when provided', () => {
    const fixture = createComponent({
      title: 'Delete category',
      message: 'Are you sure?',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'No, keep it',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons[0].textContent?.trim()).toBe('No, keep it');
    expect(buttons[1].textContent?.trim()).toBe('Yes, delete');
  });

  it('confirm() should close the dialog with true', () => {
    const fixture = createComponent({ title: 'Delete category', message: 'Are you sure?' });
    fixture.detectChanges();

    fixture.componentInstance.confirm();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('cancel() should close the dialog with false', () => {
    const fixture = createComponent({ title: 'Delete category', message: 'Are you sure?' });
    fixture.detectChanges();

    fixture.componentInstance.cancel();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('clicking the confirm button should close the dialog with true', () => {
    const fixture = createComponent({ title: 'Delete category', message: 'Are you sure?' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('clicking the cancel button should close the dialog with false', () => {
    const fixture = createComponent({ title: 'Delete category', message: 'Are you sure?' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
