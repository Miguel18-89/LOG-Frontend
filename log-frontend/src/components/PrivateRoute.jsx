import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    localStorage.setItem('logoutReason', 'Não está autenticado.');
    return <Navigate to="/" />;
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('logoutReason', 'A sua sessão expirou, por favor autentique-se de novo.');
      return <Navigate to="/" />;
    }

    return children;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('logoutReason', 'Token inválido, Por favor autentique-se de novo.');
    return <Navigate to="/" />;
  }
};

export default PrivateRoute;