import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import apiService from '../services/apiService';
import config from '../config/api';

export function useTeams() {
  const { state, dispatch } = useApp();
  
  const fetchTeams = useCallback(async (workspace = config.workspace) => {
    dispatch({ type: 'SET_LOADING', key: 'teams', value: true });
    dispatch({ type: 'SET_ERROR', key: 'teams', value: null });
    
    try {
      const data = await apiService.getProjects(workspace);
      const teams = data.results || data || [];
      dispatch({ type: 'SET_TEAMS', teams });
      return teams;
    } catch (error) {
      const errorMessage = error.message || 'Erro ao carregar times';
      dispatch({ type: 'SET_ERROR', key: 'teams', value: errorMessage });
      throw error;
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