import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface CategoryTranslation {
  id?: number;
  category_id: number;
  language_id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  slug: string;
  icon_id?: number;
  parent_id?: number;
  type: 'Free' | 'Paid';
  active?: boolean;
  cart_order?: number;
  model: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  language_id?: number;
  translation?: CategoryTranslation;
}

export interface CategoryWithContent extends Category {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;
  private token: string | null = localStorage.getItem('token');
  private defaultLanguageId = 1; // French is the default language

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
   * Get the current language ID (default to French if not set)
   */
  private getLanguageId(): number {
    const storedLangId = localStorage.getItem('language_id');
    return storedLangId ? Number(storedLangId) : this.defaultLanguageId;
  }

  /**
   * Set the language ID for translations
   */
  setLanguageId(languageId: number): void {
    localStorage.setItem('language_id', languageId.toString());
  }

  /**
   * Extract name from translation object
   * Falls back to French (language_id = 1) if translation not found
   */
  private extractTranslationContent(category: Category): CategoryWithContent {
    let name = '';

    if (category.translation) {
      name = category.translation.name || '';
    }

    return {
      ...category,
      name,
    };
  }

  getAll(languageId?: number): Observable<CategoryWithContent[]> {
    const lang = languageId || this.getLanguageId();
    return this.http.get<Category[]>(this.apiUrl, { 
      headers: this.getHeaders(),
      params: { language_id: lang.toString() }
    }).pipe(
      map(categories => categories.map(category => this.extractTranslationContent(category))),
      catchError(this.handleError)
    );
  }

  getById(id: number, languageId?: number): Observable<CategoryWithContent> {
    const lang = languageId || this.getLanguageId();
    return this.http.get<Category>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders(),
      params: { language_id: lang.toString() }
    }).pipe(
      map(category => this.extractTranslationContent(category)),
      catchError(this.handleError)
    );
  }

  create(category: { name: string; icon_id?: number; parent_id?: number; type: 'Free' | 'Paid'; active?: boolean; language_id?: number }): Observable<CategoryWithContent> {
    const languageId = category.language_id || this.getLanguageId();
    const payload = { ...category, language_id: languageId };
    return this.http.post<Category>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
      map(response => this.extractTranslationContent(response)),
      catchError(this.handleError)
    );
  }

  update(id: number, category: { name: string; icon_id?: number; parent_id?: number; type: 'Free' | 'Paid'; active?: boolean; language_id?: number }): Observable<CategoryWithContent> {
    const languageId = category.language_id || this.getLanguageId();
    const payload = { ...category, language_id: languageId };
    return this.http.put<Category>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }).pipe(
      map(response => this.extractTranslationContent(response)),
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inattendue est survenue';
    if (error.status === 0) {
      errorMessage = 'Erreur réseau : Veuillez vérifier votre connexion';
    } else if (error.error) {
      if (error.status === 401) {
        errorMessage = 'Non autorisé : Veuillez vous connecter';
        this.clearToken();
      } else if (error.status === 403) {
        errorMessage = 'Accès interdit : Jeton invalide';
        this.clearToken();
      } else if (error.status === 404) {
        errorMessage = 'Catégorie non trouvée';
      } else if (error.status === 409) {
        errorMessage = error.error.error || 'Conflit : Le slug existe déjà';
      } else if (error.status === 400) {
        errorMessage = error.error.errors ? error.error.errors.map((err: any) => err.msg).join(', ') : 'Entrée invalide';
      } else {
        errorMessage = error.error.error || 'Erreur du serveur';
      }
    }
    console.error('Erreur :', error);
    return throwError(() => new Error(errorMessage));
  }
}