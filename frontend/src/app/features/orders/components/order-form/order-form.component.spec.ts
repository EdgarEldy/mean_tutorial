import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Customer } from '../../../customers/models/customer.model';
import { CustomerService } from '../../../customers/services/customer.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { Order } from '../../models/order.model';
import { OrderFormComponent, OrderFormDialogData } from './order-form.component';

const customers: Customer[] = [
  { id: 3, first_name: 'Jane', last_name: 'Doe', telephone: null, email: null, address: null },
  { id: 4, first_name: 'John', last_name: 'Smith', telephone: null, email: null, address: null },
];

const products: Product[] = [
  { id: 5, category_id: 1, product_name: 'Widget', unit_price: 9.99 },
  { id: 6, category_id: 2, product_name: 'Gadget', unit_price: 19.5 },
];

describe('OrderFormComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<OrderFormComponent>>;
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  function createComponent(data: OrderFormDialogData) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<OrderFormComponent>>('MatDialogRef', ['close']);
    customerServiceSpy = jasmine.createSpyObj<CustomerService>('CustomerService', ['getAll']);
    productServiceSpy = jasmine.createSpyObj<ProductService>('ProductService', ['getAll']);
    customerServiceSpy.getAll.and.returnValue(of(customers));
    productServiceSpy.getAll.and.returnValue(of(products));

    TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: ProductService, useValue: productServiceSpy },
      ],
    });

    return TestBed.createComponent(OrderFormComponent);
  }

  describe('create mode', () => {
    it('should create the component with an empty, untouched form', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(fixture.componentInstance).toBeTruthy();
      expect(fixture.componentInstance['isEditMode']).toBeFalse();
      expect(fixture.componentInstance['form'].controls.customer_id.value).toBe(0);
      expect(fixture.componentInstance['form'].controls.product_id.value).toBe(0);
      expect(fixture.componentInstance['form'].controls.quantity.value).toBe(1);
    });

    it('should populate the customer and product dropdowns from their respective services', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(customerServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(productServiceSpy.getAll).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance['customers']()).toEqual(customers);
      expect(fixture.componentInstance['products']()).toEqual(products);
    });

    it('should render the "New order" title and "Create" submit label', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('New order');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Create');
    });

    it('submit() should mark all fields touched and return early without closing when the form is invalid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.submit();

      const form = fixture.componentInstance['form'];
      expect(form.controls.customer_id.touched).toBeTrue();
      expect(form.controls.product_id.touched).toBeTrue();
      expect(form.controls.quantity.touched).toBeTrue();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('submit() should close the dialog with the form value when valid', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.customer_id.setValue(3);
      form.controls.product_id.setValue(5);
      form.controls.quantity.setValue(2);

      expect(form.valid).toBeTrue();

      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        customer_id: 3,
        product_id: 5,
        quantity: 2,
      });
    });

    it('cancel() should close the dialog with no result', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      fixture.componentInstance.cancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('total computed signal', () => {
    it('should be 0 when no product is selected', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      expect(fixture.componentInstance['total']()).toBe(0);
    });

    it('should be 0 when a product is selected but quantity is 0', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.product_id.setValue(5);
      form.controls.quantity.setValue(0);

      expect(fixture.componentInstance['total']()).toBe(0);
    });

    it('should recompute as quantity x the selected product unit_price when product_id changes', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.quantity.setValue(3);
      form.controls.product_id.setValue(5);

      expect(fixture.componentInstance['total']()).toBeCloseTo(29.97, 2);
    });

    it('should recompute when quantity changes for an already-selected product', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.product_id.setValue(6);
      form.controls.quantity.setValue(2);
      expect(fixture.componentInstance['total']()).toBeCloseTo(39.0, 2);

      form.controls.quantity.setValue(4);
      expect(fixture.componentInstance['total']()).toBeCloseTo(78.0, 2);
    });

    it('should recompute when switching from one selected product to another', () => {
      const fixture = createComponent({});
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.quantity.setValue(2);
      form.controls.product_id.setValue(5);
      expect(fixture.componentInstance['total']()).toBeCloseTo(19.98, 2);

      form.controls.product_id.setValue(6);
      expect(fixture.componentInstance['total']()).toBeCloseTo(39.0, 2);
    });
  });

  describe('edit mode', () => {
    const order: Order = {
      id: '10',
      quantity: 2,
      total: 19.98,
      customer: { id: '3', first_name: 'Jane', last_name: 'Doe' },
      product: { id: '5', product_name: 'Widget', unit_price: 9.99 },
    };

    it('should pre-fill the form with the given order and render the "Edit order" title and "Save" label', () => {
      const fixture = createComponent({ order });
      fixture.detectChanges();

      expect(fixture.componentInstance['isEditMode']).toBeTrue();
      const form = fixture.componentInstance['form'];
      expect(form.controls.quantity.value).toBe(2);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Edit order');
      expect(compiled.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Save');
    });

    // Regression test: order.customer.id / order.product.id come back from GraphQL as strings
    // (see order.model.ts), while the mat-select options below are populated from the REST
    // CustomerService/ProductService which use numeric ids. Seeding the form with the raw string
    // would silently fail to match any <mat-option [value]="customer.id"> (strict equality),
    // leaving the dropdown showing no selection even though the control technically has a value.
    it('should seed customer_id/product_id as numbers (not strings) so mat-select can match the numeric dropdown options', () => {
      const fixture = createComponent({ order });
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      expect(form.controls.customer_id.value).toBe(3);
      expect(typeof form.controls.customer_id.value).toBe('number');

      expect(form.controls.product_id.value).toBe(5);
      expect(typeof form.controls.product_id.value).toBe('number');
    });

    it('should seed customer_id/product_id as 0 when the order has no customer/product', () => {
      const orderWithoutRelations: Order = { ...order, customer: null, product: null };
      const fixture = createComponent({ order: orderWithoutRelations });
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      expect(form.controls.customer_id.value).toBe(0);
      expect(form.controls.product_id.value).toBe(0);
    });

    it('should seed the total from the pre-filled product and quantity', () => {
      const fixture = createComponent({ order });
      fixture.detectChanges();

      expect(fixture.componentInstance['total']()).toBeCloseTo(19.98, 2);
    });

    it('submit() should close the dialog with the updated value', () => {
      const fixture = createComponent({ order });
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.controls.quantity.setValue(5);
      form.controls.product_id.setValue(6);

      fixture.componentInstance.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        customer_id: 3,
        product_id: 6,
        quantity: 5,
      });
    });
  });
});
