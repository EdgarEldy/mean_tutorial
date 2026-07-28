import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Order } from '../../models/order.model';
import { OrderListComponent } from './order-list.component';

const orders: Order[] = [
  {
    id: '1',
    quantity: 2,
    total: 19.98,
    customer: { id: '3', first_name: 'Jane', last_name: 'Doe' },
    product: { id: '5', product_name: 'Widget', unit_price: 9.99 },
  },
  {
    id: '2',
    quantity: 1,
    total: 19.5,
    customer: { id: '4', first_name: null, last_name: null },
    product: { id: '6', product_name: 'Gadget', unit_price: 19.5 },
  },
];

describe('OrderListComponent', () => {
  function createComponent(isAdmin = true) {
    TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [provideNoopAnimations()],
    });

    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.componentRef.setInput('orders', orders);
    fixture.componentRef.setInput('isAdmin', isAdmin);
    return fixture;
  }

  it('should create the component', () => {
    const fixture = createComponent();
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('columns', () => {
    it('customer column should join first_name + last_name when both are present', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const columns = fixture.componentInstance['columns'];
      const customerColumn = columns.find((c) => c.key === 'customer')!;
      expect(customerColumn.value(orders[0])).toBe('Jane Doe');
    });

    it('customer column should fall back to "Customer #{id}" when first_name and last_name are both null', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const columns = fixture.componentInstance['columns'];
      const customerColumn = columns.find((c) => c.key === 'customer')!;
      expect(customerColumn.value(orders[1])).toBe('Customer #4');
    });

    it('customer column should fall back to "Unknown customer" when order.customer is null', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const orderWithoutCustomer: Order = { ...orders[0], customer: null };
      const columns = fixture.componentInstance['columns'];
      const customerColumn = columns.find((c) => c.key === 'customer')!;
      expect(customerColumn.value(orderWithoutCustomer)).toBe('Unknown customer');
    });

    it('product column should render the product name when present', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const columns = fixture.componentInstance['columns'];
      const productColumn = columns.find((c) => c.key === 'product')!;
      expect(productColumn.value(orders[0])).toBe('Widget');
    });

    it('product column should fall back to "Unknown product" when order.product is null', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const orderWithoutProduct: Order = { ...orders[0], product: null };
      const columns = fixture.componentInstance['columns'];
      const productColumn = columns.find((c) => c.key === 'product')!;
      expect(productColumn.value(orderWithoutProduct)).toBe('Unknown product');
    });

    it('quantity column should render the quantity as a string', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const columns = fixture.componentInstance['columns'];
      const quantityColumn = columns.find((c) => c.key === 'quantity')!;
      expect(quantityColumn.value(orders[0])).toBe('2');
    });

    it('total column should render the total formatted as currency', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const columns = fixture.componentInstance['columns'];
      const totalColumn = columns.find((c) => c.key === 'total')!;
      expect(totalColumn.value(orders[0])).toBe('$19.98');
    });
  });

  describe('actions', () => {
    it('should wire edit and delete row actions when isAdmin is true', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const actions = fixture.componentInstance['actions']();
      expect(actions.length).toBe(2);
    });

    it('should expose no actions when isAdmin is false (the default)', () => {
      const fixture = createComponent(false);
      fixture.detectChanges();

      expect(fixture.componentInstance['actions']()).toEqual([]);
    });

    it('should hide the actions column entirely and render no edit/delete buttons when isAdmin is false', () => {
      const fixture = createComponent(false);
      fixture.detectChanges();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('button[aria-label="Edit"]').length).toBe(0);
      expect(compiled.querySelectorAll('button[aria-label="Delete"]').length).toBe(0);
    });

    it('edit action should emit the row via the edit output', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const emitted: Order[] = [];
      fixture.componentInstance.edit.subscribe((order) => emitted.push(order));

      const editAction = fixture.componentInstance['actions']().find((a) => a.label === 'Edit')!;
      editAction.handler(orders[0]);

      expect(emitted).toEqual([orders[0]]);
    });

    it('delete action should emit the row via the delete output', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      const emitted: Order[] = [];
      fixture.componentInstance.delete.subscribe((order) => emitted.push(order));

      const deleteAction = fixture.componentInstance['actions']().find((a) => a.label === 'Delete')!;
      deleteAction.handler(orders[1]);

      expect(emitted).toEqual([orders[1]]);
    });
  });

  describe('totalRevenue', () => {
    it('should be the sum of every order total', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      expect(fixture.componentInstance['totalRevenue']()).toBeCloseTo(39.48, 2);
    });

    it('should update when the orders input changes', () => {
      const fixture = createComponent();
      fixture.detectChanges();

      expect(fixture.componentInstance['totalRevenue']()).toBeCloseTo(39.48, 2);

      fixture.componentRef.setInput('orders', [orders[0]]);
      fixture.detectChanges();

      expect(fixture.componentInstance['totalRevenue']()).toBeCloseTo(19.98, 2);
    });

    it('should be 0 for an empty orders list', () => {
      const fixture = createComponent();
      fixture.componentRef.setInput('orders', []);
      fixture.detectChanges();

      expect(fixture.componentInstance['totalRevenue']()).toBe(0);
    });
  });
});
