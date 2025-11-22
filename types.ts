
export interface CustomProperty {
  id: string;
  key: string;
  value: string;
}

export enum EntityType {
  Property = 'PROPERTY',
  Room = 'ROOM',
  Unit = 'UNIT',
  Compartment = 'COMPARTMENT',
  Container = 'CONTAINER',
  Item = 'ITEM',
  LaundryLink = 'LAUNDRY_LINK',
}

export interface BaseEntity {
  id: string;
  name: string;
  type: EntityType;
  parentId: string | null;
  customProps: CustomProperty[];
}

export interface Property extends BaseEntity {
  type: EntityType.Property;
  parentId: null;
}

export interface Room extends BaseEntity {
  type: EntityType.Room;
  parentId: string;
}

export interface Unit extends BaseEntity {
  type: EntityType.Unit;
  parentId: string;
}

export interface Compartment extends BaseEntity {
  type: EntityType.Compartment;
  parentId: string;
}

export interface Container extends BaseEntity {
  type: EntityType.Container;
  parentId: string;
  capacity?: 'Empty' | 'Plenty of Space' | 'Getting Full' | 'Full';
}

export interface Item extends BaseEntity {
  type: EntityType.Item;
  parentId: string;
  quantity: number;
  tags: string[];
  status: 'Placed' | 'Dirty' | 'Washing' | 'Clean (Unplaced)';
}

export interface LaundryLink extends BaseEntity {
  type: EntityType.LaundryLink;
  parentId: string;
  linkedTag: string;
}

export type InventoryEntity = Property | Room | Unit | Compartment | Container | Item | LaundryLink;

export type AppView = 'hierarchy' | 'overview' | 'management' | 'settings';

export interface Clipboard {
  entityIds: string[];
}