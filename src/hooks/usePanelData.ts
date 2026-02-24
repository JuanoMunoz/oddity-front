import { useState } from 'react';
import { oddityClient } from '../lib/oddityClient';
import type { CreateOrganizationDto, CreateCustomAgentDto, CreateIaModelDto } from '../lib/oddityClient';

export function usePanelData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const createOrganization = async (data: CreateOrganizationDto) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const org = await oddityClient.organization.create(data);
            setSuccess('Organización creada exitosamente.');
            return org;
        } catch (err: any) {
            setError(err.message || 'Error al crear la organización');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const createCustomAgent = async (data: CreateCustomAgentDto) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const agent = await oddityClient.customAgent.create(data);
            setSuccess('Agente Custom creado exitosamente.');
            return agent;
        } catch (err: any) {
            setError(err.message || 'Error al crear el agente custom');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const createIaModel = async (data: CreateIaModelDto) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const model = await oddityClient.iaModel.create(data);
            setSuccess('Modelo IA creado exitosamente.');
            return model;
        } catch (err: any) {
            setError(err.message || 'Error al crear el modelo IA');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        createOrganization,
        createCustomAgent,
        createIaModel,
        loading,
        error,
        success,
        setError,
        setSuccess
    };
}
