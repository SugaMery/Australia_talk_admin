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
import { EditArticleComponent } from './edit-article/edit-article.component';
import { UsersComponent } from './users/users.component';
import { ClientsComponent } from './clients/clients.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { LogUsersComponent } from './log-users/log-users.component';
import { ParametresGenerauxComponent } from './parametres-generaux/parametres-generaux.component';
import { SystemSettingsComponent } from './system-settings/system-settings.component';
import { SystemLinkComponent } from './system-link/system-link.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { LocalizationSettingsComponent } from './localization-settings/localization-settings.component';
import { EmailTemplatesComponent } from './email-templates/email-templates.component';
import { NewsletterComponent } from './newsletter/newsletter.component';
import { CreateNewsletterComponent } from './create-newsletter/create-newsletter.component';

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
  { path: 'edit-article/:id', component: EditArticleComponent },
  { path: 'utilisateurs', component: UsersComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'roles-permissions', component: RolesPermissionsComponent },
  { path: 'journaux-utilisateur', component: LogUsersComponent },
  { path: 'parametres-generaux', component: ParametresGenerauxComponent },
  { path: 'email-settings', component: SystemSettingsComponent },
  { path: 'system-link', component: SystemLinkComponent },
  { path: 'company-settings', component: CompanySettingsComponent },
  { path: 'localization-settings', component: LocalizationSettingsComponent },
  { path: 'email-templates', component: EmailTemplatesComponent },
  { path: 'newsletter', component: NewsletterComponent },
  { path: 'create-newsletter', component: CreateNewsletterComponent },
  { path: 'edit-newsletter/:id', component: CreateNewsletterComponent },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
