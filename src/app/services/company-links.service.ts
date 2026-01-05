import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyLinksService {
  private apiUrl = 'http://localhost:5000/company-links';
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

  // Get all company links
  getCompanyLinks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Get company links by language
  getCompanyLinksByLanguage(languageId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?language_id=${languageId}`, { headers: this.getHeaders() });
  }

  // Create new company link
  createLink(link: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, link, { headers: this.getHeaders() });
  }

  // Update company link
  updateLink(id: number, link: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, link, { headers: this.getHeaders() });
  }

  // Delete company link
  deleteLink(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
