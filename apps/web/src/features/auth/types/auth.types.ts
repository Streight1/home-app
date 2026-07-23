export interface AuthProfile {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  activeHousehold: {
    id: string;
    name: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  };
}
