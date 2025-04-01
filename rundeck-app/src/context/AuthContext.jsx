
/**
 * Authentication context for managing user authentication state and operations.
 * 
 * @module AuthContext
 * @context
 * 
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {Object} [additionalProperties] - Any other user properties from the backend
 * 
 * @typedef {Object} AuthContextType
 * @property {User|null} user - Current authenticated user or null if not authenticated
 * @property {boolean} loading - Indicates if the authentication state is being loaded
 * @property {Function} login - Function to authenticate a user with username and password
 * @property {Function} logout - Function to sign out the current user
 * 
 * @exports AuthProvider - Context provider component that manages authentication state
 * @exports useAuth - Custom hook to access the authentication context
 */
import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const decoded = jwtDecode(token);
          
          // Verificar si el token ha expirado
          if (decoded.exp * 1000 < Date.now()) {
            // Token expirado, cerrar sesión
            logout();
          } else {
            // Token válido, establecer el usuario
            setUser(JSON.parse(userData));
            
            // Configurar el token en las solicitudes de axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          // Error decodificando el token
          logout();
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Establecer el token para todas las futuras solicitudes
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  // Verificar si el token está por expirar
  const checkTokenExpiration = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
      const currentTime = Date.now();
      
      // Si el token expira en menos de 5 minutos
      if (expirationTime - currentTime < 5 * 60 * 1000) {
        // Aquí podríamos implementar una renovación del token
        // O simplemente alertar al usuario que su sesión está por expirar
        console.warn('El token está por expirar');
      }
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
    }
  };

  // Verificar regularmente la expiración del token
  useEffect(() => {
    const interval = setInterval(checkTokenExpiration, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);