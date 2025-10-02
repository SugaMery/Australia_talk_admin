import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Tag } from './tag.service';
import { Category } from './category.service';
import { Media } from './media.service';

export interface Article {
  id: number;
  title: string;
  content?: string;
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
}

export interface ArticleRelated {
  article: Article;
  tags: Tag[];
  categories: Category[];
  media: Media[];
}

export interface ArticleWithRelated extends Article {
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

  getAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  create(article: { title: string; content?: string; type: string; author_id?: number; isfree?: number }): Observable<Article> {
    // Get author_id from localStorage if not provided
    let userId = localStorage.getItem('user_id');
    let author_id = article.author_id;
    if (!author_id && userId) {
      author_id = Number(userId);
    }
    const payload = { ...article, author_id };
    return this.http.post<Article>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }


    update(id: number,article: { title: string; content?: string; type: string; author_id?: number; isfree?: number }): Observable<Article> {
    // Get author_id from localStorage if not provided
    let userId = localStorage.getItem('user_id');
    let author_id = article.author_id;
    if (!author_id && userId) {
      author_id = Number(userId);
    }
    const payload = { ...article, author_id };
    return this.http.post<Article>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
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
  getRelated(id: number): Observable<ArticleRelated> {
    return this.http.get<ArticleRelated>(`${this.apiUrl}/${id}/related`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getAllWithRelated(): Observable<ArticleWithRelated[]> {
    return this.http.get<ArticleWithRelated[]>(`${this.apiUrl}/with-related`, { headers: this.getHeaders() }).pipe(
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