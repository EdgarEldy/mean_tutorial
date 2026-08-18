import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { GraphqlService } from '../../../core/services/graphql.service';
import { Order, OrderInput } from '../models/order.model';
import { OrderService } from './order.service';

const order: Order = {
  id: '1',
  quantity: 2,
  total: 19.98,
  customer: { id: '3', first_name: 'Jane', last_name: 'Doe' },
  product: { id: '5', product_name: 'Widget', unit_price: 9.99 },
};

describe('OrderService', () => {
  let service: OrderService;
  let graphqlServiceSpy: jasmine.SpyObj<GraphqlService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    graphqlServiceSpy = jasmine.createSpyObj<GraphqlService>('GraphqlService', ['request']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        OrderService,
        { provide: GraphqlService, useValue: graphqlServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    service = TestBed.inject(OrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should unwrap { orders } from the query response', (done) => {
      graphqlServiceSpy.request.and.returnValue(of({ orders: [order] }));

      service.getAll().subscribe((result) => {
        expect(graphqlServiceSpy.request).toHaveBeenCalledWith(jasmine.any(String));
        expect(result).toEqual([order]);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const error = new Error('Something broke');
      graphqlServiceSpy.request.and.returnValue(throwError(() => error));

      service.getAll().subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something broke');
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getById', () => {
    it('should unwrap { order } from the query response', (done) => {
      graphqlServiceSpy.request.and.returnValue(of({ order }));

      service.getById('1').subscribe((result) => {
        expect(graphqlServiceSpy.request).toHaveBeenCalledWith(jasmine.any(String), { id: '1' });
        expect(result).toEqual(order);
        done();
      });
    });

    it('should toast the error message and rethrow when the order is not found', (done) => {
      const error = new Error('Order not found');
      graphqlServiceSpy.request.and.returnValue(throwError(() => error));

      service.getById('999').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Order not found');
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should show a hardcoded success toast and unwrap { createOrder }', (done) => {
      const input: OrderInput = { customer_id: 3, product_id: 5, quantity: 2 };
      graphqlServiceSpy.request.and.returnValue(of({ createOrder: order }));

      service.create(input).subscribe((result) => {
        expect(graphqlServiceSpy.request).toHaveBeenCalledWith(jasmine.any(String), { input });
        expect(toastrSpy.success).toHaveBeenCalledWith('Order created successfully');
        expect(result).toEqual(order);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const input: OrderInput = { customer_id: 3, product_id: 5, quantity: 2 };
      const error = new Error('Validation failed');
      graphqlServiceSpy.request.and.returnValue(throwError(() => error));

      service.create(input).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Validation failed');
          expect(toastrSpy.success).not.toHaveBeenCalled();
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should show a hardcoded success toast and unwrap { updateOrder }', (done) => {
      const input: OrderInput = { customer_id: 3, product_id: 5, quantity: 4 };
      const updated: Order = { ...order, quantity: 4, total: 39.96 };
      graphqlServiceSpy.request.and.returnValue(of({ updateOrder: updated }));

      service.update('1', input).subscribe((result) => {
        expect(graphqlServiceSpy.request).toHaveBeenCalledWith(jasmine.any(String), { id: '1', input });
        expect(toastrSpy.success).toHaveBeenCalledWith('Order updated successfully');
        expect(result).toEqual(updated);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const input: OrderInput = { customer_id: 3, product_id: 5, quantity: 4 };
      const error = new Error('Order not found');
      graphqlServiceSpy.request.and.returnValue(throwError(() => error));

      service.update('999', input).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Order not found');
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should show a hardcoded success toast, unwrap { deleteOrder } and return undefined', (done) => {
      graphqlServiceSpy.request.and.returnValue(of({ deleteOrder: true }));

      service.delete('1').subscribe((result) => {
        expect(graphqlServiceSpy.request).toHaveBeenCalledWith(jasmine.any(String), { id: '1' });
        expect(toastrSpy.success).toHaveBeenCalledWith('Order deleted successfully');
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const error = new Error('Order not found');
      graphqlServiceSpy.request.and.returnValue(throwError(() => error));

      service.delete('999').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Order not found');
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('handleError', () => {
    it('should toast the message and rethrow a plain Error unchanged', (done) => {
      const error = new Error('Boom');
      graphqlServiceSpy.request.and.returnValue(throwError(() => error));

      service.getAll().subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Boom');
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should toast the message and rethrow a mock HttpErrorResponse-shaped error unchanged', (done) => {
      // A transport-level failure (e.g. the /graphql request itself never reaches the server)
      // surfaces as an HttpErrorResponse, which also exposes a .message, unlike the plain Error
      // GraphqlService throws for an in-payload GraphQL errors array.
      const httpError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', url: '/graphql' });
      graphqlServiceSpy.request.and.returnValue(throwError(() => httpError));

      service.getAll().subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith(httpError.message);
          expect(err).toBe(httpError);
          done();
        },
      });
    });

    it('should toast the fallback message when the error has no .message', (done) => {
      graphqlServiceSpy.request.and.returnValue(throwError(() => ({})));

      service.getAll().subscribe({
        next: () => fail('expected an error'),
        error: () => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
          done();
        },
      });
    });
  });
});
