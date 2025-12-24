import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface GenerateArticleRequest {
  titre_ou_sujet: string;
}

export interface GenerateArticleResponse {
  success: boolean;
  content?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleGenerationService {
  private apiUrl = 'https://api.australia-talk.com/api/generate-article';
  private token: string | null = localStorage.getItem('token');

  constructor(private http: HttpClient) {}

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
   * Generate article content based on title/subject
   * @param title The article title or subject
   * @returns Observable with generated content
   */
  generateArticle(title: string): Observable<GenerateArticleResponse> {
    if (!title || !title.trim()) {
      return throwError(() => new Error('Title/subject is required'));
    }

    const payload: GenerateArticleRequest = {
      titre_ou_sujet: title
    };

    return this.http.post<any>(
      this.apiUrl,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Raw API Error:', error);
        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Article generation failed';

    if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again';
    } else if (error.status === 403) {
      errorMessage = 'Forbidden. You do not have permission to generate articles';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found';
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please try again later';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later';
    } else if (error.error) {
      errorMessage = error.error.error || error.error.message || errorMessage;
    }

    console.error('Article generation error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
