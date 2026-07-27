import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Product, ProductInput } from '../models/product.model';

// Talks to the /products REST endpoints and owns the toast feedback for this resource,
// unwrapping the ApiResponse envelope so callers only deal with plain Product data.
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);
  private readonly toastr = inject(ToastrService);
  private readonly basePath = '/products';

  getAll(): Observable<Product[]> {
    return this.api
      .get<Product[]>(this.basePath)
      .pipe(map((response) => response.data ?? []), catchError((error) => this.handleError(error)));
  }

  create(data: ProductInput): Observable<Product> {
    return this.api.post<Product>(this.basePath, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as Product),
      catchError((error) => this.handleError(error)),
    );
  }

  update(id: number, data: ProductInput): Observable<Product> {
    return this.api.put<Product>(`${this.basePath}/${id}`, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as Product),
      catchError((error) => this.handleError(error)),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(
      tap((response) => this.toastr.success(response.message)),
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const body = error.error as ApiResponse<unknown> | undefined;
    const message = body?.errors?.length
      ? body.errors.map((validationError) => (validationError as { msg?: string }).msg).join(', ')
      : (body?.message ?? 'Something went wrong. Please try again.');

    this.toastr.error(message);
    return throwError(() => error);
  }
}
