import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-create-newsletter',
  templateUrl: './create-newsletter.component.html',
  styleUrls: ['./create-newsletter.component.css'],
  standalone: false
})
export class CreateNewsletterComponent implements OnInit {
  newsletter: any = {
    title: '',
    subject: '',
    content: '',
    recipients: [],
    status: 'draft',
    scheduled_date: null
  };

  loading: boolean = false;
  recipientOptions: any[] = [];

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadRecipients();
  }

  loadRecipients(): void {
    // TODO: Load recipients from service
    this.recipientOptions = [
      { label: 'Tous les abonnés', value: 'all' },
      { label: 'Abonnés actifs', value: 'active' },
      { label: 'Segment 1', value: 'segment1' }
    ];
  }

  saveNewsletter(): void {
    if (!this.newsletter.title || !this.newsletter.subject || !this.newsletter.content) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: 'Veuillez remplir tous les champs requis' 
      });
      return;
    }

    this.loading = true;
    
    // TODO: Call service to save newsletter
    setTimeout(() => {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Succès', 
        detail: 'Newsletter créée avec succès' 
      });
      this.loading = false;
      this.resetForm();
    }, 1000);
  }

  resetForm(): void {
    this.newsletter = {
      title: '',
      subject: '',
      content: '',
      recipients: [],
      status: 'draft',
      scheduled_date: null
    };
  }

  sendPreview(): void {
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Aperçu', 
      detail: 'Email d\'aperçu envoyé à votre adresse' 
    });
  }
}
