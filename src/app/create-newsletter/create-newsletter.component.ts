import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { NewsletterService, Newsletter, Subscriber } from '../newsletter/newsletter.service';
import { EmailTemplatesService, EmailTemplate } from '../services/email-templates.service';
import { MailSettingsService } from '../services/mail-settings.service';
import { SubscriberService } from '../services/subscriber.service';
import { ArticleService } from '../services/article.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface SubscriberWithUser {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  created_at?: Date;
  status?: 'active' | 'inactive' | 'unsubscribed';
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
    description: string;
    preview_text: string;
    variables: { [key: string]: string };
  } = {
    name: '',
    slug: '',
    subject: '',
    template_id: 0,
    description: '',
    preview_text: '',
    variables: {}
  };

  // Lists and selections
  subscribers: SubscriberWithUser[] = [];
  activeSubscribers: SubscriberWithUser[] = [];
  selectedSubscribers: (string | number)[] = [];
  emailTemplates: EmailTemplate[] = [];
  selectedTemplate: EmailTemplate | null = null;
  templateVariables: string[] = [];
  exampleArticles: any[] = [];
  
  // UI State
  loading: boolean = false;
  previewMode: boolean = false;
  isEditMode: boolean = false;
  editingNewsletterID: string | null = null;
  fromEmail: string = 'noreply@australia-talk.com';
  fromName: string = 'Australia Talk';

  private destroy$ = new Subject<void>();

  // Sanitized preview HTML
  safePreviewBody: SafeHtml | null = null;

  @ViewChild('articlesCarousel') articlesCarousel: ElementRef | undefined;

  constructor(
    private newsletterService: NewsletterService,
    private emailTemplatesService: EmailTemplatesService,
    private messageService: MessageService,
    private http: HttpClient,
    private mailSettingsService: MailSettingsService,
    private subscriberService: SubscriberService,
    private articleService: ArticleService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /**
   * Check if running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  ngOnInit(): void {
    this.loadMailSettings();
    this.loadEmailTemplates();
    this.loadSubscribers();

    // Check if we're in edit mode by checking the route
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(urlSegments => {
      const isEditRoute = urlSegments.some(segment => segment.path === 'edit-newsletter');
      
      if (isEditRoute) {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
          const id = params.get('id');
          if (id) {
            this.isEditMode = true;
            this.editingNewsletterID = id;
            this.loadNewsletterForEdit(id);
          }
        });
      }
    });
  }

  /**
   * Load newsletter data for editing
   */
  private loadNewsletterForEdit(id: string): void {
    this.loading = true;
    this.newsletterService.getNewsletterById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response.data || response;
          this.newsletter.name = data.name || '';
          this.newsletter.slug = data.slug || '';
          this.newsletter.subject = data.subject || '';
          this.newsletter.template_id = data.template_id || 0;
          this.newsletter.description = data.description || '';
          this.newsletter.preview_text = data.preview_text || '';
          
          // Parse manual_variables_data and populate form variables
          let manualVariablesData = {};
          if (data.manual_variables_data) {
            try {
              manualVariablesData = typeof data.manual_variables_data === 'string' 
                ? JSON.parse(data.manual_variables_data) 
                : data.manual_variables_data;
            } catch (e) {
              console.error('Error parsing manual_variables_data:', e);
              manualVariablesData = {};
            }
          }
          
          // Extract ARTICLES_PLACEHOLDER articles but don't auto-select them in edit mode
          if (manualVariablesData && (manualVariablesData as any)['ARTICLES_PLACEHOLDER']) {
            try {
              let articlesData = (manualVariablesData as any)['ARTICLES_PLACEHOLDER'];
              if (typeof articlesData === 'string') {
                articlesData = JSON.parse(articlesData);
              }
              
              console.log('Found stored articles in ARTICLES_PLACEHOLDER:', articlesData);
            } catch (e) {
              console.error('Error parsing ARTICLES_PLACEHOLDER:', e);
            }
            
            // Remove ARTICLES_PLACEHOLDER from variables as it's handled separately
            delete (manualVariablesData as any)['ARTICLES_PLACEHOLDER'];
          }
          
          this.newsletter.variables = manualVariablesData;

          // Load template after data is loaded
          if (this.newsletter.template_id > 0) {
            setTimeout(() => this.onTemplateSelected(), 100);
          }

          // Load selected recipients if available
          if (data.selected_recipients) {
            try {
              const recipients = typeof data.selected_recipients === 'string' 
                ? JSON.parse(data.selected_recipients) 
                : data.selected_recipients;
              this.selectedSubscribers = recipients;
            } catch (e) {
              console.error('Error parsing selected recipients:', e);
            }
          }

          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger la newsletter'
          });
          console.error('Error loading newsletter:', error);
          this.router.navigate(['/newsletter']);
        }
      });
  }

  /**
   * Load email templates from EmailTemplatesService
   */
  private loadEmailTemplates(): void {
    const token = this.isBrowser() ? localStorage.getItem('token') || localStorage.getItem('authToken') || '' : '';
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.get<any>('https://api.australia-talk.com/api/newsletters/templates/available', { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const templates = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
          // Temporarily show all templates to debug
          this.emailTemplates = templates;
          console.log('Loaded all templates (unfiltered):', this.emailTemplates);
          console.log('Template types found:', templates.map((t: any) => ({ id: t.id, name: t.template_name, type: t.type })));
          if (this.emailTemplates.length > 0 && this.newsletter.template_id === 0) {
            this.newsletter.template_id = this.emailTemplates[0].id;
            this.onTemplateSelected();
            //this.onTemplateSelected();
          }
        },
        error: (error) => {
          console.error('Error loading email templates from API:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les modèles d\'email depuis le serveur'
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
   * Load active subscribers from API via recipients/available endpoint
   */
  loadSubscribers(): void {
    this.loading = true;

    this.newsletterService.getAvailableRecipients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Handle the API response format
          const subscribers = Array.isArray(data) ? data : (data && (data as any).data) ? (data as any).data : [];

          // Filter to only active subscribers (assuming all returned are active)
          this.subscribers = subscribers as SubscriberWithUser[];
          this.activeSubscribers = subscribers;
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
          console.error('Error loading recipients:', error);

          // Fallback to subscriber service
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
      // parse variables from selected template
      this.templateVariables = [];
      this.exampleArticles = [];
      if (this.selectedTemplate) {
        // Debug: log selected template
        console.log('Template selected:', this.selectedTemplate);
        console.log('Template Body:', this.selectedTemplate.body);
        console.log('Full Template Object:', JSON.stringify(this.selectedTemplate, null, 2));

        // Prefer manual_variables (matches backend), fallback to other variable sources
        let parts: string[] = [];
        if (Array.isArray((this.selectedTemplate as any).manual_variables) && (this.selectedTemplate as any).manual_variables.length > 0) {
          parts = (this.selectedTemplate as any).manual_variables.map((v: string) => v.toString().trim()).filter(Boolean);
        } else if (Array.isArray((this.selectedTemplate as any).manualVariables) && (this.selectedTemplate as any).manualVariables.length > 0) {
          parts = (this.selectedTemplate as any).manualVariables.map((v: string) => v.toString().trim()).filter(Boolean);
        } else if (Array.isArray((this.selectedTemplate as any).requiredVariables) && (this.selectedTemplate as any).requiredVariables.length > 0) {
          parts = (this.selectedTemplate as any).requiredVariables.map((v: string) => v.toString().trim()).filter(Boolean);
        } else if (Array.isArray((this.selectedTemplate as any).required_variables) && (this.selectedTemplate as any).required_variables.length > 0) {
          parts = (this.selectedTemplate as any).required_variables.map((v: string) => v.toString().trim()).filter(Boolean);
        } else {
          const varsString = (this.selectedTemplate as any).variables || '';
          if (varsString && typeof varsString === 'string') {
            parts = varsString.split(',').map((p: string) => p.replace(/\{\{|\}\}/g, '').trim()).filter(Boolean);
          }
        }

        if (parts.length > 0) {
          this.templateVariables = parts;
          // ensure newsletter.variables has keys
          this.templateVariables.forEach(k => {
            if (!this.newsletter.variables) this.newsletter.variables = {};
            if (!(k in this.newsletter.variables)) {
              this.newsletter.variables[k] = '';
            }
          });
        }

        // detect articles placeholder in body
        const body = (this.selectedTemplate.body || '') as string;
        if (/ARTICLES_PLACEHOLDER|\{\{ARTICLES_PLACEHOLDER\}\}/i.test(body)) {
          this.fetchExampleArticles();
        }

        // build preview HTML for current template/variables
        this.buildPreview();
      }
    } else {
      this.selectedTemplate = null;
    }

    this.newsletter.subject = this.selectedTemplate!.subject || '';
    this.onSubjectChange(this.selectedTemplate!.subject);
    
    this.buildPreview();
    console.log('Selected template ID:', this.newsletter.template_id, 'Template:', this.selectedTemplate);



  }

  private fetchExampleArticles(): void {
    // Use ArticleService to retrieve articles (service handles auth headers)
    this.articleService.getAllWithRelated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          // articles are normalized by ArticleService to include title/content
          const articlesArray = Array.isArray(articles) ? articles : (articles && (articles as any).data) ? (articles as any).data : [];
          this.exampleArticles = articlesArray.map((article: any) => ({ ...article, selected: false }));
          this.buildPreview();
        },
        error: (err) => {
          console.error('Error fetching example articles via ArticleService:', err);
          this.exampleArticles = [];
        }
      });
  }

  /**
   * Build sanitized preview HTML by replacing variables and article placeholders
   */
  buildPreview(): void {
    if (!this.selectedTemplate) {
      this.safePreviewBody = null;
      return;
    }

    let body = (this.selectedTemplate.body || '') as string;

    

    // replace variables like {{VAR_NAME}}
    const vars = this.templateVariables || [];
    vars.forEach(v => {
      // match {{VAR}} with optional spaces
      const re = new RegExp('\\{\\{\\s*' + this.escapeRegExp(v) + '\\s*\\}\\}', 'gi');
      const value = (this.newsletter.variables && this.newsletter.variables[v]) ? this.newsletter.variables[v] : '';
      body = body.replace(re, value);
    });

    // Prepare ARTICLES HTML (use selected articles if ARTICLES_PLACEHOLDER, otherwise first 4 examples)
    let articlesHtml = '';
    
    let articlesToShow = [];
    if (this.templateVariables.includes('ARTICLES_PLACEHOLDER')) {
      // Use selected articles for ARTICLES_PLACEHOLDER
      articlesToShow = (this.exampleArticles || []).filter(a => a.selected);
    } else {
      // Use first 4 example articles for preview
      articlesToShow = (this.exampleArticles || []).slice(0, 4);
    }
    
    if (articlesToShow.length > 0) {
      // Format articles data
      const articlesData = articlesToShow.map(article => ({
        id: article.id,
        title: article.translation?.title || article.title || article.name || article.heading,
        slug: article.slug,
        excerpt: article.excerpt || article.subtitle || article.summary,
        image: article.media && article.media.length > 0 ? article.media[0].path : 'https://via.placeholder.com/300x200?text=Article',
        category: article.categories && article.categories.length > 0 ? 
          article.categories[0]?.translation?.name || article.categories[0]?.name : 'General',
        date: article.created_at ? new Date(article.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
        author: 'Australia Talk',
        read_time: '5 min',
        link: `/articles/${article.slug || article.id}`
      }));

      articlesHtml = `
        <style>
          .articles-grid-manual {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .article-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            transition: box-shadow 0.3s;
          }
          .article-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .article-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
          }
          .article-content {
            padding: 16px;
          }
          .article-category {
            display: inline-block;
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .article-title {
            font-size: 16px;
            font-weight: 600;
            margin: 8px 0;
            color: #333;
          }
          .article-excerpt {
            font-size: 14px;
            color: #666;
            margin: 8px 0;
            line-height: 1.5;
          }
          .article-meta {
            font-size: 12px;
            color: #999;
            margin: 12px 0;
            line-height: 1.6;
          }
          .read-more {
            display: inline-block;
            color: #1976d2;
            text-decoration: none;
            font-weight: 500;
            margin-top: 8px;
            transition: color 0.2s;
          }
          .read-more:hover {
            color: #1565c0;
          }
          @media (max-width: 640px) {
            .articles-grid-manual {
              grid-template-columns: 1fr;
            }
          }
        </style>
        <div class="articles-grid-manual">
          ${articlesData
            .map(
              (article, index) => `
                <!-- Article ${index + 1} -->
                <div class="article-card">
                  <img src="${this.escapeHtml(article.image)}" alt="${this.escapeHtml(article.title)}" class="article-image" />
                  <div class="article-content">
                    <span class="article-category">${this.escapeHtml(article.category)}</span>
                    <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
                    <p class="article-excerpt">${this.escapeHtml(article.excerpt || 'Découvrez cet article passionnant sur Australia Talk.')}</p>
                    <div class="article-meta">
                      📅 ${this.escapeHtml(article.date)} | 👤 ${this.escapeHtml(article.author)} | ⏱️ ${this.escapeHtml(article.read_time)}
                    </div>
                    <a href="${this.escapeHtml(article.link)}" class="read-more">Lire l'article complet →</a>
                  </div>
                </div>
              `
            )
            .join('\n')}
        </div>
      `;
    }

    // If template contains placeholder, replace
    if (/\{\{\s*ARTICLES_PLACEHOLDER\s*\}\}/i.test(body) || /ARTICLES_PLACEHOLDER/i.test(body)) {
      body = body.replace(/\{\{\s*ARTICLES_PLACEHOLDER\s*\}\}/gi, articlesHtml);
      body = body.replace(/ARTICLES_PLACEHOLDER/gi, articlesHtml);
    }

    // final sanitize
    try {
      this.safePreviewBody = this.sanitizer.bypassSecurityTrustHtml(body || '');
    } catch (err) {
      this.safePreviewBody = null;
    }
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * When name changes, generate slug automatically
   */
  onNameChange(value: string): void {
    const text = (value || '').toString().trim();
    if (text) {
      this.newsletter.slug = this.generateSlug(text);
    }
  }

  /**
   * Auto-generate name and slug from subject
   */
  onSubjectChange(value: string): void {
    const text = (value || '').toString().trim();
    if (text) {
      this.newsletter.name = text;
      this.newsletter.slug = this.generateSlug(text);
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

    if (!this.newsletter.slug?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le slug est obligatoire'
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

    // Validate selected articles if ARTICLES_PLACEHOLDER is present
    if (this.templateVariables.includes('ARTICLES_PLACEHOLDER')) {
      const selectedCount = this.getSelectedArticlesCount();
      if (selectedCount === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Veuillez sélectionner au moins un article pour ce modèle'
        });
        return false;
      }
      if (selectedCount > 4) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Vous ne pouvez sélectionner que maximum 4 articles'
        });
        return false;
      }
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

    // Prepare payload with manual variables as individual properties
    const payload: any = {
      name: this.newsletter.name,
      slug: this.newsletter.slug,
      subject: this.newsletter.subject,
      template_id: this.newsletter.template_id,
      description: this.newsletter.description || null,
      preview_text: this.newsletter.preview_text || null,
      selected_recipients: this.selectedSubscribers.length > 0 ? this.selectedSubscribers : null
    };

    // Add manual variables as individual properties (not nested in variables object)
    if (this.templateVariables && this.templateVariables.length > 0) {
      this.templateVariables.forEach(varName => {
        if (this.newsletter.variables && this.newsletter.variables[varName] !== undefined) {
          if (varName === 'ARTICLES_PLACEHOLDER') {
            // For ARTICLES_PLACEHOLDER, send the selected articles as JSON string
            const selectedArticles = this.exampleArticles.filter(a => a.selected);
            if (selectedArticles.length > 0) {
              payload[varName] = JSON.stringify(selectedArticles.map(article => ({
                id: article.id,
                title: article.translation?.title || article.title || article.name || article.heading,
                slug: article.slug,
                excerpt: article.excerpt || article.subtitle || article.summary,
                image: article.media && article.media.length > 0 ? article.media[0].path : null,
                category: article.categories && article.categories.length > 0 ? 
                  article.categories[0]?.translation?.name || article.categories[0]?.name : null,
                date: article.created_at ? new Date(article.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
                author: 'Australia Talk', // Default author
                read_time: '5 min', // Default read time
                link: `/articles/${article.slug || article.id}`
              })));
            }
          } else {
            payload[varName] = this.newsletter.variables[varName];
          }
        }
      });
    }

    console.log('Saving newsletter with payload:', payload);
    
    // Choose between create and update based on edit mode
    const saveRequest = this.isEditMode && this.editingNewsletterID
      ? this.newsletterService.updateNewsletter(this.editingNewsletterID, payload)
      : this.newsletterService.createNewsletter(payload);

    saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: response.message || (this.isEditMode ? 'Newsletter mise à jour avec succès' : 'Newsletter créée avec succès')
            });
            setTimeout(() => {
              this.router.navigate(['/newsletter']);
            }, 1500);
          }
        },
        error: (error) => {
          this.loading = false;
          const errorMsg = error?.error?.message || error?.error?.error || 'Erreur lors de la sauvegarde';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          console.error('Error saving newsletter:', error);
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
    const userEmail = this.isBrowser() ? localStorage.getItem('userEmail') || 'admin@australia-talk.com' : 'admin@australia-talk.com';

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
      preview_text: '',
      variables: {}
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

  /**
   * Return a safe label for a manual variable (fallback to variable name)
   */
  getManualLabel(varName: string): string {
    if (!this.selectedTemplate) return varName;
    const labels = (this.selectedTemplate as any).manualVariablesLabels || {};
    return labels[varName] || varName;
  }

  /**
   * Get count of selected articles
   */
  getSelectedArticlesCount(): number {
    return (this.exampleArticles || []).filter(a => a.selected).length;
  }

  /**
   * Toggle article selection by clicking on the card
   */
  toggleArticleSelection(article: any): void {
    const selectedCount = this.getSelectedArticlesCount();
    
    // If article is already selected, allow deselection
    if (article.selected) {
      article.selected = false;
    } else {
      // If trying to select and already have 4, show toast
      if (selectedCount >= 4) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Limite dépassée',
          detail: 'Vous pouvez sélectionner un maximum de 4 articles',
          life: 300000
        });
        return;
      }
      article.selected = true;
    }
    
    this.onArticleSelectionChange();
  }

  /**
   * Handle article selection change
   */
  onArticleSelectionChange(): void {
    const selectedCount = this.getSelectedArticlesCount();
    if (selectedCount > 4) {
      // Show toast notification if more than 4 articles selected
      this.messageService.add({
        severity: 'warn',
        summary: 'Limite dépassée',
        detail: 'Vous pouvez sélectionner un maximum de 4 articles',
        life: 3000
      });
      // Deselect the last selected article
      const lastSelected = this.exampleArticles.find(a => a.selected);
      if (lastSelected) {
        lastSelected.selected = false;
      }
    }
    // Update preview when articles are selected/deselected
    this.buildPreview();
  }

  /**
   * Get selected articles
   */
  getSelectedArticles(): any[] {
    return (this.exampleArticles || []).filter(a => a.selected);
  }

  /**
   * Scroll carousel to the left
   */
  scrollCarouselLeft(): void {
    if (this.articlesCarousel && this.articlesCarousel.nativeElement) {
      const carousel = this.articlesCarousel.nativeElement;
      carousel.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Scroll carousel to the right
   */
  scrollCarouselRight(): void {
    if (this.articlesCarousel && this.articlesCarousel.nativeElement) {
      const carousel = this.articlesCarousel.nativeElement;
      carousel.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  }
}
