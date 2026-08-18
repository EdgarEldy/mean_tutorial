import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Category, CategoryInput } from '../models/category.model';

// Talks to the /categories REST endpoints and owns the toast feedback for this resource,
// unwrapping the ApiResponse envelope so callers only deal with plain Category data.
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);
  private readonly toastr = inject(ToastrService);
  private readonly basePath = '/categories';

  getAll(): Observable<Category[]> {
    return this.api
      .get<Category[]>(this.basePath)
      .pipe(map((response) => response.data ?? []), catchError((error) => this.handleError(error)));
  }

  create(data: CategoryInput): Observable<Category> {
    return this.api.post<Category>(this.basePath, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as Category),
      catchError((error) => this.handleError(error)),
    );
  }

  update(id: number, data: CategoryInput): Observable<Category> {
    return this.api.put<Category>(`${this.basePath}/${id}`, data).pipe(
      tap((response) => this.toastr.success(response.message)),
      map((response) => response.data as Category),
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

  // Shows the toast here so every consumer gets feedback for free, then rethrows with
  // throwError so the caller's own subscribe error handler still runs (e.g. to keep a
  // dialog open or skip a list reload). Swallowing the error here would hide failures
  // from the component instead of just reporting them.
  private handleError(error: HttpErrorResponse): Observable<never> {
    const body = error.error as ApiResponse<unknown> | undefined;
    const message = body?.errors?.length
      ? body.errors.map((validationError) => (validationError as { msg?: string }).msg).join(', ')
      : (body?.message ?? 'Something went wrong. Please try again.');

    this.toastr.error(message);
    return throwError(() => error);
  }
}
