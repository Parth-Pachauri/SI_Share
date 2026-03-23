// alert-entity-disambiguation.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { FOCAL_ENTITY_MOCK_DATA } from '../risk-mitigation/mock-service-response/focal-entity-mock-response';
import { COUNTER_PARTY_MOCK_DATA } from '../risk-mitigation/mock-service-response/counter-party-mock-response';
import { FocalEntityGroup, FocalEntity } from '../risk-mitigation/models/alert-focal-entity.model';
import { CounterPartyGroup, CounterParty } from '../risk-mitigation/models/counter-party.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityDisambiguationService } from '../services/entity-disambiguation.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { EntityDisambiguationFocalEntityComponent } from './entity-disambiguation-focal-entity/entity-disambiguation-focal-entity.component';
import { EntityDisambiguationCounterPartyComponent } from './entity-disambiguation-counter-party/entity-disambiguation-counter-party.component';

@Component({
  selector: 'app-alert-entity-disambiguation',
  templateUrl: './alert-entity-disambiguation.component.html',
  styleUrls: ['./alert-entity-disambiguation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EntityDisambiguationFocalEntityComponent,
    EntityDisambiguationCounterPartyComponent
  ]
})
export class AlertEntityDisambiguationComponent implements OnInit {

  activeTab: 'focal' | 'counter' = 'focal';
  selectedDataKey: string = 'KRAMP';
  parentOptions = [
    { value: 'KRAMP', label: 'KRAMP GROEP B.V.' },
    { value: 'WALTERSCHEID', label: 'WALTERSCHEID GmbH' },
    // { value: 'WALTERSCHEID2', label: 'WALTERSCHEID S.P.A.' },
    // { value: 'WALTERSCHEID3', label: 'WALTERSCHEID S.A.' }
  ];

  // Mock data with proper typing
  focalEntityData: { [key: string]: FocalEntityGroup } = FOCAL_ENTITY_MOCK_DATA;
  counterPartyData: { [key: string]: CounterPartyGroup } = COUNTER_PARTY_MOCK_DATA;

  // Selected entities as arrays to support multiple selection
  selectedFocalEntities: FocalEntity[] = [];
  selectedCounterParties: CounterParty[] = [];

  // Action menu state
  showActionMenu: { [key: string]: boolean } = {};
  currentActionEntity: any = null;
  currentActionType: 'focal' | 'counter' | null = null;
  actionMenuPosition: { top: number, left: number } | null = null;
  currentParent: { type: 'focal' | 'counter', id: string, name: string } | null = null;
  private originalValues: { [key: string]: any } = {};
  private changedEntities: any[] = [];
  currentAlertId: string = '';

  constructor(
    private entityDisambiguationService: EntityDisambiguationService,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadDefaultFocalEntity();
    this.storeOriginalValues();
    const urlParts = window.location.pathname.split('/');
    this.currentAlertId = urlParts[2] || '';
  }

  private storeOriginalValues() {
    Object.keys(this.focalEntityData).forEach(key => {
      (this.originalValues as any)[key] = {
        focal: JSON.parse(JSON.stringify(this.focalEntityData[key].focalEntities)),
        counter: JSON.parse(JSON.stringify(this.counterPartyData[key]?.counterParties || []))
      };
    });
  }

  // ── Save ─────────────────────────────────────────────
  saveAllEntities() {
    this.changedEntities = [];

    if (this.activeTab === 'focal') {
      this.checkEntityChanges(
        this.focalEntityData[this.selectedDataKey]?.focalEntities || [],
        this.originalValues[this.selectedDataKey]?.focal || [],
        'FOCALENTITY'
      );
    } else {
      this.checkEntityChanges(
        this.counterPartyData[this.selectedDataKey]?.counterParties || [],
        this.originalValues[this.selectedDataKey]?.counter || [],
        'COUNTERPARTY'
      );
    }

    if (this.changedEntities.length > 0) {
      this.entityDisambiguationService.saveEntities(this.changedEntities).subscribe({
        next: (response) => {
          this.storeOriginalValues();
          this.notificationService.showSuccess();
        },
        error: (error) => {
          console.error('Error saving changes', error);
          this.notificationService.showError('Failed to save changes. Please try again.');
        }
      });
    } else {
      this.notificationService.showError('No changes to save');
    }
  }

  private checkEntityChanges(
    currentEntities: any[],
    originalEntities: any[],
    entityType: 'FOCALENTITY' | 'COUNTERPARTY'
  ) {
    currentEntities.forEach(entity => {
      const originalEntity = originalEntities.find(e => e.peId === entity.peId);

      if (originalEntity &&
        (entity.identityType !== originalEntity.identityType ||
          entity.identity !== originalEntity.identity)) {

        this.changedEntities.push({
          alertId: this.currentAlertId,
          peId: entity.peId,
          peName: entity.name,
          identityType: entity.identityType,
          identityValue: entity.identity,
          type: entityType,
          typeValue: entity.name,
          isParent: false,
          parentPeId: entityType === 'COUNTERPARTY'
            ? this.focalEntityData[this.selectedDataKey]?.focalEntities[0]?.peId
            : undefined,
          createdBy: "system",
          updatedBy: "system"
        });
      }
    });
  }

  // ── Close all action menus ───────────────────────────
  closeAllActionMenus() {
    this.showActionMenu = {};
    this.currentActionEntity = null;
    this.currentActionType = null;
  }

  // ── Close menus when clicking outside ───────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    const isActionMenuClick = clickedElement.closest('.action-menu') ||
                              clickedElement.closest('.action-btn');
    if (!isActionMenuClick) {
      this.closeAllActionMenus();
    }
  }

  // ── Load default focal entity ────────────────────────
  loadDefaultFocalEntity() {
    const focalData = this.focalEntityData[this.selectedDataKey];
    if (focalData?.focalEntities && focalData.focalEntities.length > 0) {
      this.selectedFocalEntities = [focalData.focalEntities[0]];
      focalData.focalEntities.forEach(e => e.isSelected = false);
      focalData.focalEntities[0].isSelected = true;
    }
  }

  // ── Set active tab ───────────────────────────────────
  setActiveTab(tab: 'focal' | 'counter') {
    this.activeTab = tab;

    if (tab === 'focal') {
      this.loadDefaultFocalEntity();
    } else {
      this.selectedCounterParties = [];
      const counterData = this.counterPartyData[this.selectedDataKey];
      if (counterData?.counterParties && counterData.counterParties.length > 0) {
        this.selectedCounterParties = [counterData.counterParties[0]];
        counterData.counterParties.forEach(e => e.isSelected = false);
        counterData.counterParties[0].isSelected = true;
      }
    }
  }

  // ── Toggle focal entity selection (left panel) ───────
  toggleFocalSelection(entity: FocalEntity, event: Event) {
    event.stopPropagation();
    const isChecked = (event.target as HTMLInputElement).checked;
    entity.isSelected = isChecked;

    if (isChecked) {
      if (!this.selectedFocalEntities.some(e => e.peId === entity.peId)) {
        this.selectedFocalEntities.push(entity);
      }
    } else {
      this.selectedFocalEntities = this.selectedFocalEntities.filter(e => e.peId !== entity.peId);
    }
  }

  // ── Toggle counter party selection (left panel) ──────
  toggleCounterSelection(entity: CounterParty, event: Event) {
    event.stopPropagation();
    const isChecked = (event.target as HTMLInputElement).checked;
    entity.isSelected = isChecked;

    if (isChecked) {
      if (!this.selectedCounterParties.some(e => e.peId === entity.peId)) {
        this.selectedCounterParties.push(entity);
      }
    } else {
      this.selectedCounterParties = this.selectedCounterParties.filter(e => e.peId !== entity.peId);
    }
  }

  // ── Select focal entity (left panel card click) ──────
  selectFocalEntity(entity: FocalEntity) {
    if (this.focalEntityData[this.selectedDataKey]?.focalEntities) {
      entity.isSelected = !entity.isSelected;

      if (entity.isSelected) {
        if (!this.selectedFocalEntities.some(e => e.peId === entity.peId)) {
          this.selectedFocalEntities.push(entity);
        }
      } else {
        this.selectedFocalEntities = this.selectedFocalEntities.filter(e => e.peId !== entity.peId);
      }
    }
  }

  // ── Select counter party (left panel card click) ─────
  selectCounterParty(entity: CounterParty) {
    if (this.counterPartyData[this.selectedDataKey]?.counterParties) {
      entity.isSelected = !entity.isSelected;

      if (entity.isSelected) {
        if (!this.selectedCounterParties.some(e => e.peId === entity.peId)) {
          this.selectedCounterParties.push(entity);
        }
      } else {
        this.selectedCounterParties = this.selectedCounterParties.filter(e => e.peId !== entity.peId);
      }
    }
  }

  // ── Handlers from child components ──────────────────
  onFocalEntitySelected(entity: FocalEntity | null) {
    if (entity) {
      if (!this.selectedFocalEntities.some(e => e.peId === entity.peId)) {
        this.selectedFocalEntities = [entity];
      }
    } else {
      this.selectedFocalEntities = [];
    }
  }

  onCounterPartySelected(entity: CounterParty | null) {
    if (entity) {
      if (!this.selectedCounterParties.some(e => e.peId === entity.peId)) {
        this.selectedCounterParties = [entity];
      }
    } else {
      this.selectedCounterParties = [];
    }
  }

  // ── markAsParent from child components ──────────────
  markAsParent(entity: any, event: Event) {
    event.stopPropagation();

    if (this.activeTab === 'focal') {
      this.selectedDataKey = entity.peId;

      if (!this.parentOptions.some(opt => opt.value === entity.peId)) {
        this.parentOptions.push({
          value: entity.peId,
          label: entity.name
        });
      }

      this.currentParent = {
        type: 'focal',
        id: entity.peId,
        name: entity.name
      };
    } else if (this.activeTab === 'counter') {
      this.counterPartyData[this.selectedDataKey].parentPeId = entity.peId;
      this.counterPartyData[this.selectedDataKey].parentName = entity.name;

      this.currentParent = {
        type: 'counter',
        id: entity.peId,
        name: entity.name
      };
    }

    this.closeAllActionMenus();
  }

  // ── isCurrentParent ──────────────────────────────────
  isCurrentParent(entityId: string): boolean {
    return this.currentParent?.id === entityId;
  }

  // ── toggleAllFocalSelection ──────────────────────────
  toggleAllFocalSelection(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (this.focalEntityData[this.selectedDataKey]?.focalEntities) {
      this.focalEntityData[this.selectedDataKey].focalEntities.forEach(e => {
        e.isSelected = isChecked;
      });

      this.selectedFocalEntities = isChecked
        ? [...this.focalEntityData[this.selectedDataKey].focalEntities]
        : [];
    }
  }

  // ── toggleAllCounterSelection ────────────────────────
  toggleAllCounterSelection(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (this.counterPartyData[this.selectedDataKey]?.counterParties) {
      this.counterPartyData[this.selectedDataKey].counterParties.forEach(e => {
        e.isSelected = isChecked;
      });

      this.selectedCounterParties = isChecked
        ? [...this.counterPartyData[this.selectedDataKey].counterParties]
        : [];
    }
  }

  // ── isAllFocalSelected ───────────────────────────────
  isAllFocalSelected(): boolean {
    return this.focalEntityData[this.selectedDataKey]?.focalEntities?.every(e => e.isSelected) || false;
  }

  // ── isAllCounterSelected ─────────────────────────────
  isAllCounterSelected(): boolean {
    return this.counterPartyData[this.selectedDataKey]?.counterParties?.every(e => e.isSelected) || false;
  }

  // ── Remove selected focal entity ─────────────────────
  removeSelectedFocalEntity(entity: FocalEntity) {
    this.selectedFocalEntities = this.selectedFocalEntities.filter(e => e.peId !== entity.peId);
    if (this.focalEntityData[this.selectedDataKey]?.focalEntities) {
      const entityInTable = this.focalEntityData[this.selectedDataKey].focalEntities.find(e => e.peId === entity.peId);
      if (entityInTable) {
        entityInTable.isSelected = false;
      }
    }
  }

  // ── Remove selected counter party ────────────────────
  removeSelectedCounterParty(entity: CounterParty) {
    this.selectedCounterParties = this.selectedCounterParties.filter(e => e.peId !== entity.peId);
    if (this.counterPartyData[this.selectedDataKey]?.counterParties) {
      const entityInTable = this.counterPartyData[this.selectedDataKey].counterParties.find(e => e.peId === entity.peId);
      if (entityInTable) {
        entityInTable.isSelected = false;
      }
    }
  }

  // ── Flag quality issue ───────────────────────────────
  onFlagQualityIssueChanged(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (this.focalEntityData[this.selectedDataKey]) {
      this.focalEntityData[this.selectedDataKey].flagQualityIssue = isChecked;
    }
  }

  // ── Change parent entity ─────────────────────────────
  changeParentEntity(event: Event) {
    this.selectedDataKey = (event.target as HTMLSelectElement).value;
    this.loadDefaultFocalEntity();
  }
}