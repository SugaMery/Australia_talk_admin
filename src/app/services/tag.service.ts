import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = `${environment.apiUrl}/tags`;
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

  getAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  create(tag: { name: string; active: boolean }): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, tag, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, tag: { name: string; active: boolean }): Observable<Tag> {
    console.log("Updating tag with ID:", id, "and data:", tag);
    return this.http.put<Tag>(`${this.apiUrl}/${id}`, tag, { headers: this.getHeaders() }).pipe(
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
        errorMessage = 'Tag non trouvé';
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