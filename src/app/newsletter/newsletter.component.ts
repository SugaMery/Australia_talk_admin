import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { NewsletterService, Newsletter, Subscriber, EmailTemplate } from './newsletter.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css', './recipients-modal.css', './delete-modal-styling.css', './duplicate-modal-styling.css', './tables-styling.css', './subscribers-table-styling.css', './debug-panel-styling.css'],
  standalone: false
})
export class NewsletterComponent implements OnInit, OnDestroy {
  newsletters: Newsletter[] = [];
  allNewsletters: Newsletter[] = []; // Store all newsletters for pagination
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
  
  // Newsletter pagination
  newsletterPage: number = 1;
  newsletterPageSize: number = 10;
  newsletterTotalPages: number = 0;
  paginatedNewsletters: Newsletter[] = [];
  
  // Recipients modal
  showRecipientsModal: boolean = false;
  newsletterRecipients: any[] = [];
  recipientsLoading: boolean = false;
  recipientsPage: number = 1;
  recipientsLimit: number = 20;
  recipientsTotal: number = 0;
  recipientsTotalPages: number = 0;
  recipientsStats: any = {};

  // Scheduler debugging
  showDebugPanel: boolean = false;
  schedulerStatus: any = null;
  schedulerLoading: boolean = false;
  debugLogs: string[] = [];
  sendingManually: boolean = false;
  manualSendResults: any = null;

  // Newsletter scheduling
  showScheduleModal: boolean = false;
  scheduleMode: 'now' | 'later' = 'now'; // 'now' = send immediately, 'later' = schedule for later
  scheduledDateTime: string = ''; // ISO format datetime
  scheduledDate: Date | null = null; // For PrimeNG calendar
  scheduledTime: Date | null = null; // For PrimeNG time picker
  schedulingNewsletterId: string | number | null = null;
  isScheduling: boolean = false;

  // Confirmation modal
  showConfirmationModal: boolean = false;
  confirmationMessage: string = '';
  confirmationDateTime: Date | null = null;
  confirmationCallback: (() => void) | null = null;

  // Delete modal
  showDeleteModal: boolean = false;
  deleteNewsletterName: string = '';
  deleteNewsletteId: string | number | null = null;
  isDeleting: boolean = false;

  // Duplicate modal
  showDuplicateModal: boolean = false;
  duplicateNewsletterName: string = '';
  duplicateNewsletterObject: Newsletter | null = null;
  isDuplicating: boolean = false;

  // Delete subscriber modal
  showDeleteSubscriberModal: boolean = false;
  deleteSubscriberEmail: string = '';
  deleteSubscriberId: string | number | null = null;
  isDeletingSubscriber: boolean = false;

  // French locale for calendar
  frenchLocale = {
    firstDayOfWeek: 0,
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    today: 'Aujourd\'hui',
    clear: 'Effacer',
    dateFormat: 'dd/mm/yy',
    weekHeader: 'Semaine'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private newsletterService: NewsletterService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private primeNgConfig: PrimeNGConfig
  ) {
    // Register French locale for Angular
    registerLocaleData(localeFr, 'fr');
    
    // Set French locale for PrimeNG
    this.primeNgConfig.setTranslation({
      firstDayOfWeek: 1,
      dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      dayNamesMin: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      today: "Aujourd'hui",
      clear: "Effacer",
      dateFormat: "dd/mm/yy",
      weekHeader: 'Sem',
      accept: 'Accepter',
      reject: 'Annuler',
      choose: 'Choisir',
      upload: 'Télécharger',
      cancel: 'Annuler'
    });
  }

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
            this.allNewsletters = response.data;
            this.newsletters = response.data; // Keep for backward compatibility
            if (response.pagination) {
              this.total = response.pagination.total;
              this.totalPages = response.pagination.pages;
              this.page = response.pagination.page;
            }
            // Initialize pagination
            this.newsletterPage = 1;
            this.updatePaginatedNewsletters();
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
   * Update paginated newsletters based on current page
   */
  updatePaginatedNewsletters(): void {
    const startIndex = (this.newsletterPage - 1) * this.newsletterPageSize;
    const endIndex = startIndex + this.newsletterPageSize;
    this.paginatedNewsletters = this.allNewsletters.slice(startIndex, endIndex);
    this.newsletterTotalPages = Math.ceil(this.allNewsletters.length / this.newsletterPageSize);
  }

  /**
   * Change newsletter page
   */
  onNewsletterPageChange(page: number): void {
    if (page >= 1 && page <= this.newsletterTotalPages) {
      this.newsletterPage = page;
      this.updatePaginatedNewsletters();
      // Scroll to top of table
      const tableElement = document.querySelector('.table-responsive');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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
          console.log('Available Recipients Data:', data);
          const subscribers = Array.isArray(data.data) ? data.data : [];
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
    // Find the newsletter to get its name
    const newsletter = this.newsletters.find(n => n.id === id);
    this.deleteNewsletterName = newsletter?.subject || 'Newsletter';
    this.deleteNewsletteId = id;
    this.showDeleteModal = true;
  }

  /**
   * Confirm deletion
   */
  confirmDelete(): void {
    if (this.deleteNewsletteId === null) {
      return;
    }

    this.isDeleting = true;
    this.newsletterService.deleteNewsletter(this.deleteNewsletteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.showDeleteModal = false;
          this.deleteNewsletterName = '';
          this.deleteNewsletteId = null;
          
          this.messageService.add({
            severity: 'success',
            summary: '✅ Newsletter supprimée',
            detail: 'La newsletter a été supprimée avec succès',
            life: 5000
          });
          this.loadNewsletters();
        },
        error: (error) => {
          this.isDeleting = false;
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

  /**
   * Cancel deletion
   */
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deleteNewsletterName = '';
    this.deleteNewsletteId = null;
  }

  /**
   * Open send/schedule modal when send button clicked
   */
  sendNewsletter(id: string | number): void {
    this.openSendScheduleModal(id);
  }

  /**
   * Open send/schedule modal
   */
  openSendScheduleModal(id: string | number): void {
    this.schedulingNewsletterId = id;
    this.scheduleMode = 'now';
    this.scheduledDateTime = '';
    this.scheduledDate = null;
    this.scheduledTime = null;
    this.showScheduleModal = true;
  }

  /**
   * Close send/schedule modal
   */
  closeSendScheduleModal(): void {
    this.showScheduleModal = false;
    this.schedulingNewsletterId = null;
    this.scheduleMode = 'now';
    this.scheduledDateTime = '';
    this.scheduledDate = null;
    this.scheduledTime = null;
  }

  /**
   * Confirm send or schedule newsletter
   */
  confirmSendOrSchedule(): void {
    const id = this.schedulingNewsletterId;
    
    if (!id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'ID de la newsletter manquant'
      });
      return;
    }

    if (this.scheduleMode === 'now') {
      this.closeSendScheduleModal();
      this.sendNewsletterNow(id);
    } else if (this.scheduleMode === 'later') {
      if (!this.scheduledDate || !this.scheduledTime) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Veuillez sélectionner une date et une heure pour programmer la newsletter'
        });
        return;
      }

      // Combine date and time
      const selectedDateTime = new Date(
        this.scheduledDate.getFullYear(),
        this.scheduledDate.getMonth(),
        this.scheduledDate.getDate(),
        this.scheduledTime.getHours(),
        this.scheduledTime.getMinutes(),
        0
      );

      // Check if scheduled time is in the future
      if (selectedDateTime <= new Date()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'La date et l\'heure doivent être dans le futur'
        });
        return;
      }

      // Show confirmation modal, hide schedule modal
      this.scheduleNewsletterLater(id, selectedDateTime);
    }
  }

  /**
   * Send newsletter immediately
   */
  sendNewsletterNow(id: string | number): void {
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
   * Schedule newsletter for later
   */
  scheduleNewsletterLater(id: string | number, scheduledAt: Date): void {
    this.confirmationMessage = `Vous êtes sur le point de programmer cette newsletter pour être envoyée à:<br><strong>${scheduledAt.toLocaleString('fr-FR')}</strong><br><br>Cette action peut être annulée avant l'envoi.`;
    this.confirmationDateTime = scheduledAt;
    this.schedulingNewsletterId = id;
    this.showScheduleModal = false; // Hide the schedule modal
    this.showConfirmationModal = true; // Show the confirmation modal
  }

  /**
   * Confirm and proceed with scheduling
   */
  confirmScheduling(): void {
    if (!this.confirmationDateTime || this.schedulingNewsletterId === null) {
      return;
    }

    this.isScheduling = true;
    this.showConfirmationModal = false;

    this.messageService.add({
      severity: 'info',
      summary: '⏱️ Programmation en cours',
      detail: 'La newsletter est en cours de programmation...',
      life: 5000
    });

    this.newsletterService.scheduleNewsletter(this.schedulingNewsletterId, this.confirmationDateTime)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isScheduling = false;
          if (response.success || response.data?.success) {
            this.messageService.add({
              severity: 'success',
              summary: '✅ Newsletter programmée avec succès',
              detail: `Newsletter sera envoyée le ${this.confirmationDateTime!.toLocaleString('fr-FR')}`,
              life: 8000
            });
            this.loadNewsletters();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: '❌ Erreur de programmation',
              detail: response.message || 'Une erreur est survenue',
              life: 8000
            });
          }
        },
        error: (error) => {
          this.isScheduling = false;
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la programmation';
          this.messageService.add({
            severity: 'error',
            summary: '❌ Erreur',
            detail: errorMsg,
            life: 8000
          });
          console.error('Error scheduling newsletter:', error);
        }
      });
  }

  /**
   * Cancel confirmation and go back to schedule modal
   */
  cancelConfirmation(): void {
    this.showConfirmationModal = false; // Hide confirmation modal
    this.showScheduleModal = true; // Show schedule modal again
    this.confirmationMessage = '';
    this.confirmationDateTime = null;
  }

  /**
   * Duplicate newsletter
   */
  duplicateNewsletter(newsletter: Newsletter): void {
    this.duplicateNewsletterName = newsletter.name;
    this.duplicateNewsletterObject = newsletter;
    this.showDuplicateModal = true;
  }

  /**
   * Confirm duplication
   */
  confirmDuplicate(): void {
    if (!this.duplicateNewsletterObject) {
      return;
    }

    this.isDuplicating = true;
    this.messageService.add({
      severity: 'info',
      summary: '🔄 Duplication en cours',
      detail: 'Création de la copie de la newsletter...',
      life: 3000
    });

    this.newsletterService.duplicateNewsletter(this.duplicateNewsletterObject.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isDuplicating = false;
          this.showDuplicateModal = false;
          
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: '✅ Newsletter dupliquée',
              detail: `La newsletter "${this.duplicateNewsletterName}" a été dupliquée avec succès`,
              life: 6000
            });
            this.loadNewsletters();
          }
          
          this.duplicateNewsletterName = '';
          this.duplicateNewsletterObject = null;
        },
        error: (error) => {
          this.isDuplicating = false;
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

  /**
   * Cancel duplication
   */
  cancelDuplicate(): void {
    this.showDuplicateModal = false;
    this.duplicateNewsletterName = '';
    this.duplicateNewsletterObject = null;
  }

  /**
   * Delete subscriber
   */
  deleteSubscriber(id: string | number): void {
    const subscriber = this.subscribers.find(s => s.id === id);
    if (subscriber) {
      this.deleteSubscriberEmail = subscriber.email;
      this.deleteSubscriberId = id;
      this.showDeleteSubscriberModal = true;
    }
  }

  /**
   * Confirm subscriber deletion
   */
  confirmDeleteSubscriber(): void {
    if (!this.deleteSubscriberId) {
      return;
    }

    this.isDeletingSubscriber = true;
    this.messageService.add({
      severity: 'info',
      summary: '🗑️ Suppression en cours',
      detail: 'Suppression de l\'abonné...',
      life: 3000
    });

    this.newsletterService.deleteSubscriber(this.deleteSubscriberId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeletingSubscriber = false;
          this.showDeleteSubscriberModal = false;
          this.messageService.add({
            severity: 'success',
            summary: '✅ Abonné supprimé',
            detail: `L'abonné "${this.deleteSubscriberEmail}" a été supprimé avec succès`,
            life: 5000
          });
          this.loadSubscribers();
          this.deleteSubscriberEmail = '';
          this.deleteSubscriberId = null;
        },
        error: (error) => {
          this.isDeletingSubscriber = false;
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

  /**
   * Cancel subscriber deletion
   */
  cancelDeleteSubscriber(): void {
    this.showDeleteSubscriberModal = false;
    this.deleteSubscriberEmail = '';
    this.deleteSubscriberId = null;
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

  /**
   * ========================================
   * SCHEDULER DEBUG & TESTING METHODS
   * ========================================
   */

  /**
   * Toggle debug panel visibility
   */
  toggleDebugPanel(): void {
    this.showDebugPanel = !this.showDebugPanel;
    if (this.showDebugPanel && !this.schedulerStatus) {
      this.loadSchedulerStatus();
    }
  }

  /**
   * Load scheduler status and debug information
   */
  loadSchedulerStatus(): void {
    this.schedulerLoading = true;
    this.addDebugLog('📊 Fetching scheduler status...');
    
    this.newsletterService.getSchedulerStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.schedulerStatus = response.data || response;
          this.schedulerLoading = false;
          this.addDebugLog('✅ Scheduler status loaded successfully');
          
          if (this.schedulerStatus?.debug_info?.server_time && this.schedulerStatus?.debug_info?.database_time) {
            const serverTime = new Date(this.schedulerStatus.debug_info.server_time);
            const dbTime = new Date(this.schedulerStatus.debug_info.database_time);
            this.addDebugLog(`⏰ Server Time: ${serverTime.toISOString()}`);
            this.addDebugLog(`🗄️  Database Time: ${dbTime.toISOString()}`);
            
            if (serverTime.getTime() !== dbTime.getTime()) {
              this.addDebugLog(`⚠️  ⏱️  Timezone Mismatch Detected! Difference: ${Math.abs(serverTime.getTime() - dbTime.getTime())} ms`);
            }
          }

          if (this.schedulerStatus?.debug_info?.scheduled_newsletters?.length) {
            this.addDebugLog(`📋 Found ${this.schedulerStatus.debug_info.scheduled_newsletters.length} scheduled newsletter(s)`);
            this.schedulerStatus.debug_info.scheduled_newsletters.forEach((nl: any) => {
              const status = nl.status === 'READY TO SEND' ? '⏰' : '⏳';
              this.addDebugLog(`   ${status} [ID: ${nl.id}] ${nl.name} - Status: ${nl.status} (${nl.minutes_until_send} min)`);
            });
          } else {
            this.addDebugLog('✓ No scheduled newsletters at this time');
          }
        },
        error: (error) => {
          this.schedulerLoading = false;
          this.addDebugLog(`❌ Error fetching scheduler status: ${error.message}`);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load scheduler status'
          });
        }
      });
  }

  /**
   * Send newsletter manually (bypasses scheduler)
   */
  sendNewsletterManuallyDebug(newsletter: Newsletter): void {
    this.confirmationService.confirm({
      message: `This will send the newsletter "${newsletter.name}" immediately to all active subscribers using the manual endpoint (bypasses scheduler).<br><br><strong>Continue?</strong>`,
      header: '📧 Manual Newsletter Send',
      icon: 'pi pi-envelope',
      acceptLabel: 'Yes, Send Now',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-success p-button-lg',
      rejectButtonStyleClass: 'p-button-secondary p-button-lg',
      acceptIcon: 'pi pi-send',
      rejectIcon: 'pi pi-times',
      accept: () => {
        this.sendingManually = true;
        this.manualSendResults = null;
        this.addDebugLog(`🚀 Manually sending newsletter ${newsletter.id}...`);
        
        this.newsletterService.sendNewsletterManual(newsletter.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.sendingManually = false;
              this.manualSendResults = response;
              
              if (response.success || response.data?.success) {
                const sent = response.data?.sent || (response as any).sent || 0;
                const failed = response.data?.failed || (response as any).failed || 0;
                
                this.addDebugLog(`✅ Newsletter sent successfully!`);
                this.addDebugLog(`   📧 Sent to: ${sent} subscribers`);
                if (failed > 0) {
                  this.addDebugLog(`   ❌ Failed: ${failed} subscribers`);
                  if ((response.data?.errors || (response as any).errors) && (response.data?.errors || (response as any).errors).length > 0) {
                    ((response.data?.errors || (response as any).errors) || []).forEach((err: any) => {
                      this.addDebugLog(`      • ${err.email}: ${err.error}`);
                    });
                  }
                }
                
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: `Newsletter sent to ${sent} subscribers`
                });
                
                // Reload newsletters to update status
                setTimeout(() => this.loadNewsletters(), 1500);
              } else {
                this.addDebugLog(`❌ Failed to send newsletter: ${response.message}`);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: response.message || 'Failed to send newsletter'
                });
              }
            },
            error: (error) => {
              this.sendingManually = false;
              const errorMsg = error?.error?.message || error?.message || 'Unknown error';
              this.addDebugLog(`❌ Error sending newsletter: ${errorMsg}`);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: errorMsg
              });
            }
          });
      }
    });
  }

  /**
   * Trigger scheduler check manually
   */
  triggerSchedulerCheckManually(): void {
    this.schedulerLoading = true;
    this.addDebugLog('⚡ Triggering manual scheduler check...');
    
    this.newsletterService.triggerSchedulerCheck()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.schedulerLoading = false;
          if (response.success) {
            this.addDebugLog(`✅ Scheduler check executed successfully`);
            this.addDebugLog(JSON.stringify(response.data, null, 2));
            
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Scheduler check completed'
            });
            
            // Reload status after check
            setTimeout(() => this.loadSchedulerStatus(), 1000);
          } else {
            this.addDebugLog(`❌ Scheduler check failed: ${response.message}`);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'Scheduler check failed'
            });
          }
        },
        error: (error) => {
          this.schedulerLoading = false;
          const errorMsg = error?.message || 'Unknown error';
          this.addDebugLog(`❌ Error triggering scheduler: ${errorMsg}`);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg
          });
        }
      });
  }

  /**
   * Add a message to debug logs
   */
  private addDebugLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    this.debugLogs.unshift(`[${timestamp}] ${message}`);
    
    // Keep only last 50 logs
    if (this.debugLogs.length > 50) {
      this.debugLogs.pop();
    }
  }

  /**
   * Clear debug logs
   */
  clearDebugLogs(): void {
    this.debugLogs = [];
    this.manualSendResults = null;
    this.schedulerStatus = null;
  }

  /**
   * Export debug logs to file
   */
  exportDebugLogs(): void {
    const content = this.debugLogs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const filename = `newsletter-debug-${new Date().toISOString().split('T')[0]}.log`;
    this.downloadFile(blob, filename);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Debug logs exported successfully'
    });
  }
}
