import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CategoryComponent } from './category/category.component';
import { MediasComponent } from './medias/medias.component';
import { ArtisansComponent } from './artisans/artisans.component';
import { TagService } from './services/tag.service';
import { TagsComponent } from './tags/tags.component';
import { AddArticleComponent } from './add-article/add-article.component';
import { ArticlesComponent } from './articles/articles.component';

// AuthGuard implementation
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(): boolean {
    // Vérification SSR : window existe ?
    if (typeof window !== 'undefined') {
      const token =
        window.localStorage.getItem('token') ||
        window.sessionStorage.getItem('token');
      if (token) {
        return true;
      }
    }
    // Refus d'accès, redirection vers la page de connexion
    this.router.navigate(['/connexion']);
    return false;
  }
}

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'connexion', component: LoginComponent },
  { path: 'categories', component: CategoryComponent },
  { path: 'medias', component: MediasComponent },
  { path: 'artisans', component: ArtisansComponent },
  { path: 'tags', component: TagsComponent },
  { path: 'create-article', component: AddArticleComponent },
  { path: 'articles', component: ArticlesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
