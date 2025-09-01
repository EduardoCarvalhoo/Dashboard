const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  workspace: import.meta.env.VITE_WORKSPACE,
  csrfToken: import.meta.env.VITE_CSRF_TOKEN,
  sessionId: import.meta.env.VITE_SESSION_ID,
  
  // Configurações de timeout e retry
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Headers padrão
  getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': `csrftoken=${this.csrfToken}; session-id=${this.sessionId}`
    };
  },
  
  // URLs da API
  endpoints: {
    projects: (workspace = config.workspace) => `/workspaces/${workspace}/projects/`,
    project: (workspace = config.workspace, projectId) => `/workspaces/${workspace}/projects/${projectId}/`,
    teams: (workspace = config.workspace) => `/workspaces/${workspace}/teams/`,
  }
};

export default config;