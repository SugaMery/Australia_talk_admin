import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { NewsletterService, Newsletter, Subscriber } from '../newsletter/newsletter.service';
import { EmailTemplatesService, EmailTemplate } from '../services/email-templates.service';
import { MailSettingsService } from '../services/mail-settings.service';
import { SubscriberService } from '../services/subscriber.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SubscriberWithUser {
  id: string | number;
  email: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  uuid?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: string | null;
  full_name?: string;
  subscribed_at?: Date;
  status: 'active' | 'inactive' | 'unsubscribed';
}

@Component({
  selector: 'app-create-newsletter',
  templateUrl: './create-newsletter.component.html',
  styleUrls: ['./create-newsletter.component.css'],
  standalone: false
})
export class CreateNewsletterComponent implements OnInit, OnDestroy {
  // Form data
  newsletter: {
    name: string;
    slug: string;
    subject: string;
    template_id: number;
    description?: string;
    preview_text?: string;
  } = {
    name: '',
    slug: '',
    subject: '',
    template_id: 0,
    description: '',
    preview_text: ''
  };

  // Lists and selections
  subscribers: SubscriberWithUser[] = [];
  activeSubscribers: SubscriberWithUser[] = [];
  selectedSubscribers: (string | number)[] = [];
  emailTemplates: EmailTemplate[] = [];
  selectedTemplate: EmailTemplate | null = null;
  
  // UI State
  loading: boolean = false;
  previewMode: boolean = false;
  fromEmail: string = 'noreply@australia-talk.com';
  fromName: string = 'Australia Talk';

  private destroy$ = new Subject<void>();

  constructor(
    private newsletterService: NewsletterService,
    private emailTemplatesService: EmailTemplatesService,
    private messageService: MessageService,
    private http: HttpClient,
    private mailSettingsService: MailSettingsService,
    private subscriberService: SubscriberService
  ) {}

  ngOnInit(): void {
    this.loadMailSettings();
    this.loadEmailTemplates();
    this.loadSubscribers();
  }

  /**
   * Load email templates from EmailTemplatesService
   */
  private loadEmailTemplates(): void {
    this.emailTemplatesService.getTemplatesArray()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.emailTemplates = templates;
          // Pre-select first template if available
          if (templates.length > 0 && this.newsletter.template_id === 0) {
            this.newsletter.template_id = templates[0].id;
            this.onTemplateSelected();
          }
        },
        error: (error) => {
          console.error('Error loading email templates:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les modèles d\'email'
          });
        }
      });
  }

  /**
   * Load mail settings from service
   */
  private loadMailSettings(): void {
    this.mailSettingsService.mailSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          if (settings) {
            this.fromEmail = settings.newsletter_from_email || settings.from_email || 'noreply@australia-talk.com';
            this.fromName = settings.from_name || 'Australia Talk';
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load active subscribers from API via service with authentication
   */
  loadSubscribers(): void {
    this.loading = true;
    
    this.subscriberService.getUsersWithSubscribers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle both array and object responses
          const data = Array.isArray(response) ? response : (response as any).data || [];
          
          // Filter active subscribers
          this.subscribers = data as SubscriberWithUser[];
          this.activeSubscribers = data;
          this.loading = false;
          
          if (this.activeSubscribers.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Attention',
              detail: 'Aucun abonné actif trouvé'
            });
          }
        },
        error: (error) => {
          this.loading = false;
          const errorMsg = error?.error?.message || error?.message || 'Impossible de charger les abonnés';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          console.error('Error loading subscribers:', error);

          // Fallback to newsletter service
          this.loadSubscribersFromService();
        }
      });
  }

  /**
   * Fallback: Load subscribers from newsletter service
   */
  private loadSubscribersFromService(): void {
    this.newsletterService.getSubscribers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.activeSubscribers = data.filter(
            sub => sub.status === 'active'
          ) as SubscriberWithUser[];
        },
        error: (error) => {
          console.error('Error loading subscribers from service:', error);
        }
      });
  }

  /**
   * Handle template selection change
   */
  onTemplateSelected(): void {
    if (this.newsletter.template_id > 0) {
      this.selectedTemplate = this.emailTemplates.find(t => t.id === this.newsletter.template_id) || null;
    } else {
      this.selectedTemplate = null;
    }
  }

  /**
   * Validate form before saving
   */
  private validateForm(): boolean {
    if (!this.newsletter.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le nom de la newsletter est obligatoire'
      });
      return false;
    }

    if (!this.newsletter.subject?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le sujet de l\'email est obligatoire'
      });
      return false;
    }

    if (!this.newsletter.template_id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez sélectionner un modèle d\'email'
      });
      return false;
    }

    return true;
  }

  /**
   * Save newsletter
   */
  saveNewsletter(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;

    // Generate slug from name if not provided
    if (!this.newsletter.slug) {
      this.newsletter.slug = this.generateSlug(this.newsletter.name);
    }

    this.newsletterService.createNewsletter(this.newsletter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: response.message || 'Newsletter créée avec succès'
            });
            this.resetForm();
          }
        },
        error: (error) => {
          this.loading = false;
          const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de la création';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          console.error('Error creating newsletter:', error);
        }
      });
  }

  /**
   * Send preview email to test recipients
   */
  sendPreview(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    const userEmail = localStorage.getItem('userEmail') || 'admin@australia-talk.com';

    this.newsletterService.sendNewsletter(1, true, [userEmail])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.data) {
            const { sent, failed } = response.data;
            this.messageService.add({
              severity: sent > 0 ? 'success' : 'warn',
              summary: 'Aperçu',
              detail: `Envoyé: ${sent}, Échoué: ${failed}`
            });
          }
        },
        error: (error) => {
          this.loading = false;
          const errorMsg = error?.error?.message || 'Erreur lors de l\'envoi de l\'aperçu';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          console.error('Error sending preview:', error);
        }
      });
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.newsletter = {
      name: '',
      slug: '',
      subject: '',
      template_id: 0,
      description: '',
      preview_text: ''
    };
    this.selectedSubscribers = [];
  }

  /**
   * Generate URL-friendly slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Toggle subscriber selection
   */
  toggleSubscriber(subscriberId: string | number): void {
    const index = this.selectedSubscribers.indexOf(subscriberId);
    if (index > -1) {
      this.selectedSubscribers.splice(index, 1);
    } else {
      this.selectedSubscribers.push(subscriberId);
    }
  }

  /**
   * Select all active subscribers
   */
  selectAllSubscribers(): void {
    this.selectedSubscribers = this.activeSubscribers.map(sub => sub.id);
  }

  /**
   * Deselect all subscribers
   */
  deselectAllSubscribers(): void {
    this.selectedSubscribers = [];
  }

  /**
   * Get selected subscribers count
   */
  getSelectedCount(): number {
    return this.selectedSubscribers.length;
  }

  /**
   * Format content for preview
   */
  getPreviewContent(): string {
    return 'Preview content will be generated from selected template';
  }
}
