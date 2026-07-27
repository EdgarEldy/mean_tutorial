import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CustomerFormComponent, CustomerFormDialogData } from './customer-form.component';

describe('CustomerFormComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CustomerFormComponent>>;

  function createComponent(data: CustomerFormDialogData) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<CustomerFormComponent>>('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CustomerFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    return TestBed.createComponent(CustomerFormComponent);
  }

  describe('create mode', () => {
    it('should create the component with an empty, untouched form and every field defaulting to ""', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(fixture.componentInstance).toBeTruthy();
      expect(fixture.componentInstance['isEditMode']).toBeFalse();

      const controls = fixture.componentInstance['form'].controls;
      expect(controls.first_name.value).toBe('');
      expect(controls.last_name.value).toBe('');
      expect(controls.telephone.value).toBe('');
      expect(controls.email.value).toBe('');
      expect(controls.address.value).toBe('');
    });

    it('should render the "New customer" title and "Create" submit label', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('New customer');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Create');
    });

    it('should have no Validators.required on any field: an entirely empty form is valid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(fixture.componentInstance['form'].valid).toBeTrue();
    });

    it('submit() should mark all fields touched and return early without closing when the form is invalid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.email.setValue('not-an-email');
      fixture.componentInstance.submit();

      expect(fixture.componentInstance['form'].controls.email.touched).toBeTrue();
      expect(fixture.componentInstance['form'].controls.first_name.touched).toBeTrue();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should show an invalid email error once the field is touched with a malformed value', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.email;
      control.setValue('not-an-email');
      control.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Enter a valid email address.');
    });

    it('should NOT show an email error when the email field is left empty', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.email;
      control.markAsTouched();
      fixture.detectChanges();

      expect(control.valid).toBeTrue();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Enter a valid email address.');
    });

    it('should show a telephone pattern error for invalid characters', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.telephone;
      control.setValue('call-me-maybe');
      control.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Telephone may only contain digits, spaces, and + - . ( )');
    });

    it('should NOT show a telephone error when the telephone field is left empty', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.telephone;
      control.markAsTouched();
      fixture.detectChanges();

      expect(control.valid).toBeTrue();
    });

    it('should show a maxlength error when first_name exceeds 255 characters', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const control = fixture.componentInstance['form'].controls.first_name;
      control.setValue('a'.repeat(256));
      control.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('First name must be 255 characters or fewer.');
    });

    it('cancel() should close the dialog with no result', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.cancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    describe('stripBlankFields on submit', () => {
      it('should close the dialog with an empty object when every field is left blank', () => {
        const fixture = createComponent({});
        fixture.detectChanges();

        fixture.componentInstance.submit();

        expect(dialogRefSpy.close).toHaveBeenCalledWith({});
      });

      it('should close the dialog with only the populated keys, omitting blank fields entirely', () => {
        const fixture = createComponent({});
        fixture.detectChanges();

        fixture.componentInstance['form'].controls.first_name.setValue('Ada');
        fixture.componentInstance.submit();

        expect(dialogRefSpy.close).toHaveBeenCalledWith({ first_name: 'Ada' });

        const closedWith = dialogRefSpy.close.calls.mostRecent().args[0] as Record<string, unknown>;
        expect(Object.keys(closedWith)).toEqual(['first_name']);
        expect(closedWith['last_name']).toBeUndefined();
        expect('last_name' in closedWith).toBeFalse();
        expect('telephone' in closedWith).toBeFalse();
        expect('email' in closedWith).toBeFalse();
        expect('address' in closedWith).toBeFalse();
      });

      it('should close the dialog with all populated fields when every field is filled in', () => {
        const fixture = createComponent({});
        fixture.detectChanges();

        const controls = fixture.componentInstance['form'].controls;
        controls.first_name.setValue('Ada');
        controls.last_name.setValue('Lovelace');
        controls.telephone.setValue('+1 (555) 123-4567');
        controls.email.setValue('ada@example.com');
        controls.address.setValue('123 Main St');

        fixture.componentInstance.submit();

        expect(dialogRefSpy.close).toHaveBeenCalledWith({
          first_name: 'Ada',
          last_name: 'Lovelace',
          telephone: '+1 (555) 123-4567',
          email: 'ada@example.com',
          address: '123 Main St',
        });
      });
    });
  });

  describe('edit mode', () => {
    it('should pre-fill the form with the given customer and render the "Edit customer" title and "Save" label', () => {
      const fixture = createComponent({
        customer: {
          id: 1,
          first_name: 'Ada',
          last_name: 'Lovelace',
          telephone: '555-1234',
          email: 'ada@example.com',
          address: '123 Main St',
        },
      });
      fixture.detectChanges();

      expect(fixture.componentInstance['isEditMode']).toBeTrue();

      const controls = fixture.componentInstance['form'].controls;
      expect(controls.first_name.value).toBe('Ada');
      expect(controls.last_name.value).toBe('Lovelace');
      expect(controls.telephone.value).toBe('555-1234');
      expect(controls.email.value).toBe('ada@example.com');
      expect(controls.address.value).toBe('123 Main St');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Edit customer');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Save');
    });

    it('should map null fields on the source customer to empty strings in the form', () => {
      const fixture = createComponent({
        customer: { id: 2, first_name: 'Alan', last_name: null, telephone: null, email: null, address: null },
      });
      fixture.detectChanges();

      const controls = fixture.componentInstance['form'].controls;
      expect(controls.first_name.value).toBe('Alan');
      expect(controls.last_name.value).toBe('');
      expect(controls.telephone.value).toBe('');
      expect(controls.email.value).toBe('');
      expect(controls.address.value).toBe('');
    });

    it('submit() should close the dialog with only the updated, non-blank fields', () => {
      const fixture = createComponent({
        customer: { id: 1, first_name: 'Ada', last_name: null, telephone: null, email: null, address: null },
      });
      fixture.detectChanges();

      fixture.componentInstance['form'].controls.first_name.setValue('Updated');
      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ first_name: 'Updated' });
    });
  });
});
