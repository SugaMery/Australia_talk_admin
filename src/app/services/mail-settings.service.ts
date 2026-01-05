import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MailSettingsService {
  private apiUrl = 'http://localhost:5000/mail-settings';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getMailSettings(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getMailSettingsById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/full`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createMailSettings(settings: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, settings, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  updateMailSettings(id: number, settings: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, settings, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteMailSettings(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  sendTestEmail(emailData: any): Observable<any> {
    // For test email, we'll need to add this endpoint to the backend
    // For now, return a success response
    return this.http.post<any>(`${this.apiUrl}/send-test`, emailData, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
