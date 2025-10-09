import { Component, OnInit } from '@angular/core';
import { SubscriberService } from '../services/subscriber.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  subscribers: any[] = [];
  pagedSubscribers: any[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  // For add/edit client modals
  name: string = '';
  email: string = '';
  customer_number: string = '';
  address: string = '';
  city: string = '';
  country: string = '';
  active: boolean = true;
  loading: boolean = false;
  iconPreview: string | null = null;
  selectedEditIconPreview: string | null = null;
  selectedClient: any = null;

  constructor(private subscriberService: SubscriberService) {}

  ngOnInit(): void {
    this.fetchSubscribers();
  }

  fetchSubscribers(): void {
    this.subscriberService.getAll().subscribe((data: any[]) => {
      this.subscribers = data;
      this.applyFilters();
    });
  }

  exportExcel() : void {

  }

  exportPdf(): void {
  }

  applyFilters(): void {
    let filtered = this.subscribers;

    // Filter by status
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(s => s.validated_account);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(s => !s.validated_account);
    }

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        (s.last_name && s.last_name.toLowerCase().includes(term)) ||
        (s.first_name && s.first_name.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.customer_number && s.customer_number.toLowerCase().includes(term))
      );
    }

    // Pagination
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    this.totalPagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedSubscribers = filtered.slice(start, start + this.pageSize);
  }

  onPageSizeChange(event: any): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  // Add client logic
  addClient(): void {
    this.loading = true;
    const newClient = {
      name: this.name,
      email: this.email,
      customer_number: this.customer_number,
      address: this.address,
      city: this.city,
      country: this.country,
      active: this.active
      // add other fields as needed
    };
    // Call service to add client, then refresh list
    // this.subscriberService.add(newClient).subscribe(() => {
    //   this.fetchSubscribers();
    //   this.loading = false;
    // });
    this.loading = false;
  }

  // Edit client logic
  updateClient(): void {
    if (!this.selectedClient) return;
    this.loading = true;
    // Call service to update client, then refresh list
    // this.subscriberService.update(this.selectedClient).subscribe(() => {
    //   this.fetchSubscribers();
    //   this.loading = false;
    // });
    this.loading = false;
  }

  // Delete client logic
  confirmDeleteClient(): void {
    if (!this.selectedClient) return;
    this.loading = true;
    // Call service to delete client, then refresh list
    // this.subscriberService.delete(this.selectedClient.id).subscribe(() => {
    //   this.fetchSubscribers();
    //   this.loading = false;
    // });
    this.loading = false;
  }

  // For edit modal
  onEditClient(client: any): void {
    this.selectedClient = { ...client };
    // Optionally set selectedEditIconPreview
  }

  // Image upload logic
  onIconFileChange(event: any): void {
    // handle image preview for add modal
    // ...existing code...
  }
  onEditIconFileChange(event: any): void {
    // handle image preview for edit modal
    // ...existing code...
  }
}
