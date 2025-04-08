import { authenticate } from 'ldap-authentication';
import jwt from 'jsonwebtoken';
import User from '../models/User_Model.js';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para LDAP
const ldapConfig = {
  url: process.env.LDAP_URL,
  baseDN: process.env.LDAP_BASE_DN,
  bindDN: process.env.LDAP_BIND_DN, 
  bindCredentials: process.env.LDAP_BIND_PASSWORD,
  searchBase: process.env.LDAP_SEARCH_BASE,
  searchFilter: process.env.LDAP_SEARCH_FILTER
};

// Función para autenticar usuario vía LDAP
export const authenticateUserLDAP = async (username, password) => {
  try {
    // Configurar la autenticación LDAP
    const options = {
      ldapOpts: {
        url: ldapConfig.url,
      },
      adminDn: ldapConfig.bindDN,
      adminPassword: ldapConfig.bindCredentials,
      userSearchBase: ldapConfig.searchBase,
      usernameAttribute: 'uid',
      username: username,
      userPassword: password,
      // Atributos a recuperar del usuario
      attributes: ['cn', 'mail', 'uid', 'memberOf']
    };

    // Realizar la autenticación LDAP
    const user = await authenticate(options);
    
    if (!user) {
      throw new Error('Autenticación LDAP fallida');
    }

    console.log('Usuario LDAP autenticado:', user);

    // Mapear los grupos LDAP a roles si es necesario
    const roles = parseRolesFromLdapGroups(user.memberOf);

    // Buscar si el usuario existe en nuestra BD
    const normalizedUsername = username.toLowerCase().trim();
    // Check if the username contains only valid characters
    if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
      throw new Error('Invalid username format');
    }
    let userInDb = await User.findOne({ username: normalizedUsername });

    if (userInDb) {
      // Actualizar información del usuario existente
      userInDb.email = user.mail || userInDb.email;
      userInDb.fullName = user.cn || userInDb.fullName;
      userInDb.roles = roles.length > 0 ? roles : userInDb.roles;
      userInDb.lastLogin = new Date();
      await userInDb.save();
    } else {
      // Crear un nuevo usuario en la base de datos
      userInDb = await User.create({
        username: normalizedUsername, // Use the already validated and normalized username
        email: user.mail,
        fullName: user.cn,
        roles: roles,
        authMethod: 'ldap',
        lastLogin: new Date()
      });
    }

    // Generar el token JWT
    const token = generateJWT(userInDb);

    return {
      success: true,
      token,
      user: {
        id: userInDb._id,
        username: userInDb.username,
        fullName: userInDb.fullName,
        email: userInDb.email,
        roles: userInDb.roles
      }
    };
  } catch (error) {
    console.error('Error en autenticación LDAP:', error);
    throw new Error(`Error de autenticación: ${error.message}`);
  }
};

// Función para extraer roles de los grupos LDAP
const parseRolesFromLdapGroups = (groups) => {
  if (!groups) return ['user']; // Rol por defecto
  
  const roles = [];
  
  // Analizar los grupos LDAP y mapearlos a roles en la aplicación
  if (Array.isArray(groups)) {
    groups.forEach(group => {
      if (group.includes('cn=admins')) {
        roles.push('admin');
      } else if (group.includes('cn=developers')) {
        roles.push('developer');
      } else {
        roles.push('user');
      }
    });
  } else if (typeof groups === 'string') {
    if (groups.includes('cn=admins')) {
      roles.push('admin');
    } else if (groups.includes('cn=developers')) {
      roles.push('developer');
    } else {
      roles.push('user');
    }
  }
  
  // Eliminar duplicados y asegurar que al menos exista el rol 'user'
  return [...new Set(roles.length > 0 ? roles : ['user'])];
};

// Generar token JWT
export const generateJWT = (user) => {
  return jwt.sign(
    { 
      sub: user._id, 
      username: user.username,
      roles: user.roles
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  );
};