import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of } from 'rxjs';
import { CategoryService } from '../../../categories/services/category.service';
import { Category } from '../../../categories/models/category.model';
import { ProductFormComponent, ProductFormDialogData } from './product-form.component';

const categories: Category[] = [
  { id: 1, category_name: 'Books' },
  { id: 2, category_name: 'Electronics' },
];

describe('ProductFormComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProductFormComponent>>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;

  function createComponent(
    data: ProductFormDialogData,
    categoriesSource: Observable<Category[]> = of(categories),
  ) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ProductFormComponent>>('MatDialogRef', ['close']);
    categoryServiceSpy = jasmine.createSpyObj<CategoryService>('CategoryService', ['getAll']);
    categoryServiceSpy.getAll.and.returnValue(categoriesSource);

    TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: CategoryService, useValue: categoryServiceSpy },
      ],
    });

    return TestBed.createComponent(ProductFormComponent);
  }

  describe('create mode', () => {
    it('should create the component with an empty, untouched form', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(fixture.componentInstance).toBeTruthy();
      expect(fixture.componentInstance['isEditMode']).toBeFalse();
      expect(fixture.componentInstance['form'].controls.product_name.value).toBe('');
      expect(fixture.componentInstance['form'].controls.unit_price.value).toBe(0);
      expect(fixture.componentInstance['form'].controls.category_id.value).toBe(0);
    });

    it('should populate the category dropdown from CategoryService.getAll()', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(categoryServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['categories']()).toEqual(categories);
    });

    it('should render the "New product" title and "Create" submit label', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('New product');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Create');
    });

    it('submit() should mark all fields touched and return early without closing when the form is invalid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.submit();

      const form = fixture.componentInstance['form'];
      expect(form.controls.product_name.touched).toBeTrue();
      expect(form.controls.unit_price.touched).toBeTrue();
      expect(form.controls.category_id.touched).toBeTrue();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('submit() should close the dialog with the form value when valid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.product_name.setValue('Widget');
      form.controls.unit_price.setValue(9.99);
      form.controls.category_id.setValue(1);

      expect(form.valid).toBeTrue();

      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        product_name: 'Widget',
        unit_price: 9.99,
        category_id: 1,
      });
    });

    it('submit() should be a no-op while the async category validator is still pending, even though sync validators pass', () => {
      // A never-emitting source keeps categories$ (and therefore the async validator) pending
      // forever, so a check based only on form.invalid would incorrectly let this through.
      const fixture = createComponent({}, new Subject<Category[]>().asObservable());
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.product_name.setValue('Widget');
      form.controls.unit_price.setValue(9.99);
      form.controls.category_id.setValue(1);

      expect(form.invalid).toBeFalse();
      expect(form.pending).toBeTrue();

      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('cancel() should close the dialog with no result', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.cancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('sync validation messages', () => {
    it('should show a required error on product_name once touched and left empty', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.product_name.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Product name is required.');
    });

    it('should show a maxlength error on product_name when the value exceeds 255 characters', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.product_name;
      control.setValue('a'.repeat(256));
      control.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Product name must be 255 characters or fewer.');
    });

    it('should show a min error on unit_price when the value is negative', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.unit_price;
      control.setValue(-1);
      control.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Unit price must be zero or more.');
    });

    it('should show a category required/min error on category_id while it is left at the default 0', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.category_id.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Category is required.');
    });
  });

  describe('categoryStillExistsValidator (async)', () => {
    it('should resolve to valid when the selected category_id exists in the mocked category list', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.category_id;
      control.setValue(1);

      expect(control.hasError('categoryNotFound')).toBeFalse();
      expect(control.valid).toBeTrue();
    });

    it('should surface a categoryNotFound error when the selected category_id no longer exists (e.g. a deleted category)', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.category_id;
      control.setValue(999);
      fixture.detectChanges();

      expect(control.hasError('categoryNotFound')).toBeTrue();

      const compiled = fixture.nativeElement as HTMLElement;
      control.markAsTouched();
      fixture.detectChanges();
      expect(compiled.textContent).toContain('This category no longer exists, please pick another.');
    });
  });

  describe('edit mode', () => {
    const product = { id: 1, category_id: 2, product_name: 'Widget', unit_price: 9.99 };

    it('should pre-fill the form with the given product and render the "Edit product" title and "Save" label', () => {
      const fixture = createComponent({ product });
      fixture.detectChanges();

      expect(fixture.componentInstance['isEditMode']).toBeTrue();
      const form = fixture.componentInstance['form'];
      expect(form.controls.product_name.value).toBe('Widget');
      expect(form.controls.unit_price.value).toBe(9.99);
      expect(form.controls.category_id.value).toBe(2);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Edit product');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Save');
    });

    it('submit() should close the dialog with the updated value', () => {
      const fixture = createComponent({ product });
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.product_name.setValue('Widget Pro');
      form.controls.unit_price.setValue(14.5);
      form.controls.category_id.setValue(1);

      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        product_name: 'Widget Pro',
        unit_price: 14.5,
        category_id: 1,
      });
    });
  });
});
