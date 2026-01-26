import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MailSettingsService } from '../services/mail-settings.service';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css'],
  providers: [MessageService]
})
export class SystemSettingsComponent implements OnInit {
  mailSettings = {
    id: 0,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'Australia Talk',
    enable_sitemap_email: false,
    sitemap_email_frequency: 'weekly', // weekly, monthly
    enable_newsletter: false,
    enable_contact_form_email: false,
    enable_error_notifications: false,
    max_retries: 3,
    timeout: 30000,
    created_at: '',
    updated_at: ''
  };

  testEmailData = {
    recipient_email: 'bmaryam@ept.sn',
    subject: 'Test Email - Australia Talk',
    test_type: 'test_general' // general, sitemap, newsletter
  };

  isLoading = false;
  isSaving = false;
  isSendingTest = false;
  showTestEmailModal = false;
  showPassword = false;

  constructor(
    private messageService: MessageService,
    private mailSettingsService: MailSettingsService
  ) {}

  ngOnInit(): void {
    this.loadMailSettings();
  }

  loadMailSettings(): void {
    this.isLoading = true;
    this.mailSettingsService.getMailSettings().subscribe({
      next: (response: any) => {
        // Extract settings from response - could be response.data or response directly
        const settings = response.data || response;
        
        console.log('Loading settings into form:', settings);
        
        // Convert 0/1 to boolean for database values
        this.mailSettings = {
          id: settings.id || 0,
          smtp_host: settings.smtp_host || 'smtp.gmail.com',
          smtp_port: settings.smtp_port || 587,
          smtp_username: settings.smtp_username || '',
          smtp_password: settings.smtp_password || '',
          from_email: settings.from_email || 'noreply@australia-talk.com',
          from_name: settings.from_name || 'Australia Talk',
          enable_sitemap_email: settings.enable_sitemap_email === 1 || settings.enable_sitemap_email === true || false,
          sitemap_email_frequency: settings.sitemap_email_frequency || 'weekly',
          enable_newsletter: settings.enable_newsletter === 1 || settings.enable_newsletter === true || false,
          enable_contact_form_email: settings.enable_contact_form_email === 1 || settings.enable_contact_form_email === true || false,
          enable_error_notifications: settings.enable_error_notifications === 1 || settings.enable_error_notifications === true || false,
          max_retries: settings.max_retries || 3,
          timeout: settings.timeout || 30000,
          created_at: settings.created_at || '',
          updated_at: settings.updated_at || ''
        };
        
        console.log('Form populated with settings:', this.mailSettings);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur lors du chargement des paramètres email:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des paramètres email'
        });
      }
    });
  }

  saveMailSettings(): void {
    if (!this.mailSettings.from_email?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'L\'email d\'envoi est requis'
      });
      return;
    }

    this.isSaving = true;
    
    // If no ID, create new settings; otherwise update
    if (this.mailSettings.id && this.mailSettings.id !== 0) {
      this.mailSettingsService.updateMailSettings(this.mailSettings.id, this.mailSettings).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Paramètres email sauvegardés avec succès'
          });
          this.isSaving = false;
        },
        error: (error: any) => {
          console.error('Erreur lors de la sauvegarde:', error);
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la sauvegarde';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          this.isSaving = false;
        }
      });
    } else {
      // Create new settings if no ID exists
      this.mailSettingsService.createMailSettings(this.mailSettings).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Paramètres email créés et sauvegardés avec succès'
          });
          this.isSaving = false;
        },
        error: (error: any) => {
          console.error('Erreur lors de la création:', error);
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la création';
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

  openTestEmailModal(): void {
    this.testEmailData.recipient_email = this.mailSettings.from_email;
    this.showTestEmailModal = true;
  }

  closeTestEmailModal(): void {
    this.showTestEmailModal = false;
    this.testEmailData = {
      recipient_email: '',
      subject: 'Test Email - Australia Talk',
      test_type: 'general'
    };
  }

  sendTestEmail(): void {
    if (!this.testEmailData.recipient_email?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'L\'adresse email du destinataire est requise'
      });
      return;
    }

    this.isSendingTest = true;
    console.log('Envoi de l\'email test à:', this.testEmailData);
    this.mailSettingsService.sendTestEmail(this.testEmailData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Email test envoyé avec succès à ${this.testEmailData.recipient_email}`
        });
        this.isSendingTest = false;
        this.closeTestEmailModal();
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'envoi du test email:', error);
        const errorMsg = error?.error?.message || error?.message || 'Erreur lors de l\'envoi du test email';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: errorMsg
        });
        this.isSendingTest = false;
      }
    });
  }
}
