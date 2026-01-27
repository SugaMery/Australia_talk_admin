import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface MailSettings {
  id?: number | string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  enable_sitemap_email?: boolean;
  sitemap_email_frequency?: string;
  sitemap_email_recipients?: string;
  enable_newsletter?: boolean;
  newsletter_from_email?: string;
  enable_contact_form_email?: boolean;
  contact_form_recipient?: string;
  enable_error_notifications?: boolean;
  error_notification_email?: string;
  max_retries?: number;
  timeout?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class MailSettingsService {
  private apiUrl = 'https://api.australia-talk.com/api/mail-settings';
  private token: string | null = localStorage.getItem('token');
  private mailSettingsSubject = new BehaviorSubject<MailSettings | null>(null);
  private hasInitialized = false;
  
  mailSettings$ = this.mailSettingsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Don't load settings in constructor to avoid unnecessary API calls during initialization
    // Settings will be loaded lazily when first requested
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

  /**
   * Load mail settings on initialization with fallback to defaults
   */
  private markAsInitialized(): void {
    this.hasInitialized = true;
  }

  getMailSettings(): Observable<any> {
    // If already initialized, return cached value
    if (this.mailSettingsSubject.value) {
      return of({ data: this.mailSettingsSubject.value });
    }

    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap((response: any) => {
        const settings = response.data || response;
        console.log('Fetched mail settings:', settings);
        this.mailSettingsSubject.next(settings);
        this.markAsInitialized();
      }),
      catchError((error) => {
        // If 404, return default settings instead of throwing error
        if (error.status === 404) {
          console.info('Mail settings not found, using default configuration');
          const defaults = this.getDefaultSettings();
          this.mailSettingsSubject.next(defaults);
          this.markAsInitialized();
          return of({ data: defaults });
        }
        return this.handleError(error);
      })
    );
  }

  getMailSettingsById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/full`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createMailSettings(settings: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, settings, { headers: this.getHeaders() }).pipe(
      tap((response: any) => {
        const newSettings = response.data || response;
        this.mailSettingsSubject.next(newSettings);
      }),
      catchError(this.handleError)
    );
  }

  updateMailSettings(id: number, settings: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, settings, { headers: this.getHeaders() }).pipe(
      tap((response: any) => {
        const updatedSettings = response.data || response;
        this.mailSettingsSubject.next(updatedSettings);
      }),
      catchError(this.handleError)
    );
  }

  deleteMailSettings(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  sendTestEmail(emailData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-test`, emailData, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get current mail settings from cache
   */
  getCurrentSettings(): MailSettings | null {
    return this.mailSettingsSubject.value;
  }

  /**
   * Get newsletter from email
   */
  getNewsletterFromEmail(): string {
    const settings = this.getCurrentSettings();
    return settings?.newsletter_from_email || settings?.from_email || 'noreply@australia-talk.com';
  }

  /**
   * Get from name for newsletters
   */
  getFromName(): string {
    const settings = this.getCurrentSettings();
    return settings?.from_name || 'Australia Talk';
  }

  /**
   * Get default mail settings
   */
  private getDefaultSettings(): MailSettings {
    return {
      id: 0,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      from_email: 'noreply@australia-talk.com',
      from_name: 'Australia Talk',
      enable_sitemap_email: false,
      sitemap_email_frequency: 'weekly',
      enable_newsletter: true,
      enable_contact_form_email: false,
      enable_error_notifications: false,
      max_retries: 3,
      timeout: 30000
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
