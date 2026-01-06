import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css'],
  standalone: false
})
export class NewsletterComponent implements OnInit {
  newsletters: any[] = [];
  subscribers: any[] = [];
  loading: boolean = false;
  
  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadNewsletters();
  }

  loadNewsletters(): void {
    this.loading = true;
    // Load newsletters from service
    // TODO: Add service method to fetch newsletters
    this.loading = false;
  }

  exportPdf(): void {
    this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Export PDF en cours...' });
  }

  exportExcel(): void {
    this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Export Excel en cours...' });
  }

  refresh(): void {
    this.loadNewsletters();
  }
}
