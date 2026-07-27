import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SystemLinksService {
  private apiUrl = 'http://localhost:5000/company-links';
  private token: string | null = localStorage.getItem('token');

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getCompanyLinks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getCompanyLinksByLanguage(languageId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?language_id=${languageId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  updateLink(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createLink(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteLink(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
