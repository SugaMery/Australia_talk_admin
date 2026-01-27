import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private apiUrl = 'https://api.australia-talk.com/languages';
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

  getLanguages(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createLanguage(language: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, language, { headers: this.getHeaders() });
  }

  updateLanguage(id: number, language: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, language, { headers: this.getHeaders() });
  }

  deleteLanguage(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  setDefaultLanguage(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/default`, {}, { headers: this.getHeaders() });
  }

  toggleLanguageActive(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }
}
