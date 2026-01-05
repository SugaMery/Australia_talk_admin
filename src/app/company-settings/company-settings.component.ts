import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CompanyInfoService } from '../services/company-info.service';
import { CompanyLinksService } from '../services/company-links.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-company-settings',
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.css'],
  providers: [MessageService]
})
export class CompanySettingsComponent implements OnInit {
  companyLinks: any[] = [];

  companyInfo = {
    company_name: 'Australia Talk',
    company_description: 'Plateforme de discussion australienne',
    company_website: 'https://www.australia-talk.com',
    company_email: 'info@australia-talk.com',
    company_phone: '+61 2 XXXX XXXX',
    company_address: 'Sydney, NSW 2000, Australia',
    company_logo_url: '/assets/img/logoausturalia1.png',
    facebook_url: 'https://facebook.com/australiatalk',
    twitter_url: 'https://twitter.com/australiatalk',
    instagram_url: 'https://instagram.com/australiatalk',
    linkedin_url: 'https://linkedin.com/company/australiatalk'
  };

  showLinkModal = false;
  showSeoModal = false;
  selectedLink: any = {};
  selectedLinkForSeo: any = {};
  isEditingLink = false;
  isSaving = false;
  isLoading = false;

  // Languages for SEO
  languages: any[] = [];
  selectedLanguageForSeo: any = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  paginatedLinks: any[] = [];

  constructor(
    private messageService: MessageService,
    private companyInfoService: CompanyInfoService,
    private companyLinksService: CompanyLinksService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadLanguages();
    this.loadCompanySettings();
    this.loadCompanyLinks();
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

  loadCompanySettings(): void {
    this.isLoading = true;
    this.companyInfoService.getCompanyInfo().subscribe({
      next: (data) => {
        this.companyInfo = data;
        this.isLoading = false;
        console.log('Informations de l\'entreprise chargées:', this.companyInfo);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des informations de l\'entreprise:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des informations de l\'entreprise'
        });
      }
    });
  }

  loadCompanyLinks(): void {
    this.isLoading = true;
    this.companyLinksService.getCompanyLinks().subscribe({
      next: (data: any[]) => {
        // Map API response, converting active to boolean if needed
        this.companyLinks = data.map(link => ({
          ...link,
          active: link.active === 1 || link.active === true
        }));
        this.updatePagination();
        this.isLoading = false;
        console.log('Liens de l\'entreprise chargés:', this.companyLinks);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des liens de l\'entreprise:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des liens de l\'entreprise'
        });
      }
    });
  }

  saveCompanyInfo(): void {
    if (!this.companyInfo.company_name?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le nom de l\'entreprise est requis'
      });
      return;
    }

    this.isSaving = true;
    this.companyInfoService.updateCompanyInfo(this.companyInfo).subscribe({
      next: (response) => {
        this.companyInfo = response;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Informations de l\'entreprise sauvegardées'
        });
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde des informations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la sauvegarde des informations'
        });
        this.isSaving = false;
      }
    });
  }

  openAddLinkModal(): void {
    this.selectedLink = {
      name: '',
      url: '',
      icon: '',
      active: true
    };
    this.isEditingLink = false;
    this.showLinkModal = true;
  }

  openEditLinkModal(link: any): void {
    this.selectedLink = { ...link };
    this.isEditingLink = true;
    this.showLinkModal = true;
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
    
    console.log('Saving link with payload:', payload);

    if (this.isEditingLink) {
      this.companyLinksService.updateLink(this.selectedLink.id, payload).subscribe({
        next: (response) => {
          // Refresh the list of links after update
          this.loadCompanyLinks();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Lien mis à jour'
          });
          this.isSaving = false;
          this.showLinkModal = false;
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
      this.companyLinksService.createLink(payload).subscribe({
        next: (response) => {
          const newLink = {
            id: response.id,
            name: response.name,
            url: response.url,
            icon: response.icon,
            path: response.path,
            active: response.active === 1 || response.active === true,
            is_public: response.is_public === 1 || response.is_public === true,
            requires_auth: response.requires_auth === 1 || response.requires_auth === true,
            order: response.order,
            seo_title: response.seo_title,
            seo_description: response.seo_description,
            seo_keywords: response.seo_keywords
          };
          this.companyLinks.push(newLink);
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Lien ajouté'
          });
          this.isSaving = false;
          this.showLinkModal = false;
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
    this.companyLinksService.deleteLink(id).subscribe({
      next: () => {
        const index = this.companyLinks.findIndex(l => l.id === id);
        if (index !== -1) {
          this.companyLinks.splice(index, 1);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Lien supprimé'
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

  closeLinkModal(): void {
    this.showLinkModal = false;
    this.selectedLink = {};
  }

  // Pagination Methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.companyLinks.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedLinks();
  }

  updatePaginatedLinks(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLinks = this.companyLinks.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedLinks();
    }
  }

  onPageClick(page: number, event: any): void {
    event.preventDefault();
    this.goToPage(page);
  }

  getDisplayPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        pages.push('...');
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  onLanguageChange(): void {
    if (!this.selectedLinkForSeo.id || !this.selectedLanguageForSeo) return;
    
    // Load SEO metadata for the selected language using language-specific endpoint
    this.companyLinksService.getCompanyLinksByLanguage(this.selectedLanguageForSeo).subscribe({
      next: (links) => {
        // Find the current link in the language-specific response
        const linkData = links.find(l => l.id === this.selectedLinkForSeo.id);
        if (linkData) {
          // Update SEO fields with language-specific data
          this.selectedLinkForSeo.seo_title = linkData.seo_title || '';
          this.selectedLinkForSeo.seo_description = linkData.seo_description || '';
          this.selectedLinkForSeo.seo_keywords = linkData.seo_keywords || '';
          console.log('SEO metadata loaded for language:', this.selectedLanguageForSeo, linkData);
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

  saveSeoMetadata(): void {
    if (!this.selectedLinkForSeo.id) return;

    this.isSaving = true;
    // Include all required fields using the same helper
    const payload = this.buildLinkPayload(this.selectedLinkForSeo);
    payload['language_id'] = this.selectedLanguageForSeo;
    
    console.log('Saving SEO metadata with payload:', payload);

    this.companyLinksService.updateLink(this.selectedLinkForSeo.id, payload).subscribe({
      next: () => {
        const index = this.companyLinks.findIndex(l => l.id === this.selectedLinkForSeo.id);
        if (index !== -1) {
          this.companyLinks[index] = {
            ...this.companyLinks[index],
            ...this.selectedLinkForSeo
          };
          this.updatePaginatedLinks();
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
