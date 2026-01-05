import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EmailTemplatesService } from '../services/email-templates.service';

@Component({
  selector: 'app-email-templates',
  templateUrl: './email-templates.component.html',
  styleUrls: ['./email-templates.component.css'],
  providers: [MessageService]
})
export class EmailTemplatesComponent implements OnInit {
  emailTemplates: any[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  showModal: boolean = false;
  showPreviewModal: boolean = false;
  isEditing: boolean = false;

  selectedTemplate: any = null;
  previewTemplate: any = null;

  newTemplate: any = {
    template_name: '',
    template_slug: '',
    subject: '',
    body: '',
    variables: '',
    description: '',
    is_default: 0,
    active: 1
  };

  constructor(
    private messageService: MessageService,
    private emailTemplatesService: EmailTemplatesService
  ) {}

  ngOnInit(): void {
    this.loadEmailTemplates();
  }

  loadEmailTemplates(): void {
    this.isLoading = true;
    this.emailTemplatesService.getEmailTemplates().subscribe({
      next: (templates: any[]) => {
        this.emailTemplates = templates.map(t => ({
          ...t,
          is_default: t.is_default === 1 || t.is_default === true,
          active: t.active === 1 || t.active === true
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erreur lors du chargement des templates:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des templates'
        });
      }
    });
  }

  openNewTemplateModal(): void {
    this.isEditing = false;
    this.newTemplate = {
      template_name: '',
      template_slug: '',
      subject: '',
      body: '',
      variables: '',
      description: '',
      is_default: 0,
      active: 1
    };
    this.showModal = true;
  }

  openEditTemplateModal(template: any): void {
    this.isEditing = true;
    this.selectedTemplate = template;
    this.newTemplate = {
      ...template,
      is_default: template.is_default === 1 || template.is_default === true,
      active: template.active === 1 || template.active === true
    };
    this.showModal = true;
  }

  closeTemplateModal(): void {
    this.showModal = false;
    this.selectedTemplate = null;
    this.newTemplate = {
      template_name: '',
      template_slug: '',
      subject: '',
      body: '',
      variables: '',
      description: '',
      is_default: 0,
      active: 1
    };
  }

  saveTemplate(): void {
    if (!this.newTemplate.template_name?.trim() || !this.newTemplate.template_slug?.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Le nom et le slug du template sont requis'
      });
      return;
    }

    this.isSaving = true;

    // Convert boolean to 0/1 for API
    const templateToSave = {
      ...this.newTemplate,
      is_default: this.newTemplate.is_default ? 1 : 0,
      active: this.newTemplate.active ? 1 : 0
    };

    if (this.isEditing && this.selectedTemplate) {
      this.emailTemplatesService.updateEmailTemplate(this.selectedTemplate.id, templateToSave).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Template mis à jour avec succès'
          });
          this.isSaving = false;
          this.closeTemplateModal();
          this.loadEmailTemplates();
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour:', error);
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la mise à jour';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
          this.isSaving = false;
        }
      });
    } else {
      this.emailTemplatesService.createEmailTemplate(templateToSave).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Template créé avec succès'
          });
          this.isSaving = false;
          this.closeTemplateModal();
          this.loadEmailTemplates();
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

  openPreviewTemplate(template: any): void {
    this.previewTemplate = template;
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewTemplate = null;
  }

  deleteTemplate(template: any): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template?')) {
      this.emailTemplatesService.deleteEmailTemplate(template.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Template supprimé avec succès'
          });
          this.loadEmailTemplates();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
          const errorMsg = error?.error?.message || error?.message || 'Erreur lors de la suppression';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMsg
          });
        }
      });
    }
  }

  toggleActive(template: any): void {
    const newActiveValue = template.active ? 0 : 1;
    const updated = { ...template, active: newActiveValue };
    this.emailTemplatesService.updateEmailTemplate(template.id, updated).subscribe({
      next: () => {
        template.active = newActiveValue;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Template mis à jour'
        });
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la mise à jour'
        });
      }
    });
  }

  getActiveTemplatesCount(): number {
    return this.emailTemplates.filter(t => t.active).length;
  }

  getDefaultTemplatesCount(): number {
    return this.emailTemplates.filter(t => t.is_default).length;
  }
}
