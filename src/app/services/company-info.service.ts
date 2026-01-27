import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyInfoService {
  private apiUrl = 'https://api.australia-talk.com/company-info';
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
    // Always get fresh token from localStorage
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Get company info
  getCompanyInfo(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Update company info
  updateCompanyInfo(companyInfo: any): Observable<any> {
    // Use the ID from the company info object
    const id = companyInfo.id || 1;
    return this.http.put<any>(`${this.apiUrl}/${id}`, companyInfo, { headers: this.getHeaders() });
  }
}
