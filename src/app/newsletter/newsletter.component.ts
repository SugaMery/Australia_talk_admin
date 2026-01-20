import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NewsletterService, Newsletter, Subscriber, EmailTemplate } from './newsletter.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css'],
  standalone: false
})
export class NewsletterComponent implements OnInit, OnDestroy {
  newsletters: Newsletter[] = [];
  subscribers: Subscriber[] = [];
  emailTemplates: EmailTemplate[] = [];
  loading: boolean = false;
  selectedNewsletter: any = {};
  showNewsletterModal: boolean = false;
  isEditingNewsletter: boolean = false;
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private newsletterService: NewsletterService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadEmailTemplates();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load email templates
   */
  loadEmailTemplates(): void {
    this.newsletterService.getEmailTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.emailTemplates = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading email templates:', error);
        }
      });
  }

  /**
   * Load newsletters and subscribers data
   */
  loadData(): void {
    this.loadNewsletters();
    this.loadSubscribers();
  }

  /**
   * Load all newsletters with pagination
   */
  loadNewsletters(): void {
    this.loading = true;
    this.newsletterService.getNewsletters(this.page, this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.newsletters = response.data;
            if (response.pagination) {
              this.total = response.pagination.total;
              this.totalPages = response.pagination.pages;
              this.page = response.pagination.page;
            }
          }
          this.loading = false;
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Impossible de charger les newsletters';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          this.loading = false;
          console.error('Error loading newsletters:', error);
        }
      });
  }

  /**
   * Load all subscribers
   */
  loadSubscribers(): void {
    this.newsletterService.getSubscribers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.subscribers = data;
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Impossible de charger les abonnés';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          console.error('Error loading subscribers:', error);
        }
      });
  }

  /**
   * Export newsletters to PDF
   */
  exportPdf(): void {
    this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Export PDF en cours...' });
    this.newsletterService.exportNewslettersToPdf()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          this.downloadFile(blob, 'newsletters.pdf');
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'PDF téléchargé avec succès'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de l\'export PDF'
          });
          console.error('Error exporting PDF:', error);
        }
      });
  }

  /**
   * Export newsletters to Excel
   */
  exportExcel(): void {
    this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Export Excel en cours...' });
    this.newsletterService.exportNewslettersToExcel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          this.downloadFile(blob, 'newsletters.xlsx');
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Excel téléchargé avec succès'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de l\'export Excel'
          });
          console.error('Error exporting Excel:', error);
        }
      });
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Rafraîchissement',
      detail: 'Données en cours de mise à jour...'
    });
    this.loadData();
  }

  /**
   * Open newsletter modal for creating new newsletter
   */
  openNewsletterModal(): void {
    this.isEditingNewsletter = false;
    this.selectedNewsletter = {
      name: '',
      slug: '',
      subject: '',
      template_id: this.emailTemplates.length > 0 ? this.emailTemplates[0].id : 0,
      description: '',
      preview_text: ''
    };
    this.showNewsletterModal = true;
  }

  /**
   * Edit existing newsletter
   */
  editNewsletter(newsletter: Newsletter): void {
    this.isEditingNewsletter = true;
    this.selectedNewsletter = { ...newsletter };
    this.showNewsletterModal = true;
  }

  /**
   * Save newsletter (create or update)
   */
  saveNewsletter(): void {
    if (!this.selectedNewsletter.name?.trim() || !this.selectedNewsletter.subject?.trim() || !this.selectedNewsletter.template_id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez remplir tous les champs obligatoires (Nom, Sujet, Modèle)'
      });
      return;
    }

    if (this.isEditingNewsletter && this.selectedNewsletter.id) {
      this.newsletterService.updateNewsletter(
        this.selectedNewsletter.id,
        this.selectedNewsletter
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: response.message || 'Newsletter mise à jour avec succès'
              });
              this.showNewsletterModal = false;
              this.loadNewsletters();
            }
          },
          error: (error) => {
            const errorMsg = error?.error?.message || 'Erreur lors de la mise à jour';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMsg
            });
            console.error('Error updating newsletter:', error);
          }
        });
    } else {
      this.newsletterService.createNewsletter(this.selectedNewsletter)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: response.message || 'Newsletter créée avec succès'
              });
              this.showNewsletterModal = false;
              this.loadNewsletters();
            }
          },
          error: (error) => {
            const errorMsg = error?.error?.message || 'Erreur lors de la création';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMsg
            });
            console.error('Error creating newsletter:', error);
          }
        });
    }
  }

  /**
   * Delete newsletter
   */
  deleteNewsletter(id: string | number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette newsletter ?')) {
      this.newsletterService.deleteNewsletter(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Newsletter supprimée avec succès'
            });
            this.loadNewsletters();
          },
          error: (error) => {
            const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de la suppression';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMsg
            });
            console.error('Error deleting newsletter:', error);
          }
        });
    }
  }

  /**
   * Send newsletter to subscribers
   */
  sendNewsletter(id: string | number): void {
    if (confirm('Êtes-vous sûr de vouloir envoyer cette newsletter à tous les abonnés actifs ?')) {
      this.loading = true;
      this.newsletterService.sendNewsletter(id, false, [])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response.data) {
              const { sent, failed } = response.data;
              this.messageService.add({
                severity: sent > 0 ? 'success' : 'warn',
                summary: 'Succès',
                detail: `Newsletter envoyée à ${sent} abonné(s)${failed > 0 ? `, ${failed} échoué(s)` : ''}`
              });
              this.loadNewsletters();
            }
          },
          error: (error) => {
            this.loading = false;
            const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de l\'envoi';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMsg
            });
            console.error('Error sending newsletter:', error);
          }
        });
    }
  }

  /**
   * Delete subscriber
   */
  deleteSubscriber(id: string | number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
      this.newsletterService.deleteSubscriber(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Abonné supprimé avec succès'
            });
            this.loadSubscribers();
          },
          error: (error) => {
            const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de la suppression';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMsg
            });
            console.error('Error deleting subscriber:', error);
          }
        });
    }
  }

  /**
   * Close newsletter modal
   */
  closeNewsletterModal(): void {
    this.showNewsletterModal = false;
    this.selectedNewsletter = {};
  }

  /**
   * Download file helper
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
