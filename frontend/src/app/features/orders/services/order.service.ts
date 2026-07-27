import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GraphqlService } from '../../../core/services/graphql.service';
import { Order, OrderInput } from '../models/order.model';

const ORDER_FIELDS = `
  id
  quantity
  total
  customer { id first_name last_name }
  product { id product_name unit_price }
`;

const ORDERS_QUERY = `query Orders { orders { ${ORDER_FIELDS} } }`;
const ORDER_QUERY = `query Order($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`;
const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { ${ORDER_FIELDS} } }
`;
const UPDATE_ORDER_MUTATION = `
  mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) { updateOrder(id: $id, input: $input) { ${ORDER_FIELDS} } }
`;
const DELETE_ORDER_MUTATION = `mutation DeleteOrder($id: ID!) { deleteOrder(id: $id) }`;

// Talks to the /graphql endpoint for the orders resource (the only one exposed over GraphQL
// on the backend) instead of REST, but otherwise owns toast feedback the same way the REST
// feature services do.
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly graphql = inject(GraphqlService);
  private readonly toastr = inject(ToastrService);

  getAll(): Observable<Order[]> {
    return this.graphql
      .request<{ orders: Order[] }>(ORDERS_QUERY)
      .pipe(map((response) => response.orders), catchError((error) => this.handleError(error)));
  }

  getById(id: string): Observable<Order> {
    return this.graphql
      .request<{ order: Order }>(ORDER_QUERY, { id })
      .pipe(map((response) => response.order), catchError((error) => this.handleError(error)));
  }

  create(input: OrderInput): Observable<Order> {
    return this.graphql.request<{ createOrder: Order }>(CREATE_ORDER_MUTATION, { input }).pipe(
      tap(() => this.toastr.success('Order created successfully')),
      map((response) => response.createOrder),
      catchError((error) => this.handleError(error)),
    );
  }

  update(id: string, input: OrderInput): Observable<Order> {
    return this.graphql.request<{ updateOrder: Order }>(UPDATE_ORDER_MUTATION, { id, input }).pipe(
      tap(() => this.toastr.success('Order updated successfully')),
      map((response) => response.updateOrder),
      catchError((error) => this.handleError(error)),
    );
  }

  delete(id: string): Observable<void> {
    return this.graphql.request<{ deleteOrder: boolean }>(DELETE_ORDER_MUTATION, { id }).pipe(
      tap(() => this.toastr.success('Order deleted successfully')),
      map(() => undefined),
      catchError((error) => this.handleError(error)),
    );
  }

  // GraphqlService throws a plain Error for in-payload GraphQL errors, while a transport-level
  // failure surfaces as an HttpErrorResponse, both expose .message so this handles either
  // uniformly instead of assuming the REST-only ApiResponse shape used by handleError elsewhere.
  private handleError(error: unknown): Observable<never> {
    const message = (error as { message?: string })?.message ?? 'Something went wrong. Please try again.';
    this.toastr.error(message);
    return throwError(() => error);
  }
}
