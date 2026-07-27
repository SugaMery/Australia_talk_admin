import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface EmailTemplate {
  id: number;
  template_name: string;
  template_slug: string;
  subject: string;
  body: string;
  variables?: string;
  description?: string;
  is_default?: number | boolean;
  active: boolean | number;
  mail_settings_id?: number;
  type?: 'SYSTEM' | 'NEWSLETTER';
  requiredVariables?: string[];
  manualVariables?: string[];
  autoVariables?: string[];
  manualVariablesLabels?: { [key: string]: string };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EmailTemplatesService {
  private apiUrl = 'http://localhost:5000/email-templates';
  private token: string | null = localStorage.getItem('token');
  private templatesSubject = new BehaviorSubject<EmailTemplate[]>([]);
  
  templates$ = this.templatesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTemplatesOnInit();
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
   * Load templates on initialization with fallback to defaults
   */
  private loadTemplatesOnInit(): void {
    this.getEmailTemplates().subscribe({
      next: (templates) => {
        this.templatesSubject.next(templates);
      },
      error: (err) => {
        console.warn('Email templates endpoint not available, using defaults:', err.status);
        this.templatesSubject.next(this.getDefaultTemplates());
      }
    });
  }

  /**
   * Get templates$ Observable that directly emits EmailTemplate[] array
   */
  getTemplatesArray(): Observable<EmailTemplate[]> {
    return this.templates$;
  }

  /**
   * Get email templates with fallback to defaults
   */
  getEmailTemplates(): Observable<EmailTemplate[]> {
    return this.http.get<EmailTemplate[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap((templates) => {
        if (Array.isArray(templates)) {
          this.templatesSubject.next(templates);
        }
      }),
      catchError((error) => {
        // If 404, return default templates instead of throwing error
        if (error.status === 404) {
          console.warn('Email templates endpoint not found, using defaults');
          const defaults = this.getDefaultTemplates();
          this.templatesSubject.next(defaults);
          return of(defaults);
        }
        console.error('Error loading email templates:', error);
        // Return empty array on other errors
        const defaults = this.getDefaultTemplates();
        this.templatesSubject.next(defaults);
        return of(defaults);
      })
    );
  }

  /**
   * Get NEWSLETTER type templates only
   */
  getNewsletterTemplates(): Observable<EmailTemplate[]> {
    return this.http.get<EmailTemplate[]>(`${this.apiUrl.replace('/email-templates', '')}/newsletters/templates/available`, { headers: this.getHeaders() }).pipe(
      tap((templates) => {
        if (Array.isArray(templates)) {
          // Enrich with requiredVariables
          const enriched = templates.map(t => ({
            ...t,
            requiredVariables: this.extractVariables(t.variables)
          }));
          this.templatesSubject.next(enriched);
        }
      }),
      catchError((error) => {
        console.warn('Newsletter templates endpoint not available, filtering from defaults');
        const defaults = this.getDefaultTemplates().filter(t => t.type === 'NEWSLETTER');
        const enriched = defaults.map(t => ({
          ...t,
          requiredVariables: this.extractVariables(t.variables)
        }));
        this.templatesSubject.next(enriched);
        return of(enriched);
      })
    );
  }

  /**
   * Extract variable names from template variables string
   */
  private extractVariables(variables?: string): string[] {
    if (!variables) return [];
    return variables
      .split(',')
      .map(v => v.trim())
      .map(v => v.replace(/\{\{|\}\}/g, ''))
      .filter(v => v.length > 0);
  }

  /**
   * Get email template by ID
   */
  getEmailTemplateById(id: number): Observable<EmailTemplate> {
    return this.http.get<EmailTemplate>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get email template by slug
   */
  getEmailTemplateBySlug(slug: string): Observable<EmailTemplate> {
    return this.http.get<EmailTemplate>(`${this.apiUrl}/slug/${slug}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create new email template
   */
  createEmailTemplate(template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    return this.http.post<EmailTemplate>(this.apiUrl, template, { headers: this.getHeaders() }).pipe(
      tap((newTemplate) => {
        const current = this.templatesSubject.value;
        this.templatesSubject.next([...current, newTemplate]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update email template
   */
  updateEmailTemplate(id: number, template: Partial<EmailTemplate>): Observable<EmailTemplate> {
    return this.http.put<EmailTemplate>(`${this.apiUrl}/${id}`, template, { headers: this.getHeaders() }).pipe(
      tap((updated) => {
        const current = this.templatesSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index > -1) {
          current[index] = updated;
          this.templatesSubject.next([...current]);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete email template (soft delete)
   */
  deleteEmailTemplate(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const current = this.templatesSubject.value;
        this.templatesSubject.next(current.filter(t => t.id !== id));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get cached templates synchronously
   */
  getCurrentTemplates(): EmailTemplate[] {
    return this.templatesSubject.value;
  }

  /**
   * Get default email templates
   */
  private getDefaultTemplates(): EmailTemplate[] {
    return [
      {
        id: 1,
        template_name: 'Default',
        template_slug: 'default',
        subject: 'Newsletter',
        body: '<div style="font-family: Arial, sans-serif; padding: 20px;">{{ARTICLES_PLACEHOLDER}}</div>',
        active: true,
        is_default: 1,
        type: 'NEWSLETTER',
        variables: '{{ARTICLES_PLACEHOLDER}}'
      },
      {
        id: 2,
        template_name: 'Promotional',
        template_slug: 'promotional',
        subject: 'Special Offer',
        body: '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">{{ARTICLES_PLACEHOLDER}}</div>',
        active: true,
        is_default: 0,
        type: 'NEWSLETTER',
        variables: '{{ARTICLES_PLACEHOLDER}}'
      },
      {
        id: 3,
        template_name: 'Announcement',
        template_slug: 'announcement',
        subject: 'Important Announcement',
        body: '<div style="font-family: Arial, sans-serif; padding: 20px; border-left: 4px solid #007bff;">{{ARTICLES_PLACEHOLDER}}</div>',
        active: true,
        is_default: 0,
        type: 'NEWSLETTER',
        variables: '{{ARTICLES_PLACEHOLDER}}'
      }
    ];
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Email Templates API Error:', error);
    return throwError(() => error);
  }
}
