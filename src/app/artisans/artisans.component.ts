import { Component, OnInit } from '@angular/core';
import { ArtisanService } from '../services/artisan.service'; // adjust path as needed

@Component({
  selector: 'app-artisans',
  templateUrl: './artisans.component.html',
  styleUrls: ['./artisans.component.css']
})
export class ArtisansComponent implements OnInit {
  artisans: any[] = [];
  officers: any[] = [];
  filteredList: any[] = [];
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

  constructor(private artisanService: ArtisanService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.artisanService.getAll().subscribe(artisans => {
      this.artisans = artisans.map((a: any) => ({ ...a, type: 'artisan', selected: false }));
      this.updateFilteredList();
    });
/*     this.artisanService.getAllOfficers().subscribe(officers => {
      this.officers = officers.map((o: any) => ({ ...o, type: 'officer', selected: false }));
      this.updateFilteredList();
    }); */
  }

  updateFilteredList() {
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
    this.filteredList = list;
  }

  onSearch() {
    this.updateFilteredList();
  }

  filterStatus(status: string) {
    this.filter = status;
    this.updateFilteredList();
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
    // Call your service to delete the artisan, then refresh the list
    // Example:
    // this.artisanService.deleteArtisan(this.deleteTarget.id).subscribe(() => this.refresh());
    // For now, just remove from local array for demo:
    this.artisans = this.artisans.filter(a => a.id !== this.deleteTarget.id);
    this.updateFilteredList();
    this.deleteTarget = null;
    // Hide modal manually if needed (Bootstrap 5)
    const modal = document.getElementById('delete-modal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal)?.hide();
    }
  }

  exportPdf() {
    // Implement PDF export logic
    console.log('Export PDF');
  }

  exportExcel() {
    // Implement Excel export logic
    console.log('Export Excel');
  }

  refresh() {
    this.loadData();
  }

  addArtisan() {
    // Implement add logic (call service, then refresh)
    // Example:
    // this.artisanService.addArtisan(this.addModel).subscribe(() => this.refresh());
    console.log('Add Artisan', this.addModel);
  }

  updateArtisan() {
    // Implement update logic (call service, then refresh)
    // Example:
    // this.artisanService.updateArtisan(this.editModel).subscribe(() => this.refresh());
    console.log('Update Artisan', this.editModel);
  }
}
