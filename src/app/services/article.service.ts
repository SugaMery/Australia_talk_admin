import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Tag } from './tag.service';
import { Category } from './category.service';
import { Media } from './media.service';

export interface ArticleTranslation {
  id?: number;
  article_id: number;
  language_id: number;
  title: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Article {
  id: number;
  type: string;
  author_id?: number;
  isfree?: boolean;
  validation_status?: string;
  status?: string;
  views_count?: number;
  likes_count?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  language_id?: number;
  translation?: ArticleTranslation;
}

export interface ArticleWithContent extends Article {
  title: string;
  content?: string;
}

export interface ArticleRelated {
  article: Article;
  tags: Tag[];
  categories: Category[];
  media: Media[];
}

export interface ArticleWithRelated extends ArticleWithContent {
  tags: Tag[];
  categories: Category[];
  media: Media[];
}

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = `${environment.apiUrl}/articles`;
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
   * Extract title and content from translation object
   * Falls back to French (language_id = 1) if translation not found
   */
  private extractTranslationContent(article: Article): ArticleWithContent {
    let title = '';
    let content = '';

    if (article.translation) {
      title = article.translation.title || '';
      content = article.translation.content || '';
    }

    return {
      ...article,
      title,
      content,
    };
  }

  getAll(languageId?: number): Observable<ArticleWithContent[]> {
    const lang = languageId || this.getLanguageId();
    return this.http.get<Article[]>(this.apiUrl, { 
      headers: this.getHeaders(),
      params: { language_id: lang.toString() }
    }).pipe(
      map(articles => articles.map(article => this.extractTranslationContent(article))),
      catchError(this.handleError)
    );
  }

  getById(id: number, languageId?: number): Observable<ArticleWithContent> {
    const lang = languageId || this.getLanguageId();
    return this.http.get<Article>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders(),
      params: { language_id: lang.toString() }
    }).pipe(
      map(article => this.extractTranslationContent(article)),
      catchError(this.handleError)
    );
  }

  create(article: { 
    title: string; 
    content?: string; 
    type: string; 
    author_id?: number; 
    isfree?: number;
    language_id?: number;
  }): Observable<ArticleWithContent> {
    // Get author_id from localStorage if not provided
    let userId = localStorage.getItem('user_id');
    let author_id = article.author_id;
    if (!author_id && userId) {
      author_id = Number(userId);
    }
    
    const languageId = article.language_id || this.getLanguageId();
    
    const payload = { 
      ...article, 
      author_id,
      language_id: languageId,
    };
    
    return this.http.post<Article>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
      map(response => this.extractTranslationContent(response)),
      catchError(this.handleError)
    );
  }


  update(
    id: number,
    article: { 
      title: string; 
      content?: string; 
      type: string; 
      author_id?: number; 
      isfree?: number;
      language_id?: number;
    }
  ): Observable<ArticleWithContent> {
    // Get author_id from localStorage if not provided
    let userId = localStorage.getItem('user_id');
    let author_id = article.author_id;
    if (!author_id && userId) {
      author_id = Number(userId);
    }

    const languageId = article.language_id || this.getLanguageId();

    const payload = {
      ...article,
      author_id,
      language_id: languageId,
      validation_status: 'pending',
      status: 'pending',
      views_count: 0,
      likes_count: 0,
    };
    console.log('Update payload:', payload);
    return this.http.put<Article>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }).pipe(
      map(response => this.extractTranslationContent(response)),
      catchError(this.handleError)
    );
  }




  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get article with related tags, categories, and media.
   * Matches backend route: GET /articles/:id/related
   */
  getRelated(id: number, languageId?: number): Observable<ArticleRelated> {
    const lang = languageId || this.getLanguageId();
    return this.http.get<ArticleRelated>(`${this.apiUrl}/${id}/related`, { 
      headers: this.getHeaders(),
      params: { language_id: lang.toString() }
    }).pipe(
      map(response => ({
        ...response,
        article: this.extractTranslationContent(response.article)
      })),
      catchError(this.handleError)
    );
  }

  getAllWithRelated(languageId?: number): Observable<ArticleWithRelated[]> {
    const lang = languageId || this.getLanguageId();
    return this.http.get<ArticleWithRelated[]>(`${this.apiUrl}/with-related`, { 
      headers: this.getHeaders(),
      params: { language_id: lang.toString() }
    }).pipe(
      map(articles => articles.map(article => this.extractTranslationContent(article) as ArticleWithRelated)),
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
        errorMessage = 'Article non trouvé';
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