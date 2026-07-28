import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpParams, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('get() should issue a GET request to baseUrl + path and pass the envelope through untouched', () => {
    const mockResponse: ApiResponse<{ id: number }[]> = {
      success: true,
      message: 'OK',
      data: [{ id: 1 }],
    };

    service.get<{ id: number }[]>('/things').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/things`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('get() should forward HttpParams on the request', () => {
    const params = new HttpParams().set('page', '2');
    const mockResponse: ApiResponse<null> = { success: true, message: 'OK', data: null };

    service.get('/things', params).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/things` && r.params.get('page') === '2',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('post() should issue a POST request with the given body', () => {
    const body = { name: 'thing' };
    const mockResponse: ApiResponse<{ id: number }> = {
      success: true,
      message: 'Created',
      data: { id: 1 },
    };

    service.post<{ id: number }>('/things', body).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/things`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('put() should issue a PUT request with the given body', () => {
    const body = { name: 'updated' };
    const mockResponse: ApiResponse<{ id: number }> = {
      success: true,
      message: 'Updated',
      data: { id: 1 },
    };

    service.put<{ id: number }>('/things/1', body).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/things/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('delete() should issue a DELETE request to baseUrl + path', () => {
    const mockResponse: ApiResponse<null> = { success: true, message: 'Deleted', data: null };

    service.delete('/things/1').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/things/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should pass through an error envelope unchanged when success is false', () => {
    const mockResponse: ApiResponse<null> = {
      success: false,
      message: 'Not found',
      errors: ['id not found'],
    };

    service.get('/things/999').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/things/999`);
    req.flush(mockResponse);
  });
});
