import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import config from '../config/api';

export function useTeams() {
  const { state, dispatch } = useApp();
  
  const fetchTeams = useCallback(async (workspace = config.workspace) => {
    console.log('🔄 Iniciando carregamento dos times...');
    dispatch({ type: 'SET_LOADING', key: 'teams', value: true });
    dispatch({ type: 'SET_ERROR', key: 'teams', value: null });
    
    try {
      const response = await fetch('/api/workspaces/del-tech/projects/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorMessage;
        if (response.status === 403) {
          errorMessage = 'Você não tem permissão para acessar esse projeto!';
        } else if (response.status === 401) {
          errorMessage = 'Sua sessão expirou. Faça login novamente.';
        } else {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const teams = data.results || data || [];
      console.log(`✅ ${teams.length} times carregados da API:`, teams);
      dispatch({ type: 'SET_TEAMS', teams });
      return teams;
    } catch (error) {
      console.warn('⚠️ Falha na API:', error.message);
      dispatch({ type: 'SET_ERROR', key: 'teams', value: error.message });
      
      // Fallback para dados mockados em caso de erro na API
      const mockTeams = [
        { id: 1, name: 'Time Frontend', members: 5, description: 'Desenvolvimento de interfaces' },
        { id: 2, name: 'Time Backend', members: 4, description: 'APIs e serviços' },
        { id: 3, name: 'Time DevOps', members: 3, description: 'Infraestrutura e deploy' },
        { id: 4, name: 'Time QA', members: 2, description: 'Qualidade e testes' },
        { id: 5, name: 'Time Design', members: 3, description: 'UX/UI Design' },
        { id: 6, name: 'Time Mobile', members: 4, description: 'Aplicativos móveis' },
        { id: 7, name: 'Time Data', members: 3, description: 'Análise de dados' }
      ];
      
      console.log(`🧪 Usando ${mockTeams.length} times mockados como fallback:`, mockTeams);
      dispatch({ type: 'SET_TEAMS', teams: mockTeams });
      return mockTeams;
    }
  }, [dispatch]);
  
  const retryFetchTeams = useCallback(() => {
    return fetchTeams();
  }, [fetchTeams]);
  
  return {
    teams: state.teams,
    loading: state.loading.teams,
    error: state.errors.teams,
    fetchTeams,
    retryFetchTeams
  };
}