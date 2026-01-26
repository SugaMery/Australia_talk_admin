import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// ========================================
// INTERFACES
// ========================================

export interface Newsletter {
  id: number | string;
  name: string;
  slug: string;
  subject: string;
  template_id: number;
  description?: string;
  preview_text?: string;
  sending_date?: Date;
  scheduled_at?: Date | null;
  sent_at?: Date | null;
  is_sent: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  template_name?: string;
  template_slug?: string;
  created_by_name?: string;
  article_count?: number;
}

export interface NewsletterDetail extends Newsletter {
  articles: NewsletterArticle[];
  statistics: NewsletterStatistics | null;
  template_body?: string;
}

export interface NewsletterArticle {
  id: number;
  article_id: number;
  position: number;
  article_image_override?: string;
  article_excerpt_override?: string;
  title: string;
  slug: string;
  body: string;
  image_path: string;
  category?: string;
  created_at?: Date;
}

export interface NewsletterStatistics {
  id: number;
  newsletter_id: number;
  total_sent: number;
  open_rate: number;
  click_rate: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Subscriber {
  id: string | number;
  email: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  uuid?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: string | null;
  full_name?: string;
  subscribed_at?: Date;
  status?: 'active' | 'inactive' | 'unsubscribed';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  count?: number;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    total?: number;
    pending?: number;
    sent?: number;
    failed?: number;
    bounced?: number;
  };
}

export interface SendNewsletterResponse {
  success: boolean;
  message: string;
  sent: number;
  failed: number;
  errors?: Array<{ email: string; error: string }>;
}

export interface EmailTemplate {
  id: number;
  template_name: string;
  template_slug: string;
  subject: string;
  body: string;
  active: boolean;
  type?: 'SYSTEM' | 'NEWSLETTER';
  variables?: string;
  requiredVariables?: string[];
  manualVariables?: string[];
  autoVariables?: string[];
  manualVariablesLabels?: { [key: string]: string };
  created_at?: Date;
  updated_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private apiUrl = `${environment.apiUrl}/api/newsletters`;
  private subscribersUrl = `${environment.apiUrl}/api/subscribers`;
  private templatesUrl = `${environment.apiUrl}/api/email-templates`;
  private token: string | null = localStorage.getItem('token');
  
  private newslettersSubject = new BehaviorSubject<Newsletter[]>([]);
  private subscribersSubject = new BehaviorSubject<Subscriber[]>([]);
  private templatesSubject = new BehaviorSubject<EmailTemplate[]>([]);

  newsletters$ = this.newslettersSubject.asObservable();
  subscribers$ = this.subscribersSubject.asObservable();
  templates$ = this.templatesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ========================================
  // TOKEN MANAGEMENT
  // ========================================

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

  // ========================================
  // NEWSLETTER METHODS
  // ========================================

  /**
   * Get all newsletters with pagination and filters
   */
  getNewsletters(
    page: number = 1,
    limit: number = 10,
    isSent?: boolean,
    search?: string
  ): Observable<ApiResponse<Newsletter[]>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (isSent !== undefined) {
      params.append('is_sent', isSent ? 'true' : 'false');
    }
    if (search) {
      params.append('search', search);
    }

    return this.http.get<ApiResponse<Newsletter[]>>(
      `${this.apiUrl}?${params.toString()}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.data) {
          this.newslettersSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get newsletter by ID with articles and statistics
   */
  getNewsletterById(id: string | number): Observable<ApiResponse<NewsletterDetail>> {
    return this.http.get<ApiResponse<NewsletterDetail>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Create new newsletter with required variables validation
   */
  createNewsletter(newsletter: {
    name: string;
    slug: string;
    subject: string;
    template_id: number;
    description?: string;
    preview_text?: string;
    [key: string]: any; // Allow additional template variables
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      this.apiUrl,
      newsletter,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update newsletter
   */
  updateNewsletter(
    id: string | number,
    newsletter: {
      name?: string;
      subject?: string;
      template_id?: number;
      description?: string;
      preview_text?: string;
    }
  ): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}`,
      newsletter,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete newsletter (soft delete)
   */
  deleteNewsletter(id: string | number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        const current = this.newslettersSubject.value;
        this.newslettersSubject.next(current.filter(n => n.id !== id));
      })
    );
  }

  /**
   * Duplicate newsletter
   */
  duplicateNewsletter(id: string | number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${id}/duplicate`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ========================================
  // NEWSLETTER ARTICLES
  // ========================================

  /**
   * Add/update articles in newsletter
   */
  updateNewsletterArticles(
    id: string | number,
    articles: Array<{
      article_id: number;
      position: number;
      article_image_override?: string;
      article_excerpt_override?: string;
    }>
  ): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${id}/articles`,
      { articles },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get articles for newsletter
   */
  getNewsletterArticles(id: string | number): Observable<ApiResponse<NewsletterArticle[]>> {
    return this.http.get<ApiResponse<NewsletterArticle[]>>(
      `${this.apiUrl}/${id}/articles`,
      { headers: this.getHeaders() }
    );
  }

  // ========================================
  // NEWSLETTER SEND & SCHEDULE
  // ========================================

  /**
   * Send newsletter to subscribers
   */
  sendNewsletter(id: string | number, testMode: boolean = false, testEmails: string[] = []): Observable<ApiResponse<SendNewsletterResponse>> {
    const payload = {
      test_mode: testMode,
      test_emails: testEmails,
    };

    return this.http.post<ApiResponse<SendNewsletterResponse>>(
      `${this.apiUrl}/${id}/send`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Schedule newsletter for later
   */
  scheduleNewsletter(id: string | number, scheduledAt: Date): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${id}/schedule`,
      { scheduled_at: scheduledAt },
      { headers: this.getHeaders() }
    );
  }

  // ========================================
  // NEWSLETTER STATISTICS
  // ========================================

  /**
   * Get newsletter statistics
   */
  getNewsletterStats(id: string | number): Observable<ApiResponse<NewsletterStatistics>> {
    return this.http.get<ApiResponse<NewsletterStatistics>>(
      `${this.apiUrl}/${id}/stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get newsletter recipients with delivery status
   */
  getNewsletterRecipients(
    id: string | number,
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Observable<ApiResponse<any>> {
    let url = `${this.apiUrl}/${id}/recipients?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<ApiResponse<any>>(
      url,
      { headers: this.getHeaders() }
    );
  }

  // ========================================
  // SUBSCRIBER METHODS
  // ========================================

  /**
   * Get all subscribers with fallback to empty array if endpoint not available
   */
  getSubscribers(): Observable<Subscriber[]> {
    return this.http.get<Subscriber[]>(
      this.subscribersUrl,
      { headers: this.getHeaders() }
    ).pipe(
      tap(data => this.subscribersSubject.next(data)),
      catchError((error) => {
        // If 404, return empty array instead of throwing error
        if (error.status === 404) {
          console.warn('Subscribers endpoint not found, returning empty array');
          this.subscribersSubject.next([]);
          return of([]);
        }
        console.error('Error loading subscribers:', error);
        // Return empty array on other errors
        return of([]);
      })
    );
  }

  /**
   * Get available recipients for newsletter creation
   */
  getAvailableRecipients(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/recipients/available`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error loading available recipients:', error);
        // Return empty array on error
        return of([]);
      })
    );
  }

  /**
   * Delete subscriber
   */
  deleteSubscriber(id: string | number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.subscribersUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        const current = this.subscribersSubject.value;
        this.subscribersSubject.next(current.filter(s => s.id !== id));
      })
    );
  }

  // ========================================
  // EMAIL TEMPLATES
  // ========================================

  /**
   * Get email templates with fallback to defaults if endpoint not available
   */
  getEmailTemplates(): Observable<ApiResponse<EmailTemplate[]>> {
    return this.http.get<ApiResponse<EmailTemplate[]>>(
      this.templatesUrl,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.data) {
          this.templatesSubject.next(response.data);
        }
      }),
      catchError((error) => {
        // If 404, return default templates instead of throwing error
        if (error.status === 404) {
          console.warn('Email templates endpoint not found, using defaults');
          const defaultTemplates: EmailTemplate[] = [
            {
              id: 1,
              template_name: 'Default',
              template_slug: 'default',
              subject: 'Newsletter',
              body: '<div>{{ARTICLES_PLACEHOLDER}}</div>',
              active: true
            },
            {
              id: 2,
              template_name: 'Promotional',
              template_slug: 'promotional',
              subject: 'Special Offer',
              body: '<div class="promotional">{{ARTICLES_PLACEHOLDER}}</div>',
              active: true
            },
            {
              id: 3,
              template_name: 'Announcement',
              template_slug: 'announcement',
              subject: 'Important Announcement',
              body: '<div class="announcement">{{ARTICLES_PLACEHOLDER}}</div>',
              active: true
            }
          ];
          this.templatesSubject.next(defaultTemplates);
          return of({ success: true, data: defaultTemplates, message: 'Using default templates' });
        }
        console.error('Error loading email templates:', error);
        // Return empty array on other errors
        return of({ success: false, data: [], message: 'Failed to load templates' });
      })
    );
  }

  // ========================================
  // EXPORT METHODS
  // ========================================

  /**
   * Export newsletters to Excel
   */
  exportNewslettersToExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/export/excel`,
      { headers: this.getHeaders(), responseType: 'blob' }
    );
  }

  /**
   * Export newsletters to PDF
   */
  exportNewslettersToPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/export/pdf`,
      { headers: this.getHeaders(), responseType: 'blob' }
    );
  }

  /**
   * Export subscribers to Excel
   */
  exportSubscribersToExcel(): Observable<Blob> {
    return this.http.get(
      `${this.subscribersUrl}/export/excel`,
      { headers: this.getHeaders(), responseType: 'blob' }
    );
  }

  // ========================================
  // SCHEDULER DEBUG & TESTING
  // ========================================

  /**
   * Get scheduler status and debug information
   */
  getSchedulerStatus(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/debug/scheduler-status`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error fetching scheduler status:', error);
        return of({
          success: false,
          data: null,
          message: 'Failed to fetch scheduler status',
          error: error.message
        } as ApiResponse<any>);
      })
    );
  }

  /**
   * Send newsletter manually (bypasses scheduler)
   */
  sendNewsletterManual(id: string | number): Observable<ApiResponse<SendNewsletterResponse>> {
    return this.http.post<ApiResponse<SendNewsletterResponse>>(
      `${this.apiUrl}/${id}/send-manual`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error sending newsletter manually:', error);
        return of({
          success: false,
          message: error.error?.message || 'Failed to send newsletter manually',
          sent: 0,
          failed: 0,
          errors: []
        } as any);
      })
    );
  }

  /**
   * Run scheduler check manually (trigger a single check cycle)
   */
  triggerSchedulerCheck(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/debug/trigger-scheduler`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error triggering scheduler check:', error);
        return of({
          success: false,
          data: null,
          message: 'Failed to trigger scheduler check',
          error: error.message
        } as ApiResponse<any>);
      })
    );
  }
}
