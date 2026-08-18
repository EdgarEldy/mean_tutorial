import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put', 'delete']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should return response.data unwrapped when the request succeeds', (done) => {
      const products: Product[] = [
        { id: 1, category_id: 1, product_name: 'Widget', unit_price: 9.99, category: { id: 1, category_name: 'Books' } },
        { id: 2, category_id: 2, product_name: 'Gadget', unit_price: 19.99, category: { id: 2, category_name: 'Electronics' } },
      ];
      const response: ApiResponse<Product[]> = { success: true, message: 'OK', data: products };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getAll().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/products');
        expect(result).toEqual(products);
        done();
      });
    });

    it('should return an empty array when response.data is missing', (done) => {
      const response: ApiResponse<Product[]> = { success: true, message: 'OK' };
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
    it('should post the payload, toast success and return the created product', (done) => {
      const input = { product_name: 'Widget', unit_price: 9.99, category_id: 1 };
      const created: Product = { id: 1, category_id: 1, product_name: 'Widget', unit_price: 9.99 };
      const response: ApiResponse<Product> = { success: true, message: 'Product created', data: created };
      apiServiceSpy.post.and.returnValue(of(response));

      service.create(input).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/products', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Product created');
        expect(result).toEqual(created);
        done();
      });
    });

    it('should toast the first validation error message and rethrow when the request fails with validation errors', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: {
          success: false,
          message: 'Validation failed',
          errors: [{ msg: 'product_name is required' }],
        },
        status: 422,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create({ product_name: '', unit_price: 0, category_id: 0 }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('product_name is required');
          expect(toastrSpy.success).not.toHaveBeenCalled();
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });

    it('should toast a generic fallback message when the error body has neither errors nor message', (done) => {
      const errorResponse = new HttpErrorResponse({ error: undefined, status: 0 });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create({ product_name: 'Widget', unit_price: 9.99, category_id: 1 }).subscribe({
        next: () => fail('expected an error'),
        error: () => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should put the payload, toast success and return the updated product', (done) => {
      const input = { product_name: 'Updated', unit_price: 29.99, category_id: 2 };
      const updated: Product = { id: 1, category_id: 2, product_name: 'Updated', unit_price: 29.99 };
      const response: ApiResponse<Product> = { success: true, message: 'Product updated', data: updated };
      apiServiceSpy.put.and.returnValue(of(response));

      service.update(1, input).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/products/1', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Product updated');
        expect(result).toEqual(updated);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Product not found' },
        status: 404,
      });
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.update(999, { product_name: 'Updated', unit_price: 29.99, category_id: 2 }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Product not found');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete by id, toast success and return undefined', (done) => {
      const response: ApiResponse<void> = { success: true, message: 'Product deleted' };
      apiServiceSpy.delete.and.returnValue(of(response));

      service.delete(1).subscribe((result) => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/products/1');
        expect(toastrSpy.success).toHaveBeenCalledWith('Product deleted');
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Product not found' },
        status: 404,
      });
      apiServiceSpy.delete.and.returnValue(throwError(() => errorResponse));

      service.delete(999).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Product not found');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });
});
