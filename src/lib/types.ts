export interface UserData {
    id: string;
    email: string;
    name: string;
    role?: string;
    organizationId?: number | null;
    createdAt?: string | Date;
}
