import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GraphQlResponse } from '../models/graphql-response.model';

// Thin POST wrapper around the /graphql endpoint, the GraphQL counterpart to ApiService.
// Only the orders feature uses this (the backend only exposes orders over GraphQL), but it
// lives in core/ alongside ApiService since it's base HTTP infrastructure, not feature logic.
@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/graphql`;

  request<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http.post<GraphQlResponse<T>>(this.endpoint, { query, variables }).pipe(
      map((response) => {
        // A resolver throwing (e.g. "Product not found") still comes back as HTTP 200 with an
        // errors array, so this has to be checked explicitly instead of relying on catchError.
        if (response.errors?.length) {
          throw new Error(response.errors.map((error) => error.message).join(', '));
        }
        return response.data as T;
      }),
    );
  }
}
