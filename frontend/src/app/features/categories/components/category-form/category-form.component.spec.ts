import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CategoryFormComponent, CategoryFormDialogData } from './category-form.component';

describe('CategoryFormComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CategoryFormComponent>>;

  function createComponent(data: CategoryFormDialogData) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<CategoryFormComponent>>('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CategoryFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    return TestBed.createComponent(CategoryFormComponent);
  }

  describe('create mode', () => {
    it('should create the component with an empty, untouched form', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(fixture.componentInstance).toBeTruthy();
      expect(fixture.componentInstance['isEditMode']).toBeFalse();
      expect(fixture.componentInstance['form'].controls.category_name.value).toBe('');
    });

    it('should render the "New category" title and "Create" submit label', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('New category');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Create');
    });

    it('submit() should mark the field touched and return early without closing when the form is invalid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.submit();

      expect(fixture.componentInstance['form'].controls.category_name.touched).toBeTrue();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should show a required error once the field is touched and left empty', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.category_name.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Category name is required.');
    });

    it('should show a maxlength error when the value exceeds 255 characters', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.category_name;
      control.setValue('a'.repeat(256));
      control.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Category name must be 255 characters or fewer.');
    });

    it('submit() should close the dialog with the form value when valid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.category_name.setValue('Books');
      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ category_name: 'Books' });
    });

    it('cancel() should close the dialog with no result', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.cancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('edit mode', () => {
    it('should pre-fill the form with the given category and render the "Edit category" title and "Save" label', () => {
      const fixture = createComponent({ category: { id: 1, category_name: 'Books' } });
      fixture.detectChanges();

      expect(fixture.componentInstance['isEditMode']).toBeTrue();
      expect(fixture.componentInstance['form'].controls.category_name.value).toBe('Books');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Edit category');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Save');
    });

    it('submit() should close the dialog with the updated value', () => {
      const fixture = createComponent({ category: { id: 1, category_name: 'Books' } });
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.category_name.setValue('Comics');
      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ category_name: 'Comics' });
    });
  });
});
