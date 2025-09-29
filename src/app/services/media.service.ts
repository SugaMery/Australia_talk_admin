import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Media {
  id: number;
  filename?: string;
  extension?: string;
  size?: number;
  path?: string;
  file_type?: string;
  order_display?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}/medias`;
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

  getAll(): Observable<Media[]> {
    return this.http.get<Media[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<Media> {
    return this.http.get<Media>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  create(media: { filename?: string; extension?: string; size?: number; path?: string; file_type?: string; order_display?: number }): Observable<Media> {
    return this.http.post<Media>(this.apiUrl, media, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, media: { filename?: string; extension?: string; size?: number; path?: string; file_type?: string; order_display?: number }): Observable<Media> {
    return this.http.put<Media>(`${this.apiUrl}/${id}`, media, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  upload(formData: FormData): Observable<Media> {
    // No Content-Type header for FormData, browser sets it automatically
    let headers = new HttpHeaders();
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return this.http.post<Media>(`${this.apiUrl}/upload`, formData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  restore(id: number): Observable<{ message: string; media: Media }> {
    return this.http.post<{ message: string; media: Media }>(
      `${this.apiUrl}/${id}/restore`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
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
        errorMessage = 'Media non trouvé';
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