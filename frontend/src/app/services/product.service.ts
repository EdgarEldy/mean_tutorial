import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Initialize products api
  private readonly baseUrl: string = 'http://localhost:3000/api/products';

  constructor(private readonly http: HttpClient) {
  }

  // Get all products
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  // Get product details by id
  get(id: any): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  // Create a new product
  create(data: any): Observable<any> {
    return this.http.post<Product>(this.baseUrl, data);
  }

  // Update an existing product
  update(id: any, data: any): Observable<any> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, data);
  }

  // Remove a product
  delete(id: any): Observable<Product> {
    return this.http.delete<Product>(`${this.baseUrl}/${id}`);
  }
}
