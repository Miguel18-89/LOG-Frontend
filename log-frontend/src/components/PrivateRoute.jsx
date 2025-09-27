import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    localStorage.setItem('logoutReason', 'You are not loggedin. Please log in.');
    return <Navigate to="/" />;
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('logoutReason', 'Your session has expired. Please log in again.');
      return <Navigate to="/" />;
    }

    return children;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('logoutReason', 'Invalid token. Please log in again.');
    return <Navigate to="/" />;
  }
};

export default PrivateRoute;