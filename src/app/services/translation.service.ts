import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TranslateRequest {
  text: string;
  target_language: string;
}

export interface TranslateResponse {
  success: boolean;
  original_text?: string;
  translated_text?: string;
  target_language?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private apiUrl = 'https://api.australia-talk.com/translate';
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
   * Translate text to target language
   * @param text The text to translate
   * @param targetLanguage The target language code (e.g., 'en', 'es')
   * @returns Observable with translated text
   */
  translate(text: string, targetLanguage: string): Observable<TranslateResponse> {
    if (!text || !text.trim()) {
      return throwError(() => new Error('Text is required'));
    }

    if (!targetLanguage || !targetLanguage.trim()) {
      return throwError(() => new Error('Target language is required'));
    }

    const payload: TranslateRequest = {
      text: text,
      target_language: targetLanguage
    };

    return this.http.post<TranslateResponse>(
      this.apiUrl,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Raw Translation API Error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Translate text with retry logic
   * @param text The text to translate
   * @param targetLanguage The target language code
   * @param maxAttempts Number of retry attempts
   * @returns Promise with translated text
   */
  async translateWithRetry(
    text: string,
    targetLanguage: string,
    maxAttempts: number = 3
  ): Promise<string> {
    if (!text || !text.trim()) return '';

    let lastErr: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resp = await this.translate(text, targetLanguage).toPromise();

        if (!resp || !resp.success) {
          lastErr = new Error(`Translation failed: ${resp?.error || 'Unknown error'}`);
          throw lastErr;
        }

        // Extract translated text from response
        const translated = resp.translated_text;
        if (!translated) {
          lastErr = new Error('Translation returned empty result');
          throw lastErr;
        }

        return translated;
      } catch (err: any) {
        lastErr = err;
        const errMsg = err?.message || err?.error?.message || JSON.stringify(err);
        console.warn(`translateWithRetry attempt ${attempt} failed:`, {
          status: err?.status,
          message: errMsg,
          error: err?.error
        });

        // Don't retry on rate limit or service errors
        if (errMsg.includes('translation_service_unavailable') || errMsg.includes('503')) {
          throw lastErr;
        }

        // small backoff before retry
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 300 * attempt));
        }
      }
    }

    // After retries, rethrow the last error
    throw lastErr || new Error('Translation failed after multiple attempts');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Translation failed';

    if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection';
    } else if (error.status === 400) {
      errorMessage = 'Bad request. Check your input parameters';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again';
    } else if (error.status === 403) {
      errorMessage = 'Forbidden. You do not have permission to translate';
    } else if (error.status === 404) {
      errorMessage = 'API endpoint not found';
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please try again later';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later';
    } else if (error.error) {
      errorMessage = error.error.error || error.error.message || errorMessage;
    }

    console.error('Translation service error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
