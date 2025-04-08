import express from 'express';
import { 
  fetchCharactersController, 
  getCharactersController,
  searchCharactersController
} from '../controller/DragonBall_Controller.js';

const routerDragonBall = express.Router();

// Rutas existentes
routerDragonBall.get('/dragonball', getCharactersController);
routerDragonBall.post('/dragonball/fetch', fetchCharactersController);

// Nueva ruta para búsquedas
routerDragonBall.get('/dragonball/search', searchCharactersController);

export default routerDragonBall;