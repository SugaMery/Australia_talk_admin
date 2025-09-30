import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TagService } from '../services/tag.service';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css']
})
export class TagsComponent implements OnInit {
  name: string = '';
  slug: string = '';
  loading: boolean = false;
  active: boolean = false; // <-- Add this line

  tags: any[] = [];
  pagedTags: any[] = [];
  filteredTags: any[] = [];

  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  selectedTag: any = null;
  tagToDelete: any = null;

  private _searchTerm: string = '';
  private _statusFilter: string = 'all';

  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.applyFilters();
  }

  get statusFilter(): string {
    return this._statusFilter;
  }
  set statusFilter(val: string) {
    this._statusFilter = val;
    this.applyFilters();
  }

  constructor(
    private tagService: TagService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.fetchTags();
  }

  fetchTags() {
    this.tagService.getAll().subscribe({
      next: (tags) => {
        this.tags = tags;
        this.applyFilters();
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors du chargement des tags'});
      }
    });
  }

  applyFilters() {
    this.filteredTags = this.tags.filter(tag => {
      const matchesSearch = !this._searchTerm || tag.name?.toLowerCase().includes(this._searchTerm.toLowerCase());
      const matchesStatus =
        this._statusFilter === 'all' ||
        (this._statusFilter === 'active' && tag.active) ||
        (this._statusFilter === 'inactive' && !tag.active);
      return matchesSearch && matchesStatus;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageSizeChange(event: any) {
    this.pageSize = +event.target.value || this.pageSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  updatePagination() {
    const totalItems = this.filteredTags.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.totalPagesArray = Array(this.totalPages).fill(0).map((_, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedTags = this.filteredTags.slice(start, end);
  }

  async addTag() {
    this.loading = true;
    const payload: any = {
      name: this.name,
      active: this.active == false ? 0 : 1,
    };
    console.log("Payload:", payload);
    this.tagService.create(payload).subscribe({
      next: (tag) => {
        this.loading = false;
        this.resetForm();
        this.fetchTags();
        this.messageService.add({severity:'success', summary:'Succès', detail:'Tag ajouté avec succès'});
        const modal = document.getElementById('add-tag');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error("Error adding tag:", err , err == "Error: Slug already exists");
        if ( err == "Error: Slug already exists") {
          this.messageService.add({severity:'error', summary:'Erreur', detail:'Ce tag existe déjà.'});
        } else {
          this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de l\'ajout du tag'});
        }
      }
    });
  }
  updateTag() {
    if (!this.selectedTag) return;
    const payload: any = {
      name: this.selectedTag.name,
      active: this.selectedTag.active == false ? 0 : 1,
    };
    console.log("Payload:", payload , this.selectedTag.active);
    this.tagService.update(this.selectedTag.id, payload).subscribe({
      next: () => {
        this.fetchTags();
        this.messageService.add({severity:'success', summary:'Succès', detail:'Tag mis à jour avec succès'});
        const modal = document.getElementById('edit-tag');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
        this.selectedTag = null;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la mise à jour du tag'});
      }
    });
  }
  private resetForm() {
    this.name = '';
    this.active = false; // <-- Reset active as well
  }

  onEditTag(tag: any) {
    this.selectedTag = { ...tag };
  }



  onDeleteTag(tag: any) {
    this.tagToDelete = tag;
  }

  confirmDeleteTag() {
    if (!this.tagToDelete) return;
    this.tagService.delete(this.tagToDelete.id).subscribe({
      next: () => {
        this.tags = this.tags.filter((t: any) => t.id !== this.tagToDelete.id);
        this.messageService.add({severity:'success', summary:'Succès', detail:'Tag supprimé avec succès'});
        const modal = document.getElementById('delete-modal');
        if (modal && (window as any).bootstrap) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bsModal.hide();
        }
        this.tagToDelete = null;
      },
      error: () => {
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la suppression du tag'});
      }
    });
  }

  exportExcel() {
    const data = this.filteredTags.map(tag => ({
      'Nom': tag.name,
      'Slug': tag.slug
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tags');
    XLSX.writeFile(workbook, 'tags.xlsx');
  }

  exportPdf() {
    const doc = new jsPDF();
    const columns = ['Nom', 'Slug'];
    const rows = this.filteredTags.map(tag => [
      tag.name,
      tag.slug
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('tags.pdf');
  }
}


