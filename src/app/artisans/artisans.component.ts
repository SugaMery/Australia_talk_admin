import { Component, OnInit } from '@angular/core';
import { ArtisanService } from '../services/artisan.service'; // adjust path as needed
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-artisans',
  templateUrl: './artisans.component.html',
  styleUrls: ['./artisans.component.css'],
  providers: [MessageService]
})
export class ArtisansComponent implements OnInit {
  artisans: any[] = [];
  officers: any[] = [];
  filteredList: any[] = [];
  allArtisans: any[] = []; // Store the full filtered list before pagination
  searchTerm: string = '';
  filter: string = '';
  selectAll: boolean = false;

  addModel: any = {};
  editModel: any = {};
  deleteTarget: any = null;

  franceCities: string[] = [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille',
    'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne',
    'Saint-Denis', 'Aix-en-Provence', 'Le Mans', 'Clermont-Ferrand', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy',
    'Perpignan', 'Boulogne-Billancourt', 'Metz', 'Besançon', 'Orléans', 'Saint-Denis', 'Argenteuil', 'Rouen', 'Montreuil',
    'Mulhouse', 'Caen', 'Nancy', 'Saint-Paul', 'Roubaix', 'Tourcoing', 'Nanterre', 'Avignon', 'Vitry-sur-Seine', 'Créteil',
    'Poitiers', 'Aubervilliers', 'Asnières-sur-Seine', 'Versailles', 'Colombes', 'Aulnay-sous-Bois', 'Saint-Pierre',
    'Rueil-Malmaison', 'Pau', 'Courbevoie', 'La Rochelle', 'Antibes', 'Calais', 'Saint-Maur-des-Fossés', 'Champigny-sur-Marne',
    'Béziers', 'Cannes', 'Mérignac', 'Drancy', 'Ajaccio', 'Noisy-le-Grand', 'Colmar', 'Issy-les-Moulineaux', 'Levallois-Perret',
    'Quimper', 'La Seyne-sur-Mer', 'Villeneuve-d\'Ascq', 'Valence', 'Antony', 'Troyes', 'Neuilly-sur-Seine', 'Cergy',
    'Pessac', 'Ivry-sur-Seine', 'Clichy', 'Le Blanc-Mesnil', 'Lorient', 'Niort', 'Sarcelles', 'Chambéry', 'Montauban',
    'Pantin', 'Épinay-sur-Seine', 'Maisons-Alfort', 'Meaux', 'Narbonne', 'Cholet', 'Hyères', 'Évry-Courcouronnes'
  ];

  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  constructor(
    private artisanService: ArtisanService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.artisanService.getAll().subscribe(artisans => {
      this.artisans = artisans.map((a: any) => ({ ...a, type: 'artisan', selected: false }));
      this.refreshList();
    });
/*     this.artisanService.getAllOfficers().subscribe(officers => {
      this.officers = officers.map((o: any) => ({ ...o, type: 'officer', selected: false }));
      this.updateFilteredList();
    }); */
  }

  refreshList() {
    let list = [...this.artisans, ...this.officers];
    if (this.filter) {
      list = list.filter(p => (p.status || '').toLowerCase() === this.filter);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.first_name && p.first_name.toLowerCase().includes(term)) ||
        (p.last_name && p.last_name.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.phone && p.phone.toLowerCase().includes(term)) ||
        (p.city && p.city.toLowerCase().includes(term))
      );
    }
    this.allArtisans = list;
    this.updatePagination();
  }

  updateFilteredList() {
    this.refreshList();
  }

  onSearch() {
    this.refreshList();
    this.currentPage = 1;
  }

  filterStatus(status: string) {
    this.filter = status;
    this.refreshList();
    this.currentPage = 1;
  }

  toggleSelectAll() {
    this.filteredList.forEach(p => p.selected = this.selectAll);
  }

  viewPerson(person: any) {
    // Not used in UI, but can be implemented if needed
    console.log('View', person);
  }

  editPerson(person: any) {
    // Deep copy to avoid two-way binding issues
    console.log('Edit', person);
    this.editModel = { ...person };
  }

  deletePerson(person: any) {
    // Implement delete logic or open modal
    this.confirmDelete(person);
  }

  confirmDelete(person: any) {
    this.deleteTarget = person;
  }

  deleteArtisan() {
    if (!this.deleteTarget) return;
    console.log('Delete', this.deleteTarget);
    this.artisanService.delete(this.deleteTarget.id).subscribe({
      next: () => {
      console.log('Delete success');
      
      this.messageService.add({severity:'success', summary:'Succès', detail:'Artisan supprimé avec succès'});
      this.refresh();
      this.deleteTarget = null;
      const modal = document.getElementById('delete-modal');
      if (modal) {
        (window as any).bootstrap.Modal.getInstance(modal)?.hide();
      }
      },
      error: (err) => {
      this.messageService.add({severity:'error', summary:'Erreur', detail:"Erreur lors de la suppression de l'artisan"});
      console.error('Erreur lors de la suppression de l\'artisan:', err);
      }
    });
  }

  exportPdf() {
    const doc = new jsPDF();
    const columns = [
      'Nom', 'Prénom', 'Nom de famille', 'Email', 'Téléphone', 
      'Ville'
    ];
    const rows = this.filteredList.map(artisan => [
      artisan.name || (artisan.first_name + ' ' + artisan.last_name),
      artisan.first_name || '',
      artisan.last_name || '',
      artisan.email || '',
      artisan.phone || '',
      artisan.phone_2 || '',
      artisan.city || '',
      artisan.postal_code || '',
      artisan.address || '',
      artisan.address_rest || '',
      artisan.status === 'active' ? 'Actif' : artisan.status === 'blacklisted' ? 'Bloqué' : 'Inactif'
    ]);
    autoTable(doc, {
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save('artisans.pdf');
  }

  exportExcel() {
    const data = this.filteredList.map(artisan => ({
      'Nom': artisan.name || (artisan.first_name + ' ' + artisan.last_name),
      'Prénom': artisan.first_name || '',
      'Nom de famille': artisan.last_name || '',
      'Email': artisan.email || '',
      'Téléphone': artisan.phone || '',
      'Téléphone 2': artisan.phone_2 || '',
      'Ville': artisan.city || '',
      'Code Postal': artisan.postal_code || '',
      'Adresse': artisan.address || '',
      'Adresse (complément)': artisan.address_rest || '',
      'Statut': artisan.status === 'active' ? 'Actif' : artisan.status === 'blacklisted' ? 'Bloqué' : 'Inactif'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Artisans');
    XLSX.writeFile(workbook, 'artisans.xlsx');
  }

  refresh() {
    this.loadData();
  }

  addArtisan() {
    // Nettoyage des champs optionnels pour respecter l'API
    if (!this.addModel.phone_2 || this.addModel.phone_2.trim() === '') {
      delete this.addModel.phone_2;
    }
    if (!this.addModel.email_2 || this.addModel.email_2.trim() === '') {
      delete this.addModel.email_2;
    }

    // Correction du statut si besoin
    if (!this.addModel.status || (this.addModel.status !== 'active' && this.addModel.status !== 'blacklisted')) {
      this.addModel.status = 'active';
    }

    this.artisanService.create(this.addModel).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Succès', detail:'Artisan ajouté avec succès'});
        this.refresh();
        // Fermer le modal après ajout
        const modal: any = document.getElementById('add-artisan');
        if (modal) {
          (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();
        }
        this.addModel = {};
      },
      error: (err) => {
        if (err?.status === 500) {
          this.messageService.add({severity:'error', summary:'Erreur', detail:"Erreur interne du serveur. Veuillez réessayer plus tard ou contacter l'administrateur."});
        } else if (err?.error?.errors && Array.isArray(err.error.errors)) {
          const messages = err.error.errors.map((e: any) => e.msg).join(', ');
          this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de l\'ajout de l\'artisan: ' + messages});
        } else {
          this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de l\'ajout de l\'artisan'});
        }
      }
    });
  }

  updateArtisan() {
    if (!this.editModel || !this.editModel.id) return;

    if (!this.editModel.phone_2 || this.editModel.phone_2.trim() === '') {
      delete this.editModel.phone_2;
    }
    if (!this.editModel.email_2 || this.editModel.email_2.trim() === '') {
      delete this.editModel.email_2;
    }

    console.log('Update Artisan', this.editModel);

    this.artisanService.update(this.editModel.id, this.editModel).subscribe({
      next: (updated) => {
        this.messageService.add({severity:'success', summary:'Succès', detail:'Artisan mis à jour avec succès'});
        this.refresh();
        const modal: any = document.getElementById('edit-artisan');
        if (modal) {
          (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();
        }
      },
      error: (err) => {
        if (err?.status === 500) {
          this.messageService.add({severity:'error', summary:'Erreur', detail:"Erreur interne du serveur. Veuillez réessayer plus tard ou contacter l'administrateur."});
        } else if (err?.error?.errors && Array.isArray(err.error.errors)) {
          const messages = err.error.errors.map((e: any) => e.msg).join(', ');
          this.messageService.add({severity:'error', summary:'Erreur', detail:'Erreur lors de la mise à jour de l\'artisan: ' + messages});
        } else {
          console.error('Erreur lors de la mise à jour de l\'artisan:', err);
        }
      }
    });
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
    const totalItems = this.allArtisans.length;
    this.totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    this.totalPagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredList = this.allArtisans.slice(start, end);
  }
}

