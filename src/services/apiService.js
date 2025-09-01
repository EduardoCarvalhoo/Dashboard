import config from '../config/api.js';

class ApiService {
  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.defaultHeaders = config.getHeaders();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestOptions = {
      method: 'GET',
      headers: { ...this.defaultHeaders, ...options.headers },
      credentials: 'include',
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (attempt < config.retryAttempts && !error.name === 'AbortError') {
          await this.delay(config.retryDelay * attempt);
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos específicos da API
  async getProjects(workspace) {
    return this.request(config.endpoints.projects(workspace));
  }

  async getProject(workspace, projectId) {
    return this.request(config.endpoints.project(workspace, projectId));
  }

  async getTeams(workspace) {
    return this.request(config.endpoints.teams(workspace));
  }
}

export default new ApiService();