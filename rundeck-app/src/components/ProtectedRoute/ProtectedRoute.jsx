import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = () => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      // Verifica si el token ha expirado
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      // Si hay error al decodificar, consideramos que no está autenticado
      console.error("Error verificando token:", error);
      return false;
    }
  };
  
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;