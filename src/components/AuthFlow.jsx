import React, { useState, useEffect } from 'react';
import LoginEmail from './LoginEmail';
import LoginPassword from './LoginPassword';
import authService from '../services/authService';

const AuthFlow = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState('email'); // 'email' ou 'password'
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar se já está autenticado
    authService.loadTokensFromStorage();
    if (authService.isAuthenticated()) {
      onAuthSuccess(authService.getTokens());
    }
  }, [onAuthSuccess]);

  const handleEmailSubmit = async (emailValue) => {
    setIsLoading(true);
    try {
      await authService.checkEmail(emailValue);
      setEmail(emailValue);
      setCurrentStep('password');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (password) => {
    setIsLoading(true);
    try {
      const result = await authService.signIn(email, password);
      onAuthSuccess(result);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setEmail('');
  };

  if (currentStep === 'email') {
    return (
      <LoginEmail
        onEmailSubmit={handleEmailSubmit}
        isLoading={isLoading}
      />
    );
  }

  return (
    <LoginPassword
      email={email}
      onPasswordSubmit={handlePasswordSubmit}
      onBackToEmail={handleBackToEmail}
      isLoading={isLoading}
    />
  );
};

export default AuthFlow;