// entity-disambiguation-focal-entity.component.ts
import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FocalEntityGroup, FocalEntity } from '../../../risk-mitigation/models/alert-focal-entity.model';

@Component({
  selector: 'app-entity-disambiguation-focal-entity',
  templateUrl: './entity-disambiguation-focal-entity.component.html',
  styleUrls: ['./entity-disambiguation-focal-entity.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EntityDisambiguationFocalEntityComponent implements OnInit {

  @Input() focalEntityData!: FocalEntityGroup;

  @Output() selectedEntityChange = new EventEmitter<FocalEntity | null>();
  @Output() flagQualityIssueChange = new EventEmitter<boolean>();
  @Output() markAsParentChange = new EventEmitter<FocalEntity>();

  identityTypes = ['LEI', 'FENERGO', 'CRDS'];
  selectedEntity: FocalEntity | null = null;

  // Action menu state — owned by this component
  showActionMenu = false;
  activeEntity: FocalEntity | null = null;
  menuPosition: { top: number; left: number } | null = null;

  ngOnInit() {
    if (this.focalEntityData?.focalEntities) {
      this.selectedEntity =
        this.focalEntityData.focalEntities.find(e => e.isSelected) ||
        this.focalEntityData.focalEntities[0];
      this.emitSelectedEntity();
    }
  }

  // ── Row selection ─────────────────────────────────────
  selectEntity(entity: FocalEntity) {
    if (this.focalEntityData?.focalEntities) {
      this.focalEntityData.focalEntities.forEach(e => e.isSelected = false);
      entity.isSelected = true;
      this.selectedEntity = entity;
      this.emitSelectedEntity();
    }
  }

  toggleSelection(entity: FocalEntity, event: Event) {
    event.stopPropagation();
    entity.isSelected = !entity.isSelected;
    this.selectedEntity = entity.isSelected ? entity : null;
    this.emitSelectedEntity();
  }

  // ── Select all ────────────────────────────────────────
  isAllSelected(): boolean {
    return this.focalEntityData?.focalEntities?.every(e => e.isSelected) ?? false;
  }

  toggleAllSelection(event: Event) {
    if (this.focalEntityData?.focalEntities) {
      const shouldSelect = !this.isAllSelected();
      this.focalEntityData.focalEntities.forEach(e => e.isSelected = shouldSelect);
      this.selectedEntity = shouldSelect
        ? this.focalEntityData.focalEntities[0]
        : null;
      this.emitSelectedEntity();
    }
  }

  // ── Flag quality ──────────────────────────────────────
  updateFlagQualityIssue(event: Event) {
    if (this.focalEntityData) {
      this.focalEntityData.flagQualityIssue =
        (event.target as HTMLInputElement).checked;
      this.flagQualityIssueChange.emit(this.focalEntityData.flagQualityIssue);
    }
  }

  // ── Action menu ───────────────────────────────────────
  onActionMenu(event: Event, entity: FocalEntity) {
    event.stopPropagation();
    if (this.showActionMenu && this.activeEntity?.peId === entity.peId) {
      this.closeMenu();
      return;
    }
    const button = event.target as HTMLElement;
    const rect = button.getBoundingClientRect();
    this.menuPosition = { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
    this.activeEntity = entity;
    this.showActionMenu = true;
  }

  onMarkAsParent(entity: FocalEntity, event: Event) {
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