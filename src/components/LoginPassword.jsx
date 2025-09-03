import React, { useState } from 'react';
import './LoginPassword.css';

const LoginPassword = ({ email, onPasswordSubmit, onBackToEmail, isLoading }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Por favor, insira sua senha');
      return;
    }

    try {
      await onPasswordSubmit(password);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Dashboard</h1>
          <p>Digite sua senha para continuar</p>
        </div>

        <div className="email-display">
          <span className="email-label">Email:</span>
          <span className="email-value">{email}</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={isLoading}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <button 
            type="button" 
            className="back-button"
            onClick={onBackToEmail}
            disabled={isLoading}
          >
            Voltar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPassword;