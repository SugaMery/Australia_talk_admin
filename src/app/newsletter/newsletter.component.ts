import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
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
  
  // Recipients modal
  showRecipientsModal: boolean = false;
  newsletterRecipients: any[] = [];
  recipientsLoading: boolean = false;
  recipientsPage: number = 1;
  recipientsLimit: number = 20;
  recipientsTotal: number = 0;
  recipientsTotalPages: number = 0;
  recipientsStats: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    private newsletterService: NewsletterService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
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
   * Load all subscribers using the available recipients endpoint
   */
  loadSubscribers(): void {
    this.newsletterService.getAvailableRecipients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          // Handle the API response format - getAvailableRecipients returns any[]
          const subscribers = Array.isArray(data) ? data : [];
          this.subscribers = subscribers.map((sub: any) => ({
            id: sub.id,
            email: sub.email,
            first_name: sub.first_name || sub.user_first_name || '',
            last_name: sub.last_name || sub.user_last_name || '',
            display_name: sub.display_name || `${sub.first_name || sub.user_first_name || ''} ${sub.last_name || sub.user_last_name || ''}`.trim() || sub.email,
            created_at: sub.created_at,
            subscribed_at: sub.created_at,
            status: 'active'
          }));

          if (this.subscribers.length === 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Information',
              detail: 'Aucun abonné actif trouvé'
            });
          }
        },
        error: (error) => {
          const errorMsg = error?.error?.message || error?.message || 'Impossible de charger les abonnés depuis l\'API';
          this.messageService.add({
            severity: 'warn',
            summary: 'Attention',
            detail: errorMsg
          });
          console.error('Error loading available recipients:', error);

          // Fallback to old subscribers endpoint
          this.loadSubscribersFallback();
        }
      });
  }

  /**
   * Fallback: Load subscribers from old endpoint
   */
  private loadSubscribersFallback(): void {
    this.newsletterService.getSubscribers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.subscribers = data.filter(
            sub => sub.status === 'active'
          ) as Subscriber[];
        },
        error: (error) => {
          console.error('Error loading subscribers from fallback:', error);
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
   * Edit existing newsletter - navigate to edit page with newsletter ID
   */
  editNewsletter(newsletter: Newsletter): void {
    this.router.navigate(['/edit-newsletter', newsletter.id]);
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
    this.confirmationService.confirm({
      message: 'Cette newsletter sera supprimée définitivement. Cette action est irréversible.<br><br><strong>Êtes-vous sûr de vouloir continuer ?</strong>',
      header: '🗑️ Supprimer la newsletter',
      icon: 'pi pi-trash',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-lg',
      rejectButtonStyleClass: 'p-button-secondary p-button-lg',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      accept: () => {
        this.newsletterService.deleteNewsletter(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: '✅ Newsletter supprimée',
                detail: 'La newsletter a été supprimée avec succès',
                life: 5000
              });
              this.loadNewsletters();
            },
            error: (error) => {
              const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de la suppression';
              this.messageService.add({
                severity: 'error',
                summary: '❌ Erreur de suppression',
                detail: errorMsg,
                life: 8000
              });
              console.error('Error deleting newsletter:', error);
            }
          });
      }
    });
  }

  /**
   * Send newsletter to subscribers
   */
  sendNewsletter(id: string | number): void {
    this.confirmationService.confirm({
      message: `Vous êtes sur le point d'envoyer cette newsletter à tous les abonnés actifs. Cette action est irréversible et la newsletter sera marquée comme "envoyée".<br><br><strong>Êtes-vous sûr de vouloir continuer ?</strong>`,
      header: '📧 Confirmation d\'envoi de newsletter',
      icon: 'pi pi-envelope',
      acceptLabel: 'Oui, envoyer maintenant',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-success p-button-lg',
      rejectButtonStyleClass: 'p-button-secondary p-button-lg',
      acceptIcon: 'pi pi-send',
      rejectIcon: 'pi pi-times',
      accept: () => {
        this.loading = true;
        this.messageService.add({
          severity: 'info',
          summary: '🚀 Envoi en cours',
          detail: 'La newsletter est en cours d\'envoi aux abonnés...',
          life: 5000
        });

        this.newsletterService.sendNewsletter(id, false, [])
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              if (response.data) {
                const { sent, failed } = response.data;
                if (sent > 0 && failed === 0) {
                  this.messageService.add({
                    severity: 'success',
                    summary: '✅ Newsletter envoyée avec succès',
                    detail: `La newsletter a été envoyée à ${sent} abonné(s)`,
                    life: 8000
                  });
                } else if (sent > 0 && failed > 0) {
                  this.messageService.add({
                    severity: 'warn',
                    summary: '⚠️ Envoi partiellement réussi',
                    detail: `Newsletter envoyée à ${sent} abonné(s), ${failed} échec(s)`,
                    life: 10000
                  });
                } else {
                  this.messageService.add({
                    severity: 'error',
                    summary: '❌ Échec de l\'envoi',
                    detail: 'Aucun email n\'a pu être envoyé',
                    life: 8000
                  });
                }
                this.loadNewsletters();
              }
            },
            error: (error) => {
              this.loading = false;
              const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de l\'envoi de la newsletter';
              this.messageService.add({
                severity: 'error',
                summary: '❌ Erreur d\'envoi',
                detail: errorMsg,
                life: 10000
              });
              console.error('Error sending newsletter:', error);
            }
          });
      }
    });
  }

  /**
   * Duplicate newsletter
   */
  duplicateNewsletter(newsletter: Newsletter): void {
    this.confirmationService.confirm({
      message: `Vous allez créer une copie de la newsletter "${newsletter.name}". La nouvelle newsletter aura le même contenu et paramètres.<br><br><strong>Continuer ?</strong>`,
      header: '📋 Dupliquer la newsletter',
      icon: 'pi pi-copy',
      acceptLabel: 'Dupliquer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-primary p-button-lg',
      rejectButtonStyleClass: 'p-button-secondary p-button-lg',
      acceptIcon: 'pi pi-copy',
      rejectIcon: 'pi pi-times',
      accept: () => {
        this.loading = true;
        this.messageService.add({
          severity: 'info',
          summary: '🔄 Duplication en cours',
          detail: 'Création de la copie de la newsletter...',
          life: 3000
        });

        this.newsletterService.duplicateNewsletter(newsletter.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.loading = false;
              if (response.success) {
                this.messageService.add({
                  severity: 'success',
                  summary: '✅ Newsletter dupliquée',
                  detail: `La newsletter "${newsletter.name}" a été dupliquée avec succès`,
                  life: 6000
                });
                this.loadNewsletters();
              }
            },
            error: (error) => {
              this.loading = false;
              const errorMsg = error?.error?.message || 'Erreur lors de la duplication';
              this.messageService.add({
                severity: 'error',
                summary: '❌ Erreur de duplication',
                detail: errorMsg,
                life: 8000
              });
              console.error('Error duplicating newsletter:', error);
            }
          });
      }
    });
  }

  /**
   * Delete subscriber
   */
  deleteSubscriber(id: string | number): void {
    this.confirmationService.confirm({
      message: 'Cet abonné sera supprimé de la liste. Il ne recevra plus de newsletters.<br><br><strong>Cette action est irréversible. Continuer ?</strong>',
      header: '👤 Supprimer l\'abonné',
      icon: 'pi pi-user-minus',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-lg',
      rejectButtonStyleClass: 'p-button-secondary p-button-lg',
      acceptIcon: 'pi pi-user-minus',
      rejectIcon: 'pi pi-times',
      accept: () => {
        this.newsletterService.deleteSubscriber(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: '✅ Abonné supprimé',
                detail: 'L\'abonné a été supprimé avec succès',
                life: 5000
              });
              this.loadSubscribers();
            },
            error: (error) => {
              const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de la suppression';
              this.messageService.add({
                severity: 'error',
                summary: '❌ Erreur de suppression',
                detail: errorMsg,
                life: 8000
              });
              console.error('Error deleting subscriber:', error);
            }
          });
      }
    });
  }

  /**
   * Close newsletter modal
   */
  closeNewsletterModal(): void {
    this.showNewsletterModal = false;
    this.selectedNewsletter = {};
  }

  /**
   * Open recipients modal to view delivery status
   */
  openRecipientsModal(newsletter: Newsletter): void {
    this.selectedNewsletter = newsletter;
    this.recipientsPage = 1;
    this.newsletterRecipients = [];
    this.showRecipientsModal = true;
    this.loadRecipients();
  }

  /**
   * Load recipients for a newsletter
   */
  loadRecipients(): void {
    if (!this.selectedNewsletter.id) {
      return;
    }

    this.recipientsLoading = true;
    this.newsletterService.getNewsletterRecipients(this.selectedNewsletter.id, this.recipientsPage, this.recipientsLimit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            this.newsletterRecipients = response.data;
            if (response.pagination) {
              this.recipientsTotal = response.pagination.total;
              this.recipientsTotalPages = response.pagination.pages;
            }
            if (response.stats) {
              this.recipientsStats = response.stats;
            }
          }
          this.recipientsLoading = false;
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Impossible de charger les destinataires';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          this.recipientsLoading = false;
          console.error('Error loading recipients:', error);
        }
      });
  }

  /**
   * Change recipients page
   */
  onRecipientsPageChange(event: any): void {
    this.recipientsPage = event.page + 1;
    this.loadRecipients();
  }

  /**
   * Close recipients modal
   */
  closeRecipientsModal(): void {
    this.showRecipientsModal = false;
    this.newsletterRecipients = [];
    this.recipientsStats = {};
  }

  /**
   * Get recipient status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'sent':
        return 'bg-success';
      case 'failed':
        return 'bg-danger';
      case 'bounced':
        return 'bg-warning text-dark';
      case 'pending':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Get recipient status label
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'sent': 'Envoyé',
      'failed': 'Échoué',
      'bounced': 'Rejeté',
      'pending': 'En attente'
    };
    return labels[status] || status;
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
