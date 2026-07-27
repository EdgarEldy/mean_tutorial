import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { GraphQlResponse } from '../models/graphql-response.model';
import { GraphqlService } from './graphql.service';

describe('GraphqlService', () => {
  let service: GraphqlService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(GraphqlService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('request() should POST { query, variables } to the /graphql endpoint and return response.data', (done) => {
    const query = 'query Orders { orders { id } }';
    const variables = { id: '1' };
    const mockResponse: GraphQlResponse<{ orders: { id: string }[] }> = {
      data: { orders: [{ id: '1' }] },
    };

    service.request<{ orders: { id: string }[] }>(query, variables).subscribe((result) => {
      expect(result).toEqual({ orders: [{ id: '1' }] });
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/graphql`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ query, variables });
    req.flush(mockResponse);
  });

  it('request() should POST with undefined variables when none are given', (done) => {
    const query = 'query Orders { orders { id } }';
    const mockResponse: GraphQlResponse<{ orders: unknown[] }> = { data: { orders: [] } };

    service.request<{ orders: unknown[] }>(query).subscribe((result) => {
      expect(result).toEqual({ orders: [] });
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/graphql`);
    expect(req.request.body).toEqual({ query, variables: undefined });
    req.flush(mockResponse);
  });

  it('request() should throw an Error joining the errors[].message even on an HTTP 200 response', (done) => {
    const query = 'query Order($id: ID!) { order(id: $id) { id } }';
    const mockResponse: GraphQlResponse<{ order: unknown }> = {
      errors: [{ message: 'Order not found' }, { message: 'Access denied' }],
    };

    service.request<{ order: unknown }>(query, { id: '999' }).subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err instanceof Error).toBeTrue();
        expect(err.message).toBe('Order not found, Access denied');
        done();
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/graphql`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse, { status: 200, statusText: 'OK' });
  });
});
