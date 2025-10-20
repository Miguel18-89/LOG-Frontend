import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

const CheckToken = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        toast.info("Sessão expirada, por favor faça login de novo.")
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    } catch (error) {
      console.error('Token inválido:', error);
      toast.info("Sessão expirada, por favor faça login de novo.")
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  }, [navigate]);

  return null;
};

export default CheckToken;