import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // Initialize categories api
  private baseUrl: string = 'http://localhost:3000/api/categories';

  constructor(private http: HttpClient) {
  }

  // Get all categories
  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  // Get category details by id
  get(id: any): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  // Create a new category
  create(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  // Update an existing category
  update(id: any, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // Remove a category
  delete(id: any): Observable<Category> {
    return this.http.delete<Category>(`${this.baseUrl}/${id}`);
  }
}
