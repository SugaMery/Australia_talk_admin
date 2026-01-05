import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SystemLinksService } from '../services/system-links.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-system-link',
  templateUrl: './system-link.component.html',
  styleUrls: ['./system-link.component.css'],
  providers: [MessageService]
})
export class SystemLinkComponent implements OnInit {
  systemLinks: any[] = [];

  showModal = false;
  showSeoModal = false;
  selectedLink: any = {};
  selectedLinkForSeo: any = {};
  isEditing = false;
  isSaving = false;
  isLoading = false;

  // Languages for SEO
  languages: any[] = [];
  selectedLanguageForSeo: any = null;

  constructor(
    private messageService: MessageService,
    private systemLinksService: SystemLinksService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadLanguages();
    this.loadSystemLinks();
  }

  loadLanguages(): void {
    this.languageService.getLanguages().subscribe({
      next: (response) => {
        this.languages = response.map((lang: any) => ({
          ...lang,
          isDefault: lang.is_default === 1 || lang.is_default === true,
          active: lang.active === 1 || lang.active === true
        }));
        // Set default language as selected
        const defaultLang = this.languages.find(l => l.isDefault);
        if (defaultLang) {
          this.selectedLanguageForSeo = defaultLang.id;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des langues:', error);
      }
    });
  }

  loadSystemLinks(): void {
    this.isLoading = true;
    this.systemLinksService.getCompanyLinks().subscribe({
      next: (links) => {
        this.systemLinks = links.map(link => ({
          ...link,
          active: link.active === 1 || link.active === true
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des liens de l\'entreprise'
        });
      }
    });
  }

  openAddModal(): void {
    this.selectedLink = {
      name: '',
      url: '',
      icon: '',
      active: true,
      order: this.systemLinks.length + 1
    };
    this.isEditing = false;
    this.showModal = true;
  }

  openEditModal(link: any): void {
    this.selectedLink = { ...link };
    this.isEditing = true;
    this.showModal = true;
  }

  saveLink(): void {
    if (!this.selectedLink.name?.trim() || !this.selectedLink.url?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le nom et l\'URL sont requis'
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildLinkPayload(this.selectedLink);

    if (this.isEditing) {
      this.systemLinksService.updateLink(this.selectedLink.id, payload).subscribe({
        next: () => {
          this.loadSystemLinks();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Lien mis à jour avec succès'
          });
          this.isSaving = false;
          this.showModal = false;
          this.selectedLink = {};
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour du lien:', error);
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la mise à jour du lien';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          this.isSaving = false;
        }
      });
    } else {
      this.systemLinksService.createLink(payload).subscribe({
        next: (response) => {
          this.loadSystemLinks();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Lien ajouté avec succès'
          });
          this.isSaving = false;
          this.showModal = false;
          this.selectedLink = {};
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'ajout du lien:', error);
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de l\'ajout du lien';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          this.isSaving = false;
        }
      });
    }
  }

  deleteLink(id: number): void {
    this.systemLinksService.deleteLink(id).subscribe({
      next: () => {
        this.loadSystemLinks();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Lien supprimé avec succès'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du lien:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression du lien'
        });
      }
    });
  }

  toggleActive(link: any): void {
    const updatedStatus = !link.active;
    const payload = this.buildLinkPayload({
      ...link,
      active: updatedStatus
    });

    this.systemLinksService.updateLink(link.id, payload).subscribe({
      next: () => {
        link.active = updatedStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Lien ${updatedStatus ? 'activé' : 'désactivé'}`
        });
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut du lien:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la mise à jour du statut du lien'
        });
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedLink = {};
  }

  openSeoModal(link: any): void {
    this.selectedLinkForSeo = { ...link };
    // Set language to default if not already set
    if (!this.selectedLanguageForSeo && this.languages.length > 0) {
      const defaultLang = this.languages.find(l => l.isDefault);
      this.selectedLanguageForSeo = defaultLang ? defaultLang.id : this.languages[0].id;
    }
    // Load SEO data for the selected language
    this.onLanguageChange();
    this.showSeoModal = true;
  }

  closeSeoModal(): void {
    this.showSeoModal = false;
    this.selectedLinkForSeo = {};
  }

  onLanguageChange(): void {
    if (!this.selectedLinkForSeo.id || !this.selectedLanguageForSeo) return;
    
    // Load SEO metadata for the selected language using language-specific endpoint
    this.systemLinksService.getCompanyLinksByLanguage?.(this.selectedLanguageForSeo).subscribe?.({
      next: (links) => {
        // Find the current link in the language-specific response
        const linkData = links.find(l => l.id === this.selectedLinkForSeo.id);
        if (linkData) {
          // Update SEO fields with language-specific data
          this.selectedLinkForSeo.seo_title = linkData.seo_title || '';
          this.selectedLinkForSeo.seo_description = linkData.seo_description || '';
          this.selectedLinkForSeo.seo_keywords = linkData.seo_keywords || '';
        } else {
          // If link not found for this language, reset SEO fields
          this.selectedLinkForSeo.seo_title = '';
          this.selectedLinkForSeo.seo_description = '';
          this.selectedLinkForSeo.seo_keywords = '';
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des métadonnées SEO:', error);
        // Reset fields if load fails
        this.selectedLinkForSeo.seo_title = '';
        this.selectedLinkForSeo.seo_description = '';
        this.selectedLinkForSeo.seo_keywords = '';
      }
    });
  }

  private buildLinkPayload(link: any): any {
    return {
      name: (link.name || '').trim(),
      url: (link.url || '').trim(),
      icon: link.icon || null,
      path: link.path || null,
      active: link.active ? 1 : 0,
      is_public: link.is_public ? 1 : 0,
      requires_auth: link.requires_auth ? 1 : 0,
      order: typeof link.order === 'number' ? link.order : 0,
      seo_title: link.seo_title || null,
      seo_description: link.seo_description || null,
      seo_keywords: link.seo_keywords || null
    };
  }

  saveSeoMetadata(): void {
    if (!this.selectedLinkForSeo.id) return;

    this.isSaving = true;
    // Include all required fields using the same helper
    const payload = this.buildLinkPayload(this.selectedLinkForSeo);
    payload['language_id'] = this.selectedLanguageForSeo;
    
    console.log('Saving SEO metadata with payload:', payload);

    this.systemLinksService.updateLink(this.selectedLinkForSeo.id, payload).subscribe({
      next: () => {
        const index = this.systemLinks.findIndex(l => l.id === this.selectedLinkForSeo.id);
        if (index !== -1) {
          this.systemLinks[index] = {
            ...this.systemLinks[index],
            ...this.selectedLinkForSeo
          };
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Métadonnées SEO mises à jour'
        });
        this.isSaving = false;
        this.closeSeoModal();
      },
      error: (error: any) => {
        console.error('Erreur lors de la mise à jour SEO:', error);
        const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la mise à jour des métadonnées SEO';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: errorMsg
        });
        this.isSaving = false;
      }
    });
  }
}
