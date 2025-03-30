import express from 'express';

import { ListarRundeckController, AddRundeckController } from '../controller/Rundeck_Controller.js';

// Importar el modelo de Rundeck
const routerRundeck = express.Router();
routerRundeck.get('/rundeck', ListarRundeckController)
routerRundeck.post('/rundeck', AddRundeckController)

// Exportar el router de Rundeck
export  default routerRundeck;
