import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { PreloaderComponent } from './preloader/preloader.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CategoryComponent } from './category/category.component';
import { FilePreviewPipe } from './pipes/file-preview.pipe';
import { MediasComponent } from './medias/medias.component';
import { ArtisansComponent } from './artisans/artisans.component';
import { TagsComponent } from './tags/tags.component';
import { ArticlesComponent } from './articles/articles.component';
import { AddArticleComponent } from './add-article/add-article.component';
import { EditorModule } from 'primeng/editor';
import { MultiSelectModule } from 'primeng/multiselect';
import { EditArticleComponent } from './edit-article/edit-article.component';
import { DropdownModule } from 'primeng/dropdown';
import { UsersComponent } from './users/users.component';
import { PasswordModule } from 'primeng/password';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ClientsComponent } from './clients/clients.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    PreloaderComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    SidebarComponent,
    CategoryComponent,
    FilePreviewPipe,
    MediasComponent,
    ArtisansComponent,
    TagsComponent,
    ArticlesComponent,
    AddArticleComponent,
    EditArticleComponent,
    UsersComponent,
    ClientsComponent,
    RolesPermissionsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ToastModule,
    EditorModule,
    MultiSelectModule,
    DropdownModule,
    PasswordModule,
    AutoCompleteModule,
    BadgeModule,
    TagModule
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
