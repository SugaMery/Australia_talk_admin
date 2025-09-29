import { Component, OnInit, Renderer2 } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { MediaService } from '../services/media.service';
import { environment } from '../environments/environment';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit {
  name: string = '';
  slug: string = '';
  iconFile: File | null = null;
  parent_id?: number;
  type: 'Free' | 'Paid' = 'Free';
  active: boolean = true;
  cart_order?: number;
  model: string = '';
  loading: boolean = false;
  iconPreview: string | ArrayBuffer | null = null; // New property for preview
  categories: any[] = [];
  fallbackImage: string = 'assets/default-category.png'; // Add a fallback image path
  currentPage: number = 1;
  pageSize: number = 10; // 10 éléments par page
  searchTerm: string = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  selectedCategory: any = null;
  selectedEditIconFile: File | null = null;
  selectedEditIconPreview: string | ArrayBuffer | null = null;
  previousEditIconId: number | null = null;
  categoryToDelete: any = null;

  get filteredCategories(): any[] {
    let filtered = this.categories;
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(cat => !!cat.active);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(cat => !cat.active);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        (cat.name && cat.name.toLowerCase().includes(term)) ||
        (cat.slug && cat.slug.toLowerCase().includes(term)) ||
        (cat.type && cat.type.toLowerCase().includes(term))
      );
    }
    return filtered;
  }

  get pagedCategories(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCategories.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.pageSize) || 1;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  constructor(
    private categoryService: CategoryService,
    private mediaService: MediaService,
    private renderer: Renderer2 // Inject Renderer2
  ) {}

  ngOnInit() {
    this.fetchCategories();
    //this.loadScripts(); // Load external JS files
  }

  fetchCategories() {
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories = cats;
        console.log('Fetched categories:', cats);
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });
  }

  private loadScripts() {
    const scripts = [
      'assets/js/jquery-3.7.1.min.js',
      'assets/js/feather.min.js',
      'assets/js/jquery.slimscroll.min.js',
      'assets/js/jquery.dataTables.min.js',
      'assets/js/dataTables.bootstrap5.min.js',
      'assets/js/bootstrap.bundle.min.js',
      'https://cdn.jsdelivr.net/npm/apexcharts@3.41.0/dist/apexcharts.min.js',
      'assets/plugins/apexchart/chart-data.js',
      'assets/js/moment.min.js',
      'assets/plugins/daterangepicker/daterangepicker.js',
      'assets/plugins/jvectormap/jquery-jvectormap-2.0.5.min.js',
      'assets/plugins/jvectormap/jquery-jvectormap-world-mill.js',
      'assets/plugins/jvectormap/jquery-jvectormap-ru-mill.js',
      'assets/plugins/jvectormap/jquery-jvectormap-us-aea.js',
      'assets/plugins/jvectormap/jquery-jvectormap-uk_countries-mill.js',
      'assets/plugins/jvectormap/jquery-jvectormap-in-mill.js',
      'assets/js/jvectormap.js',
      'assets/plugins/@simonwep/pickr/pickr.es5.min.js',
      'assets/js/theme-colorpicker.js',
      'assets/js/script.js'
    ];
    scripts.forEach(src => {
      const script = this.renderer.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = false;
      this.renderer.appendChild(document.body, script);
    });
  }

  onIconFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.iconFile = null;
        this.iconPreview = null;
        console.log('Invalid file type or size exceeds 2MB');
        return;
      }
      this.iconFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.iconPreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
      console.log('iconFile set:', this.iconFile);
    } else {
      this.iconFile = null;
      this.iconPreview = null;
      console.log('iconFile cleared');
    }
  }

  getImageUrl(cat: any): string {
    if (!cat.path) return this.fallbackImage;
    // Use your backend URL for images
    // Remove local path and use API url
    const filename = cat.filename || cat.path.split('\\').pop();
    return `${environment.apiUrl}/uploads/${filename}`;
  }

  onImageError(event: any) {
    event.target.src = this.fallbackImage;
    console.log('Image failed to load, fallback used.');
  }

  async addCategory() {
    this.loading = true;
    let icon_id: number | undefined = undefined;

    if (this.iconFile) {
      try {
        // Upload image and get id
        const formData = new FormData();
        formData.append('file', this.iconFile);
        const mediaResp: any = await this.mediaService.upload(formData).toPromise();
        icon_id = mediaResp.id;
      } catch (err) {
        this.loading = false;
        console.log('Image upload failed:', err);
        return;
      }
    }

    // Ensure boolean for active (fix for always 1 in DB)
    const payload: any = {
      name: this.name,
      type: this.type,
      parent_id: this.parent_id,
      active: !!this.active, // force boolean
      icon_id: icon_id
    };

    console.log('Submitting payload:', payload);
    this.categoryService.create(payload).subscribe({
      next: (category) => {
        this.loading = false;
        this.resetForm();
        // Refresh categories to get latest image and data
        this.fetchCategories();
        // Close modal
        const modal = document.getElementById('add-category');
        if (modal) {
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  private resetForm() {
    this.name = '';
    this.slug = '';
    this.iconFile = null;
    this.iconPreview = null;
    this.parent_id = undefined;
    this.type = 'Free';
    this.active = true;
    this.cart_order = undefined;
    this.model = '';
  }

  // Remplacez le texte du statut par du français
  getStatusText(cat: any): string {
    return cat.active ? 'Active' : 'Inactive'; // Pour le français, utilisez 'Active'/'Inactive' ou 'Actif'/'Inactif'
  }

  onEditCategory(cat: any) {
    // Create a shallow copy to avoid two-way binding issues until save
    this.selectedCategory = { ...cat };
    this.selectedEditIconFile = null;
    this.selectedEditIconPreview = null;
    this.previousEditIconId = cat.icon_id || null;
    // Optionally, fetch image preview if needed
    if (cat.path) {
      const filename = cat.filename || cat.path.split('\\').pop();
      this.selectedEditIconPreview = `${environment.apiUrl}/uploads/${filename}`;
    } else {
      this.selectedEditIconPreview = this.fallbackImage;
    }
  }

  onEditIconFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        this.selectedEditIconFile = null;
        this.selectedEditIconPreview = null;
        console.log('Invalid file type or size exceeds 2MB');
        return;
      }
      this.selectedEditIconFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedEditIconPreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedEditIconFile = null;
      this.selectedEditIconPreview = null;
    }
  }

  async updateCategory() {
    if (!this.selectedCategory) return;
    let icon_id = this.selectedCategory.icon_id;

    // If a new image is selected, upload it and delete the old one
    if (this.selectedEditIconFile) {
      try {
        const formData = new FormData();
        formData.append('file', this.selectedEditIconFile);
        const mediaResp: any = await this.mediaService.upload(formData).toPromise();
        icon_id = mediaResp.id;

        if (this.previousEditIconId && this.previousEditIconId !== icon_id) {
          this.mediaService.delete(this.previousEditIconId).subscribe({
            next: () => {},
            error: (err) => { console.log('Failed to delete previous media:', err); }
          });
        }
      } catch (err) {
        console.log('Image upload failed:', err);
        return;
      }
    }

    // Ensure boolean for active (fix for always 1 in DB)
    const payload: any = {
      ...this.selectedCategory,
      icon_id: icon_id,
      active: !!this.selectedCategory.active // force boolean
    };

    // Update backend
    this.categoryService.update(this.selectedCategory.id, payload).subscribe({
      next: (updatedCat) => {
        // Refresh categories to get latest image and data
        this.fetchCategories();
        // Close modal (Bootstrap way)
        (window as any).$(`#edit-category`).modal('hide');
        this.selectedCategory = null;
        this.selectedEditIconFile = null;
        this.selectedEditIconPreview = null;
        this.previousEditIconId = null;
      },
      error: (err) => {
        console.log('Update failed:', err);
      }
    });
  }

  onDeleteCategory(cat: any) {
    this.categoryToDelete = cat;
  }

  confirmDeleteCategory() {
    if (!this.categoryToDelete) return;
    this.categoryService.delete(this.categoryToDelete.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((c: any) => c.id !== this.categoryToDelete.id);
        // Close modal (Bootstrap way)
        (window as any).$(`#delete-modal`).modal('hide');
        this.categoryToDelete = null;
      },
      error: (err) => {
        console.error('Failed to delete category:', err);
        // Optionally close modal or show error
      }
    });
  }

  exportExcel() {
    const data = this.filteredCategories.map(cat => ({
      'Nom': cat.name,
      'Slug': cat.slug,
      'Type': cat.type === 'Free' ? 'Gratuit' : 'Payant',
      'Créé le': cat.created_at,
      'Statut': cat.active ? 'Active' : 'Inactive'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catégories');
    XLSX.writeFile(workbook, 'categories.xlsx');
  }

  exportPdf() {
    const doc = new jsPDF();
    const columns = ['Nom', 'Slug', 'Type', 'Créé le', 'Statut'];
    const rows = this.filteredCategories.map(cat => [
      cat.name,
      cat.slug,
      cat.type === 'Free' ? 'Gratuit' : 'Payant',
      cat.created_at,
      cat.active ? 'Active' : 'Inactive'
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('categories.pdf');
  }
}