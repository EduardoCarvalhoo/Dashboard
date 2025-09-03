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
          'Origin': this.baseUrl
        },
        body: JSON.stringify({ email })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Email verificado com sucesso:', data);
        
        if (data.existing === false) {
          throw new Error('Você não tem autorização para acessar o sistema!');
        }
        
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
      if (!this.csrfToken) {
        await this.getCsrfToken();
      }

      const formData = new URLSearchParams();
      formData.append('csrfmiddlewaretoken', this.csrfToken);
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch(`/auth/sign-in/`, {
        method: 'POST',
        credentials: 'include',
        redirect: 'follow',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': this.baseUrl
        },
        body: formData
      });

      console.log('Response status:', response.status);

      // Verificar se o proxy retornou erro de autorização
      if (response.status === 401) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Usuário não autorizado a acessar este sistema.');
      }

      if (response.ok || response.status === 302) {
        // Aguardar um pouco para os cookies serem definidos
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Extrair tokens dos cookies
        this.extractTokensFromDocument();
        this.saveTokensToStorage();
        return { success: true };
      } else {
        throw new Error('Falha na autenticação. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  // Método para extrair tokens dos cookies do documento
  extractTokensFromDocument() {
    const cookies = document.cookie;
    const cookieArray = cookies.split(';');
    
    for (let cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        this.csrfToken = value;
      } else if (name === 'sessionid') {
        this.sessionId = value;
      }
    }
    
    console.log('Tokens extraídos dos cookies:', {
      csrfToken: this.csrfToken,
      sessionId: this.sessionId
    });
  }

  // Novo método para carregar tokens dos cookies do navegador
  async loadTokensFromCookies() {
    try {
      // Fazer uma requisição simples para verificar se estamos autenticados
      const response = await fetch('/api/users/me/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // Se a requisição foi bem-sucedida, extrair tokens dos cookies
        const cookies = document.cookie;
        this.extractTokensFromCookies(cookies);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao carregar tokens dos cookies:', error);
      return false;
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

  // Obter tokens atuais
  getTokens() {
    return {
      csrfToken: this.csrfToken,
      sessionId: this.sessionId
    };
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