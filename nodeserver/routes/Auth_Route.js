import express from 'express';
import { loginController } from '../controller/Auth_Controller.js';
import { verifyToken, checkRole } from '../middleware/Auth_Middleware.js';

const routerAuth = express.Router();

// Ruta de login
routerAuth.post('/auth/login', loginController);

// Ruta protegida de ejemplo
routerAuth.get('/auth/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Ruta protegida para administradores
routerAuth.get('/auth/admin', verifyToken, checkRole(['admin']), (req, res) => {
  res.json({ message: 'Acceso administrativo concedido' });
});

export default routerAuth;