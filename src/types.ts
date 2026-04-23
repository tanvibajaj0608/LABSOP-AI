export type UserRole = 'scientist' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization?: string;
  createdAt: any;
}

export interface SOP {
  id: string;
  title: string;
  currentVersion: number;
  guidelines: string[];
  createdBy: string;
  organization?: string;
  status: 'draft' | 'active' | 'retired';
  createdAt: any;
  updatedAt: any;
}

export interface Revision {
  id: string;
  sopId: string;
  version: number;
  content: string;
  changelog: string;
  createdBy: string;
  createdAt: any;
}
