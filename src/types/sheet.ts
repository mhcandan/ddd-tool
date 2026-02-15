export type SheetLevel = 'system' | 'domain' | 'flow';

export interface SheetLocation {
  level: SheetLevel;
  domainId?: string;
  flowId?: string;
}

export interface BreadcrumbSegment {
  label: string;
  location: SheetLocation;
}

export interface Position {
  x: number;
  y: number;
}
