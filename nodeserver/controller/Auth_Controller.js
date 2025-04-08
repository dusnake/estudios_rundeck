import { authenticateUserLDAP } from '../services/Auth_Service.js';

export const loginController = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Se requiere usuario y contraseña' });
    }
    
    // Sanitize inputs to prevent injection
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password;
    const authResult = await authenticateUserLDAP(sanitizedUsername, sanitizedPassword);
    
    if (!authResult || !authResult.token) {
      return res.status(401).json({ error: 'Autenticación fallida' });
    }
    
    return res.status(200).json({
      success: true,
      token: authResult.token,
      user: authResult.user
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(401).json({ 
      error: 'Credenciales inválidas',
      details: error.message 
    });
  }
};