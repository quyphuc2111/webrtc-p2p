export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  NONE = 'NONE'
}

export interface PeerState {
  id: string | null;
  loading: boolean;
  error: string | null;
}

// Global declaration for PeerJS loaded via CDN
declare global {
  interface Window {
    Peer: any;
  }
}
