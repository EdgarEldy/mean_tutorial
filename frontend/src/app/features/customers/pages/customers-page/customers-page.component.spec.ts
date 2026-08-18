import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { CustomersPageComponent } from './customers-page.component';

const customers: Customer[] = [
  { id: 1, first_name: 'Ada', last_name: 'Lovelace', telephone: null, email: 'ada@example.com', address: null },
  { id: 2, first_name: 'Alan', last_name: 'Turing', telephone: null, email: null, address: null },
];

describe('CustomersPageComponent', () => {
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let afterClosedSubject: Subject<unknown>;
  let dialogRefStub: { afterClosed: () => Observable<unknown> };
  let authStateStub: { isAdmin: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    customerServiceSpy = jasmine.createSpyObj<CustomerService>('CustomerService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    customerServiceSpy.getAll.and.returnValue(of(customers));

    afterClosedSubject = new Subject<unknown>();
    dialogRefStub = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefStub as MatDialogRef<unknown>);

    // isAdmin defaults to true so the pre-existing "New customer" button tests keep finding it.
    authStateStub = { isAdmin: signal(true) };

    TestBed.configureTestingModule({
      imports: [CustomersPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AuthStateService, useValue: authStateStub },
      ],
    });
  });

  function createComponent() {
    return TestBed.createComponent(CustomersPageComponent);
  }

  describe('ngOnInit / load', () => {
    it('should load customers and toggle loading on success', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      expect(customerServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['customers']()).toEqual(customers);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });

    it('should set loading to false when the load request fails', () => {
      customerServiceSpy.getAll.and.returnValue(throwError(() => new Error('boom')));

      const fixture = createComponent();
      fixture.detectChanges();

      expect(fixture.componentInstance['customers']()).toEqual([]);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });
  });

  describe('openCreateDialog', () => {
    it('should open the form dialog with no customer and reload after a successful create', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      const created: Customer = { id: 3, first_name: 'New', last_name: null, telephone: null, email: null, address: null };
      customerServiceSpy.create.and.returnValue(of(created));

      fixture.componentInstance.openCreateDialog();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        CustomerFormComponent,
        jasmine.objectContaining({ data: { customer: undefined } }),
      );

      afterClosedSubject.next({ first_name: 'New' });

      expect(customerServiceSpy.create).toHaveBeenCalledWith({ first_name: 'New' });
      expect(customerServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call create nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next(undefined);

      expect(customerServiceSpy.create).not.toHaveBeenCalled();
      expect(customerServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the create request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      customerServiceSpy.create.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next({ first_name: 'New' });

      expect(customerServiceSpy.create).toHaveBeenCalled();
      expect(customerServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should open the form dialog and reload even when the result is an empty object (all-blank submit)', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      const created: Customer = { id: 4, first_name: null, last_name: null, telephone: null, email: null, address: null };
      customerServiceSpy.create.and.returnValue(of(created));

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next({});

      expect(customerServiceSpy.create).toHaveBeenCalledWith({});
      expect(customerServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('openEditDialog', () => {
    it('should open the form dialog pre-filled with the customer and reload after a successful update', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      const target = customers[0];
      const updated: Customer = { ...target, first_name: 'Updated' };
      customerServiceSpy.update.and.returnValue(of(updated));

      fixture.componentInstance.openEditDialog(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        CustomerFormComponent,
        jasmine.objectContaining({ data: { customer: target } }),
      );

      afterClosedSubject.next({ first_name: 'Updated' });

      expect(customerServiceSpy.update).toHaveBeenCalledWith(target.id, { first_name: 'Updated' });
      expect(customerServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call update nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openEditDialog(customers[0]);
      afterClosedSubject.next(undefined);

      expect(customerServiceSpy.update).not.toHaveBeenCalled();
      expect(customerServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the update request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      customerServiceSpy.update.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.openEditDialog(customers[0]);
      afterClosedSubject.next({ first_name: 'Updated' });

      expect(customerServiceSpy.update).toHaveBeenCalled();
      expect(customerServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('should open the confirm dialog and reload after a confirmed delete', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      const target = customers[0];
      customerServiceSpy.delete.and.returnValue(of(undefined));

      fixture.componentInstance.confirmDelete(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        jasmine.objectContaining({
          data: {
            title: 'Delete customer',
            message: 'Delete this customer? This cannot be undone.',
          },
        }),
      );

      afterClosedSubject.next(true);

      expect(customerServiceSpy.delete).toHaveBeenCalledWith(target.id);
      expect(customerServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call delete nor reload when the confirmation is declined', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      fixture.componentInstance.confirmDelete(customers[0]);
      afterClosedSubject.next(false);

      expect(customerServiceSpy.delete).not.toHaveBeenCalled();
      expect(customerServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the delete request errors', () => {
      const fixture = createComponent();
      fixture.detectChanges();
      customerServiceSpy.getAll.calls.reset();

      customerServiceSpy.delete.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.confirmDelete(customers[0]);
      afterClosedSubject.next(true);

      expect(customerServiceSpy.delete).toHaveBeenCalled();
      expect(customerServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin gating', () => {
    it('should show the "New customer" button when the user is admin', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(buttons.some((text) => text?.includes('New customer'))).toBeTrue();
    });

    it('should hide the "New customer" button when the user is not admin', () => {
      authStateStub.isAdmin.set(false);

      const fixture = createComponent();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(buttons.some((text) => text?.includes('New customer'))).toBeFalse();
    });
  });
});
