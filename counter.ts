// entity-disambiguation-counter-party.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CounterPartyGroup, CounterParty } from '../../risk-mitigation/models/counter-party.model';

@Component({
  selector: 'app-entity-disambiguation-counter-party',
  templateUrl: './entity-disambiguation-counter-party.component.html',
  styleUrls: ['./entity-disambiguation-counter-party.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EntityDisambiguationCounterPartyComponent implements OnInit, OnChanges {

  @Input() counterPartyData!: CounterPartyGroup;
  @Input() parentOptions: { value: string; label: string }[] = [];
  @Input() selectedDataKey: string = '';

  @Output() selectedEntityChange = new EventEmitter<CounterParty | null>();
  @Output() markAsParentChange = new EventEmitter<CounterParty>();
  @Output() parentKeyChange = new EventEmitter<string>();

  identityTypes = ['LEI', 'FENERGO', 'CRDS'];
  selectedEntity: CounterParty | null = null;
  selectedParentKey: string = '';
  selectedParentPeId: string = '';

  // Action menu state
  showActionMenu = false;
  activeEntity: CounterParty | null = null;
  menuPosition: { top: number; left: number } | null = null;

  ngOnInit() {
    this.selectedParentKey = this.selectedDataKey;
    this.updateParentPeId();
    if (this.counterPartyData?.counterParties) {
      this.selectedEntity =
        this.counterPartyData.counterParties.find(e => e.isSelected) ||
        this.counterPartyData.counterParties[0];
      this.emitSelectedEntity();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDataKey']) {
      this.selectedParentKey = this.selectedDataKey;
      this.updateParentPeId();
    }
  }

  private updateParentPeId() {
    // Show the PE ID of the selected parent below the dropdown
    const selected = this.parentOptions.find(o => o.value === this.selectedParentKey);
    this.selectedParentPeId = this.counterPartyData?.parentPeId || '';
  }

  onParentChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedParentKey = value;
    this.parentKeyChange.emit(value);
  }

  // ── Row selection ─────────────────────────────────────
  selectEntity(entity: CounterParty) {
    if (this.counterPartyData?.counterParties) {
      this.counterPartyData.counterParties.forEach(e => e.isSelected = false);
      entity.isSelected = true;
      this.selectedEntity = entity;
      this.emitSelectedEntity();
    }
  }

  toggleSelection(entity: CounterParty, event: Event) {
    event.stopPropagation();
    entity.isSelected = !entity.isSelected;
    this.selectedEntity = entity.isSelected ? entity : null;
    this.emitSelectedEntity();
  }

  // ── Select all ────────────────────────────────────────
  isAllSelected(): boolean {
    return this.counterPartyData?.counterParties?.every(e => e.isSelected) ?? false;
  }

  toggleAllSelection(event: Event) {
    if (this.counterPartyData?.counterParties) {
      const shouldSelect = !this.isAllSelected();
      this.counterPartyData.counterParties.forEach(e => e.isSelected = shouldSelect);
      this.selectedEntity = shouldSelect
        ? this.counterPartyData.counterParties[0]
        : null;
      this.emitSelectedEntity();
    }
  }

  // ── Action menu ───────────────────────────────────────
  onActionMenu(event: Event, entity: CounterParty) {
    event.stopPropagation();
    if (this.showActionMenu && this.activeEntity?.peId === entity.peId) {
      this.closeMenu();
      return;
    }
    const button = event.target as HTMLElement;
    const rect = button.getBoundingClientRect();
    this.menuPosition = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    };
    this.activeEntity = entity;
    this.showActionMenu = true;
  }

  onMarkAsParent(entity: CounterParty, event: Event) {
    event.stopPropagation();
    this.markAsParentChange.emit(entity);
    this.closeMenu();
  }

  closeMenu() {
    this.showActionMenu = false;
    this.activeEntity = null;
    this.menuPosition = null;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeMenu();
  }

  // ── Emit ──────────────────────────────────────────────
  private emitSelectedEntity() {
    this.selectedEntityChange.emit(this.selectedEntity);
  }
}