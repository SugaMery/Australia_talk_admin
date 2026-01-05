import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LanguageService } from '../services/language.service';
import { PricingService } from '../services/pricing.service';

@Component({
  selector: 'app-localization-settings',
  templateUrl: './localization-settings.component.html',
  styleUrls: ['./localization-settings.component.css'],
  providers: [MessageService]
})
export class LocalizationSettingsComponent implements OnInit {
  languages: any[] = [];

  countries: any[] = [
    { id: 1, code: 'AU', name: 'Australia', timezone: 'Australia/Sydney', currency: 'AUD' },
    { id: 2, code: 'US', name: 'United States', timezone: 'America/New_York', currency: 'USD' },
    { id: 3, code: 'GB', name: 'United Kingdom', timezone: 'Europe/London', currency: 'GBP' },
    { id: 4, code: 'CA', name: 'Canada', timezone: 'America/Toronto', currency: 'CAD' },
    { id: 5, code: 'FR', name: 'France', timezone: 'Europe/Paris', currency: 'EUR' }
  ];

  contracts: any[] = [];

  selectedLanguage: any = {};
  selectedContract: any = {};
  showLanguageModal = false;
  showContractModal = false;
  isEditingLanguage = false;
  isEditingContract = false;
  isSaving = false;
  isLoading = false;

  constructor(
    private messageService: MessageService,
    private languageService: LanguageService,
    private pricingService: PricingService
  ) {}

  ngOnInit(): void {
    this.loadLocalizationSettings();
    this.loadContracts();
  }

  loadLocalizationSettings(): void {
    this.isLoading = true;
    this.languageService.getLanguages().subscribe({
      next: (data: any[]) => {
        // Map API response to component format
        this.languages = data.map(lang => ({
          id: lang.id,
          code: lang.code,
          name: lang.name,
          native_name: lang.name, // Using name as native_name since API doesn't provide it
          flag: `assets/img/flags/${lang.code.toLowerCase()}.svg`,
          active: lang.active === 1 || lang.active === true,
          default: lang.is_default === 1 || lang.is_default === true
        }));
        this.isLoading = false;
        console.log('Langues chargées depuis l\'API:', this.languages);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des langues:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des langues'
        });
      }
    });
  }

  // Get flag SVG path based on language code
  getFlagForCode(code: string): string {
    return `assets/img/flags/${code?.toLowerCase()}.svg`;
  }

  loadContracts(): void {
    this.isLoading = true;
    this.pricingService.getContracts().subscribe({
      next: (data: any[]) => {
        // Map API response, converting price strings to numbers if needed
        this.contracts = data.map(contract => ({
          ...contract,
          price: typeof contract.price === 'string' ? parseFloat(contract.price) : contract.price,
          flag: `assets/img/flags/${contract.code.toLowerCase()}.svg`
        }));
        this.isLoading = false;
        console.log('Contrats chargés depuis l\'API:', this.contracts);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des contrats:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des contrats'
        });
      }
    });
  }

  openAddLanguageModal(): void {
    this.selectedLanguage = {
      code: '',
      name: '',
      native_name: '',
      flag: '',
      active: false,
      default: false
    };
    this.isEditingLanguage = false;
    this.showLanguageModal = true;
  }

  openEditLanguageModal(language: any): void {
    this.selectedLanguage = { ...language };
    this.isEditingLanguage = true;
    this.showLanguageModal = true;
  }

  saveLanguage(): void {
    if (!this.selectedLanguage.code?.trim() || !this.selectedLanguage.name?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le code et le nom de la langue sont requis'
      });
      return;
    }

    const payload = {
      code: this.selectedLanguage.code,
      name: this.selectedLanguage.name,
      active: this.selectedLanguage.active ? 1 : 0,
      is_default: this.selectedLanguage.default ? 1 : 0
    };

    this.isSaving = true;

    if (this.isEditingLanguage) {
      this.languageService.updateLanguage(this.selectedLanguage.id, payload).subscribe({
        next: (response) => {
          const index = this.languages.findIndex(l => l.id === this.selectedLanguage.id);
          if (index !== -1) {
            this.languages[index] = {
              ...this.languages[index],
              ...this.selectedLanguage
            };
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Langue mise à jour avec succès'
          });
          this.isSaving = false;
          this.showLanguageModal = false;
          this.selectedLanguage = {};
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la langue:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour de la langue'
          });
          this.isSaving = false;
        }
      });
    } else {
      this.languageService.createLanguage(payload).subscribe({
        next: (response) => {
          const newLanguage = {
            id: response.id,
            code: response.code,
            name: response.name,
            native_name: response.name,
            flag: this.getFlagForCode(response.code),
            active: response.active === 1 || response.active === true,
            default: response.is_default === 1 || response.is_default === true
          };
          this.languages.push(newLanguage);
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Langue ajoutée avec succès'
          });
          this.isSaving = false;
          this.showLanguageModal = false;
          this.selectedLanguage = {};
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout de la langue:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de l\'ajout de la langue'
          });
          this.isSaving = false;
        }
      });
    }
  }

  toggleLanguageActive(language: any): void {
    this.languageService.toggleLanguageActive(language.id).subscribe({
      next: () => {
        language.active = !language.active;
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: `Langue ${language.active ? 'activée' : 'désactivée'}`
        });
      },
      error: (error) => {
        console.error('Erreur lors de la basculement du statut:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la basculement du statut'
        });
      }
    });
  }

  setDefaultLanguage(language: any): void {
    this.languageService.setDefaultLanguage(language.id).subscribe({
      next: () => {
        this.languages.forEach(l => l.default = false);
        language.default = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Langue par défaut définie à ${language.name}`
        });
      },
      error: (error) => {
        console.error('Erreur lors de la définition de la langue par défaut:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la définition de la langue par défaut'
        });
      }
    });
  }

  deleteLanguage(id: number): void {
    const language = this.languages.find(l => l.id === id);
    
    if (language?.default) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Vous ne pouvez pas supprimer la langue par défaut'
      });
      return;
    }

    this.languageService.deleteLanguage(id).subscribe({
      next: () => {
        const index = this.languages.findIndex(l => l.id === id);
        if (index !== -1) {
          this.languages.splice(index, 1);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Langue supprimée avec succès'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la langue:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression de la langue'
        });
      }
    });
  }

  closeLanguageModal(): void {
    this.showLanguageModal = false;
    this.selectedLanguage = {};
  }

  openAddContractModal(): void {
    this.selectedContract = {
      type: 'Australia Talk',
      country: '',
      code: '',
      currency: '€',
      price: 0,
      status: 'Actif'
    };
    this.isEditingContract = false;
    this.showContractModal = true;
  }

  openEditContractModal(contract: any): void {
    this.selectedContract = { ...contract };
    this.isEditingContract = true;
    this.showContractModal = true;
  }

  saveContract(): void {
    if (!this.selectedContract.type?.trim() || !this.selectedContract.country?.trim() || !this.selectedContract.code?.trim() || !this.selectedContract.price) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Tous les champs sont requis'
      });
      return;
    }

    this.isSaving = true;
    const payload = {
      type: this.selectedContract.type,
      country: this.selectedContract.country,
      code: this.selectedContract.code.toUpperCase(),
      currency: this.selectedContract.currency,
      price: this.selectedContract.price.toString(),
      status: this.selectedContract.status
    };

    if (this.isEditingContract) {
      this.pricingService.updateContract(this.selectedContract.id, payload).subscribe({
        next: (response) => {
          const index = this.contracts.findIndex(c => c.id === this.selectedContract.id);
          if (index !== -1) {
            this.contracts[index] = {
              ...this.contracts[index],
              ...this.selectedContract
            };
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Contrat mis à jour avec succès'
          });
          this.isSaving = false;
          this.showContractModal = false;
          this.selectedContract = {};
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du contrat:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour du contrat'
          });
          this.isSaving = false;
        }
      });
    } else {
      this.pricingService.createContract(payload).subscribe({
        next: (response) => {
          const newContract = {
            id: response.id,
            type: response.type,
            country: response.country,
            code: response.code,
            currency: response.currency,
            price: typeof response.price === 'string' ? parseFloat(response.price) : response.price,
            status: response.status
          };
          this.contracts.push(newContract);
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Contrat ajouté avec succès'
          });
          this.isSaving = false;
          this.showContractModal = false;
          this.selectedContract = {};
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du contrat:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de l\'ajout du contrat'
          });
          this.isSaving = false;
        }
      });
    }
  }

  deleteContract(id: number): void {
    this.pricingService.deleteContract(id).subscribe({
      next: () => {
        const index = this.contracts.findIndex(c => c.id === id);
        if (index !== -1) {
          this.contracts.splice(index, 1);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Contrat supprimé avec succès'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du contrat:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression du contrat'
        });
      }
    });
  }

  closeContractModal(): void {
    this.showContractModal = false;
    this.selectedContract = {};
  }

  saveAllSettings(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Paramètres de localisation sauvegardés'
      });
      this.isSaving = false;
    }, 1500);
  }

  getActiveLanguagesCount(): number {
    return this.languages.filter(l => l.active).length;
  }

  getDefaultLanguage(): any {
    return this.languages.find(l => l.default);
  }
}
