export const API_URL = "";
// export const API_URL = "https://oddity-back.onrender.com";
// export const API_URL = "http://localhost:3000";


/**
 * Cliente base fetcher para manejar las peticiones a la API.
 * Configurado con `credentials: 'include'` para que Better-Auth envíe las cookies de sesión automáticamente.
 */
async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers = new Headers(options.headers || {});
    // Por defecto todas las requests que no sean FormData serán JSON
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
        ...options,
        headers,
        // credentials: 'include' es CRUCIAL para que better-auth envíe las cookies de autenticación
        // hacia tu backend en el puerto 3000
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Manejar respuestas vacías (típicamente de un 204 No Content en DELETE)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
    }

    return response.json();
}

/**
 * ==========================================
 * TIPOS DE DATOS E INTERFACES
 * ==========================================
 */

// --- Organization ---
export interface CreateOrganizationDto {
    name: string;
    accessToken: string;
    billingEmail: string;
    monthlySpendingLimit: number;
    slug: string;
    logo: string;
    currentSpent?: number;
    isActive: boolean;
}

export type UpdateOrganizationDto = Partial<CreateOrganizationDto>;

export interface Organization extends CreateOrganizationDto {
    id: number | string;
    createdAt?: string;
    updatedAt?: string;
}

// --- IaModel ---
export interface CreateIaModelDto {
    name: string;
    pricePerInputToken: number;
    pricePerOutputToken: number;
    isActive?: boolean;
}

export type UpdateIaModelDto = Partial<CreateIaModelDto>;

export interface IaModel extends CreateIaModelDto {
    id: number | string;
    createdAt?: string;
    updatedAt?: string;
}

// --- CustomAgent ---
export interface CreateCustomAgentDto {
    name: string;
    systemPrompt: string;
    organizationId: number;
    mode?: "CHAT" | "FILE" | "IMAGE" | "VIDEO";
    modelId?: number;
    expectedOutput?: "text" | "excel" | "pdf";
    isActive?: boolean;
}

export type UpdateCustomAgentDto = Partial<CreateCustomAgentDto>;

export interface CustomAgent extends CreateCustomAgentDto {
    id: number | string;
    createdAt?: string;
    updatedAt?: string;
}


/**
 * ==========================================
 * ODDITY API CLIENT
 * ==========================================
 */
export const oddityClient = {
    organization: {
        create: (data: CreateOrganizationDto) =>
            fetchClient<Organization>('/api/organization', { method: 'POST', body: JSON.stringify(data) }),
        findAll: () =>
            fetchClient<Organization[]>('/api/organization', { method: 'GET' }),
        findOne: (id: string | number) =>
            fetchClient<Organization>(`/api/organization/${id}`, { method: 'GET' }),
        findUsers: (id: string | number) =>
            fetchClient<any[]>(`/api/organization/${id}/users`, { method: 'GET' }),
        getUsageStats: (id: string | number, period: 'today' | '30d' | '90d' = '30d') =>
            fetchClient<any>(`/api/organization/${id}/usage-stats?period=${period}`, { method: 'GET' }),
        update: (id: string | number, data: UpdateOrganizationDto) =>
            fetchClient<Organization>(`/api/organization/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        remove: (id: string | number) =>
            fetchClient<void>(`/api/organization/${id}`, { method: 'DELETE' }),
    },

    iaModel: {
        // Nota: Asumiendo que el controlador de Nest es `@Controller('api/ia-model')`
        create: (data: CreateIaModelDto) =>
            fetchClient<IaModel>('/api/ia-model', { method: 'POST', body: JSON.stringify(data) }),
        findAll: () =>
            fetchClient<IaModel[]>('/api/ia-model', { method: 'GET' }),
        findOne: (id: string | number) =>
            fetchClient<IaModel>(`/api/ia-model/${id}`, { method: 'GET' }),
        update: (id: string | number, data: UpdateIaModelDto) =>
            fetchClient<IaModel>(`/api/ia-model/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        remove: (id: string | number) =>
            fetchClient<void>(`/api/ia-model/${id}`, { method: 'DELETE' }),
    },

    customAgent: {
        // Nota: Asumiendo que el controlador de Nest es `@Controller('api/custom-agent')`
        create: (data: CreateCustomAgentDto) =>
            fetchClient<CustomAgent>('/api/custom-agent', { method: 'POST', body: JSON.stringify(data) }),
        findAll: () =>
            fetchClient<CustomAgent[]>('/api/custom-agent', { method: 'GET' }),
        findOne: (id: string | number) =>
            fetchClient<CustomAgent>(`/api/custom-agent/${id}`, { method: 'GET' }),
        update: (id: string | number, data: UpdateCustomAgentDto) =>
            fetchClient<CustomAgent>(`/api/custom-agent/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        remove: (id: string | number) =>
            fetchClient<void>(`/api/custom-agent/${id}`, { method: 'DELETE' }),
        use: (data: FormData | any) => {
            const isForm = data instanceof FormData;
            return fetchClient<any>('/api/custom-agent/use', {
                method: 'POST',
                body: isForm ? data : JSON.stringify(data)
            });
        },
        analyzeToPrompt: (data: FormData) => {
            return fetchClient<any>('/api/custom-agent/analyze-to-prompt', {
                method: 'POST',
                body: data
            });
        }
    }
};
