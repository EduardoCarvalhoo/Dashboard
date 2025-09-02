class AuthService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://plane.delbank.srv.br';
    this.csrfToken = null;
    this.sessionId = null;
  }

  // Obter token CSRF inicial (deve ser chamado primeiro)
  async getCsrfToken() {
    try {
      const response = await fetch(`/auth/get-csrf-token/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrf_token;
        console.log('CSRF Token obtido:', this.csrfToken);
        return data.csrf_token;
      }
      throw new Error('Erro ao obter token CSRF');
    } catch (error) {
      console.error('Erro ao obter CSRF token:', error);
      throw error;
    }
  }

  // Verificar email (chamado após obter CSRF token)
  async checkEmail(email) {
    try {
      // Validação básica do email
      if (!email || !email.trim()) {
        throw new Error('Por favor, insira um email');
      }

      // Sempre obter um novo token CSRF antes de verificar email
      await this.getCsrfToken();

      console.log('Verificando email com CSRF token:', this.csrfToken);

      const response = await fetch(`/auth/email-check/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Content-Type': 'application/json',
          'X-CSRFToken': this.csrfToken,
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/?next_path=/del-tech/projects/d425304e-af04-41e1-ad98-96f1de4f1e5b/cycles/`
        },
        body: JSON.stringify({ email })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Email verificado com sucesso:', data);
        return data;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na verificação de email:', errorData);
        throw new Error(errorData.detail || errorData.message || 'Email não encontrado ou inválido');
      }
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      throw error;
    }
  }

  // Fazer login com senha
  async signIn(email, password) {
    try {
      // Garantir que temos o token CSRF mais recente
      if (!this.csrfToken) {
        await this.getCsrfToken();
      }

      const formData = new URLSearchParams();
      formData.append('csrfmiddlewaretoken', this.csrfToken);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('next_path', '/del-tech/projects/d425304e-af04-41e1-ad98-96f1de4f1e5b/cycles/');

      const response = await fetch(`/auth/sign-in/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/?next_path=/del-tech/projects/d425304e-af04-41e1-ad98-96f1de4f1e5b/cycles/`
        },
        body: formData
      });

      if (response.ok || response.redirected) {
        // Extrair cookies da resposta
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          this.extractTokensFromCookies(cookies);
        }
        
        // Salvar tokens no localStorage para persistência
        this.saveTokensToStorage();
        
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  // Extrair tokens dos cookies
  extractTokensFromCookies(cookieString) {
    const cookies = cookieString.split(';');
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        this.csrfToken = value;
      } else if (name === 'session-id') {
        this.sessionId = value;
      }
    });
  }

  // Salvar tokens no localStorage
  saveTokensToStorage() {
    if (this.csrfToken) {
      localStorage.setItem('csrfToken', this.csrfToken);
    }
    if (this.sessionId) {
      localStorage.setItem('sessionId', this.sessionId);
    }
  }

  // Carregar tokens do localStorage
  loadTokensFromStorage() {
    this.csrfToken = localStorage.getItem('csrfToken');
    this.sessionId = localStorage.getItem('sessionId');
  }

  // Verificar se está autenticado
  isAuthenticated() {
    this.loadTokensFromStorage();
    return !!(this.csrfToken && this.sessionId);
  }

  // Fazer logout
  logout() {
    this.csrfToken = null;
    this.sessionId = null;
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('sessionId');
  }
}

export default new AuthService();