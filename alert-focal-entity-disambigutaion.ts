// entity-disambiguation-focal-entity.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FocalEntityGroup, FocalEntity } from '../../risk-mitigation/models/alert-focal-entity.model';

@Component({
  selector: 'app-entity-disambiguation-focal-entity',
  templateUrl: './entity-disambiguation-focal-entity.component.html',
  styleUrls: ['./entity-disambiguation-focal-entity.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EntityDisambiguationFocalEntityComponent implements OnInit {

  @Input() focalEntityData!: FocalEntityGroup;
  @Output() selectedEntityChange = new EventEmitter<any>();
  @Output() flagQualityIssueChange = new EventEmitter<boolean>();

  identityTypes = ['LEI', 'FENERGO', 'CRDS'];
  selectedEntity: FocalEntity | null = null;

  ngOnInit() {
    if (this.focalEntityData?.focalEntities) {
      this.selectedEntity =
        this.focalEntityData.focalEntities.find(e => e.isSelected) ||
        this.focalEntityData.focalEntities[0];
      this.emitSelectedEntity();
    }
  }

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

  updateFlagQualityIssue(event: Event) {
    if (this.focalEntityData) {
      this.focalEntityData.flagQualityIssue =
        (event.target as HTMLInputElement).checked;
      this.flagQualityIssueChange.emit(this.focalEntityData.flagQualityIssue);
    }
  }

  isAllSelected(): boolean {
    if (this.focalEntityData?.focalEntities) {
      return this.focalEntityData.focalEntities.every(e => e.isSelected);
    }
    return false;
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

  private emitSelectedEntity() {
    this.selectedEntityChange.emit(this.selectedEntity);
  }
}