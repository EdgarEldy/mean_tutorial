import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Customer, CustomerInput } from '../models/customer.model';

// Talks to the /customers REST endpoints and owns the toast feedback for this resource,
// unwrapping the ApiResponse envelope so callers only deal with plain Customer data.
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);
  private readonly toastr = inject(ToastrService);
  private readonly basePath = '/customers';

  getAll(): Observable<Customer[]> {
    return this.api
      .get<Customer[]>(this.basePath)
      .pipe(map((response) => response.data ?? []), catchError((error) => this.handleError(error)));
  }

  create(data: CustomerInput): Observable<Customer> {
    return this.api.post<Customer>(this.basePath, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as Customer),
      catchError((error) => this.handleError(error)),
    );
  }

  update(id: number, data: CustomerInput): Observable<Customer> {
    return this.api.put<Customer>(`${this.basePath}/${id}`, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as Customer),
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
