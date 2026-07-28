import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrderFormComponent } from '../../components/order-form/order-form.component';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { OrdersPageComponent } from './orders-page.component';

const orders: Order[] = [
  {
    id: '1',
    quantity: 2,
    total: 19.98,
    customer: { id: '3', first_name: 'Jane', last_name: 'Doe' },
    product: { id: '5', product_name: 'Widget', unit_price: 9.99 },
  },
];

function createRouteStub(initialData: Data): { route: ActivatedRoute; dataSubject: Subject<Data> } {
  const dataSubject = new Subject<Data>();
  const route = {
    data: dataSubject.asObservable(),
    snapshot: { data: initialData },
  } as unknown as ActivatedRoute;
  return { route, dataSubject };
}

describe('OrdersPageComponent', () => {
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let afterClosedSubject: Subject<unknown>;
  let dialogRefStub: { afterClosed: () => Observable<unknown>; close: jasmine.Spy };
  let authStateStub: { isAdmin: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj<OrderService>('OrderService', ['getAll', 'create', 'update', 'delete']);
    orderServiceSpy.getAll.and.returnValue(of(orders));

    afterClosedSubject = new Subject<unknown>();
    dialogRefStub = { afterClosed: () => afterClosedSubject.asObservable(), close: jasmine.createSpy('close') };
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefStub as unknown as MatDialogRef<unknown>);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // isAdmin defaults to true so the pre-existing "New order" button and deep-link tests keep passing.
    authStateStub = { isAdmin: signal(true) };
  });

  function createComponent(routeData: Data = {}) {
    const { route } = createRouteStub(routeData);

    TestBed.configureTestingModule({
      imports: [OrdersPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: routerSpy },
        { provide: AuthStateService, useValue: authStateStub },
      ],
    });

    const fixture = TestBed.createComponent(OrdersPageComponent);
    // effect() runs asynchronously after change detection, so two detectChanges() calls are
    // needed: the first runs ngOnInit and schedules the effect, the second flushes it.
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
  }

  describe('ngOnInit / load', () => {
    it('should load orders and toggle loading on success', () => {
      const fixture = createComponent();

      expect(orderServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['orders']()).toEqual(orders);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });

    it('should set loading to false when the load request fails', () => {
      orderServiceSpy.getAll.and.returnValue(throwError(() => new Error('boom')));

      const fixture = createComponent();

      expect(fixture.componentInstance['orders']()).toEqual([]);
      expect(fixture.componentInstance['loading']()).toBeFalse();
    });
  });

  describe('deep-link auto-open (no order in route data)', () => {
    it('should not auto-open any dialog when route data has no order', () => {
      createComponent({});

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('deep-link auto-open (order present in route data)', () => {
    it('should open the edit dialog for the resolved order and navigate back to /orders once it closes', () => {
      const resolvedOrder = orders[0];
      createComponent({ order: resolvedOrder });

      expect(dialogSpy.open).toHaveBeenCalledWith(
        OrderFormComponent,
        jasmine.objectContaining({ data: { order: resolvedOrder } }),
      );
      expect(routerSpy.navigate).not.toHaveBeenCalled();

      afterClosedSubject.next(undefined);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should navigate back to /orders even when the deep-linked dialog is confirmed (not just cancelled)', () => {
      const resolvedOrder = orders[0];
      orderServiceSpy.update.and.returnValue(of(resolvedOrder));
      createComponent({ order: resolvedOrder });
      orderServiceSpy.getAll.calls.reset();

      afterClosedSubject.next({ customer_id: 3, product_id: 5, quantity: 4 });

      expect(orderServiceSpy.update).toHaveBeenCalledWith(resolvedOrder.id, {
        customer_id: 3,
        product_id: 5,
        quantity: 4,
      });
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should not open the dialog and should redirect to /orders when a non-admin hits the deep link', () => {
      authStateStub.isAdmin.set(false);
      const resolvedOrder = orders[0];

      createComponent({ order: resolvedOrder });

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should force-close an already-open deep-linked dialog if isAdmin flips to false while it is open', () => {
      const resolvedOrder = orders[0];
      const fixture = createComponent({ order: resolvedOrder });

      expect(dialogSpy.open).toHaveBeenCalledTimes(1);
      expect(dialogRefStub.close).not.toHaveBeenCalled();

      authStateStub.isAdmin.set(false);
      fixture.detectChanges();
      fixture.detectChanges();

      expect(dialogRefStub.close).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/orders']);
    });
  });

  describe('openCreateDialog', () => {
    it('should open the form dialog with no order and reload after a successful create', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      const created: Order = orders[0];
      orderServiceSpy.create.and.returnValue(of(created));

      fixture.componentInstance.openCreateDialog();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        OrderFormComponent,
        jasmine.objectContaining({ data: { order: undefined } }),
      );

      afterClosedSubject.next({ customer_id: 3, product_id: 5, quantity: 2 });

      expect(orderServiceSpy.create).toHaveBeenCalledWith({ customer_id: 3, product_id: 5, quantity: 2 });
      expect(orderServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call create nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next(undefined);

      expect(orderServiceSpy.create).not.toHaveBeenCalled();
      expect(orderServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the create request errors', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      orderServiceSpy.create.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.openCreateDialog();
      afterClosedSubject.next({ customer_id: 3, product_id: 5, quantity: 2 });

      expect(orderServiceSpy.create).toHaveBeenCalled();
      expect(orderServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('openEditDialog', () => {
    it('should open the form dialog pre-filled with the order and reload after a successful update', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      const target = orders[0];
      const updated: Order = { ...target, quantity: 4 };
      orderServiceSpy.update.and.returnValue(of(updated));

      fixture.componentInstance.openEditDialog(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        OrderFormComponent,
        jasmine.objectContaining({ data: { order: target } }),
      );

      afterClosedSubject.next({ customer_id: 3, product_id: 5, quantity: 4 });

      expect(orderServiceSpy.update).toHaveBeenCalledWith(target.id, {
        customer_id: 3,
        product_id: 5,
        quantity: 4,
      });
      expect(orderServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call update nor reload when the dialog is cancelled', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      fixture.componentInstance.openEditDialog(orders[0]);
      afterClosedSubject.next(undefined);

      expect(orderServiceSpy.update).not.toHaveBeenCalled();
      expect(orderServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('should open the confirm dialog and reload after a confirmed delete', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      const target = orders[0];
      orderServiceSpy.delete.and.returnValue(of(undefined));

      fixture.componentInstance.confirmDelete(target);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        jasmine.objectContaining({
          data: {
            title: 'Delete order',
            message: `Delete order #${target.id}? This cannot be undone.`,
          },
        }),
      );

      afterClosedSubject.next(true);

      expect(orderServiceSpy.delete).toHaveBeenCalledWith(target.id);
      expect(orderServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });

    it('should not call delete nor reload when the confirmation is declined', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      fixture.componentInstance.confirmDelete(orders[0]);
      afterClosedSubject.next(false);

      expect(orderServiceSpy.delete).not.toHaveBeenCalled();
      expect(orderServiceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should not reload when the delete request errors', () => {
      const fixture = createComponent();
      orderServiceSpy.getAll.calls.reset();

      orderServiceSpy.delete.and.returnValue(throwError(() => new Error('boom')));

      fixture.componentInstance.confirmDelete(orders[0]);
      afterClosedSubject.next(true);

      expect(orderServiceSpy.delete).toHaveBeenCalled();
      expect(orderServiceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin gating', () => {
    it('should show the "New order" button when the user is admin', () => {
      const fixture = createComponent();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(buttons.some((text) => text?.includes('New order'))).toBeTrue();
    });

    it('should hide the "New order" button when the user is not admin', () => {
      authStateStub.isAdmin.set(false);

      const fixture = createComponent();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
      expect(buttons.some((text) => text?.includes('New order'))).toBeFalse();
    });
  });
});
