import React, { useState } from 'react';
import './LoginEmail.css';

const LoginEmail = ({ onEmailSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, insira seu email');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido');
      return;
    }

    try {
      await onEmailSubmit(email);
    } catch (err) {
      setError(err.message || 'Erro ao verificar email');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Dashboard</h1>
          <p>Entre com seu email para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@hotmail.com.br"
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
            {isLoading ? 'Verificando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginEmail;