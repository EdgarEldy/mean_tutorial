import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Customer } from '../models/customer.model';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put', 'delete']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        CustomerService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    service = TestBed.inject(CustomerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should return response.data unwrapped when the request succeeds', (done) => {
      const customers: Customer[] = [
        { id: 1, first_name: 'Ada', last_name: 'Lovelace', telephone: null, email: 'ada@example.com', address: null },
        { id: 2, first_name: 'Alan', last_name: 'Turing', telephone: null, email: null, address: null },
      ];
      const response: ApiResponse<Customer[]> = { success: true, message: 'OK', data: customers };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getAll().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/customers');
        expect(result).toEqual(customers);
        done();
      });
    });

    it('should return an empty array when response.data is missing', (done) => {
      const response: ApiResponse<Customer[]> = { success: true, message: 'OK' };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getAll().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Something broke' },
        status: 500,
      });
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getAll().subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something broke');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should post the payload, toast success and return the created customer', (done) => {
      const input = { first_name: 'Ada' };
      const created: Customer = {
        id: 1,
        first_name: 'Ada',
        last_name: null,
        telephone: null,
        email: null,
        address: null,
      };
      const response: ApiResponse<Customer> = { success: true, message: 'Customer created', data: created };
      apiServiceSpy.post.and.returnValue(of(response));

      service.create(input).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/customers', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Customer created');
        expect(result).toEqual(created);
        done();
      });
    });

    it('should toast the first validation error message and rethrow when the request fails with validation errors', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: {
          success: false,
          message: 'Validation failed',
          errors: [{ msg: 'email must be a valid email' }],
        },
        status: 422,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create({ email: 'not-an-email' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('email must be a valid email');
          expect(toastrSpy.success).not.toHaveBeenCalled();
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });

    it('should toast a generic fallback message when the error body has neither errors nor message', (done) => {
      const errorResponse = new HttpErrorResponse({ error: undefined, status: 0 });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create({ first_name: 'Ada' }).subscribe({
        next: () => fail('expected an error'),
        error: () => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should put the payload, toast success and return the updated customer', (done) => {
      const input = { first_name: 'Updated' };
      const updated: Customer = {
        id: 1,
        first_name: 'Updated',
        last_name: null,
        telephone: null,
        email: null,
        address: null,
      };
      const response: ApiResponse<Customer> = { success: true, message: 'Customer updated', data: updated };
      apiServiceSpy.put.and.returnValue(of(response));

      service.update(1, input).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/customers/1', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Customer updated');
        expect(result).toEqual(updated);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Customer not found' },
        status: 404,
      });
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.update(999, { first_name: 'Updated' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Customer not found');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete by id, toast success and return undefined', (done) => {
      const response: ApiResponse<void> = { success: true, message: 'Customer deleted' };
      apiServiceSpy.delete.and.returnValue(of(response));

      service.delete(1).subscribe((result) => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/customers/1');
        expect(toastrSpy.success).toHaveBeenCalledWith('Customer deleted');
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Customer not found' },
        status: 404,
      });
      apiServiceSpy.delete.and.returnValue(throwError(() => errorResponse));

      service.delete(999).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Customer not found');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });
});
