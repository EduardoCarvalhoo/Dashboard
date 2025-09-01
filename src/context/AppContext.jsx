import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  teams: [],
  projects: [],
  loading: {
    teams: false,
    projects: false
  },
  errors: {
    teams: null,
    projects: null
  },
  ui: {
    sidebarOpen: false
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.value }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.key]: action.value }
      };
    
    case 'SET_TEAMS':
      return {
        ...state,
        teams: action.teams,
        loading: { ...state.loading, teams: false },
        errors: { ...state.errors, teams: null }
      };
    
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.projects,
        loading: { ...state.loading, projects: false },
        errors: { ...state.errors, projects: null }
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      };
    
    case 'SET_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: action.open }
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}