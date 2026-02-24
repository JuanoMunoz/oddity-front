/**
 * TypeScript Interfaces (DTOs) for Frontend
 * These interfaces represent the data structures as received from the API
 * and are used throughout the frontend for type safety.
 */

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
    organizationId?: number | null;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}
export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
    organizationId?: number | null;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}

export interface Organization {
    id: number;
    name: string;
    accessToken: string;
    billingEmail: string;
    monthlySpendingLimit: string; // Numeric values usually come as strings from APIs to preserve precision
    slug: string;
    logo: string;
    currentSpent: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CustomAgent {
    id: number;
    name: string;
    systemPrompt: string;
    organizationId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IaModel {
    id: number;
    name: string;
    pricePerInputToken: string;
    pricePerOutputToken: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CustomAgentModel {
    id: number;
    customAgentId: number;
    modelId: number;
    priority: number;
    isActive: boolean;
}

export interface AgentUsage {
    id: number;
    userId: string;
    agentId: number;
    organizationId: number;
    modelId?: number | null;
    inputTokens: number;
    outputTokens: number;
    total: string;
    createdAt: string;
}

// --- Extended types for common API responses ---

export interface OrganizationDetail extends Organization {
    agents: CustomAgent[];
    users: User[];
}

export interface AgentDetail extends CustomAgent {
    models: IaModel[];
    organization: Organization;
}

export interface UserDetail extends User {
    organization?: Organization | null;
    usage?: AgentUsage[];
}
