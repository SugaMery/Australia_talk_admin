import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private apiUrl = 'http://localhost:5000/pricing';
  private token: string | null = null;

  constructor(private http: HttpClient) {
    // Load token from localStorage on service initialization
    this.token = localStorage.getItem('token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return headers;
  }

  // Get all contracts
  getContracts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Create new contract
  createContract(contract: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, contract, { headers: this.getHeaders() });
  }

  // Update contract
  updateContract(id: number, contract: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, contract, { headers: this.getHeaders() });
  }

  // Delete contract
  deleteContract(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
