import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Category } from '../models/category.model';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put', 'delete']);
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
      ],
    });

    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should return response.data unwrapped when the request succeeds', (done) => {
      const categories: Category[] = [
        { id: 1, category_name: 'Books' },
        { id: 2, category_name: 'Electronics' },
      ];
      const response: ApiResponse<Category[]> = { success: true, message: 'OK', data: categories };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getAll().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/categories');
        expect(result).toEqual(categories);
        done();
      });
    });

    it('should return an empty array when response.data is missing', (done) => {
      const response: ApiResponse<Category[]> = { success: true, message: 'OK' };
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
    it('should post the payload, toast success and return the created category', (done) => {
      const input = { category_name: 'Books' };
      const created: Category = { id: 1, category_name: 'Books' };
      const response: ApiResponse<Category> = { success: true, message: 'Category created', data: created };
      apiServiceSpy.post.and.returnValue(of(response));

      service.create(input).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith('/categories', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Category created');
        expect(result).toEqual(created);
        done();
      });
    });

    it('should toast the first validation error message and rethrow when the request fails with validation errors', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: {
          success: false,
          message: 'Validation failed',
          errors: [{ msg: 'category_name is required' }],
        },
        status: 422,
      });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create({ category_name: '' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('category_name is required');
          expect(toastrSpy.success).not.toHaveBeenCalled();
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });

    it('should toast a generic fallback message when the error body has neither errors nor message', (done) => {
      const errorResponse = new HttpErrorResponse({ error: undefined, status: 0 });
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create({ category_name: 'Books' }).subscribe({
        next: () => fail('expected an error'),
        error: () => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should put the payload, toast success and return the updated category', (done) => {
      const input = { category_name: 'Updated' };
      const updated: Category = { id: 1, category_name: 'Updated' };
      const response: ApiResponse<Category> = { success: true, message: 'Category updated', data: updated };
      apiServiceSpy.put.and.returnValue(of(response));

      service.update(1, input).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith('/categories/1', input);
        expect(toastrSpy.success).toHaveBeenCalledWith('Category updated');
        expect(result).toEqual(updated);
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Category not found' },
        status: 404,
      });
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.update(999, { category_name: 'Updated' }).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Category not found');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete by id, toast success and return undefined', (done) => {
      const response: ApiResponse<void> = { success: true, message: 'Category deleted' };
      apiServiceSpy.delete.and.returnValue(of(response));

      service.delete(1).subscribe((result) => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith('/categories/1');
        expect(toastrSpy.success).toHaveBeenCalledWith('Category deleted');
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should toast the error message and rethrow when the request fails', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { success: false, message: 'Category not found' },
        status: 404,
      });
      apiServiceSpy.delete.and.returnValue(throwError(() => errorResponse));

      service.delete(999).subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(toastrSpy.error).toHaveBeenCalledWith('Category not found');
          expect(err).toBe(errorResponse);
          done();
        },
      });
    });
  });
});
