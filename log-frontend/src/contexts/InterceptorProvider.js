// src/services/InterceptorProvider.js (ou .tsx)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupInterceptors } from '../services/interceptors.js'

const InterceptorProvider = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    setupInterceptors(navigate);
  }, [navigate]);

  return children;
};

export default InterceptorProvider; // ✅ esta linha é obrigatória