import express from 'express';

import { ListarRundeckController } from '../controller/Rundeck_Controller.js';

// Importar el modelo de Rundeck
const routerRundeck = express.Router();
routerRundeck.get('/rundeck', ListarRundeckController)

// Exportar el router de Rundeck
export  default routerRundeck;
