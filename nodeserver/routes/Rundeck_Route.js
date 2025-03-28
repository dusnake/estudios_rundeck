import express from 'express';

import { ListarRundeckController, AddRundeckController } from '../controller/Rundeck_Controller.js';
// import get_data_rundeck from '../controller/Rundeck_Controller.js';

const routerRundeck = express.Router();
// Importar el modelo de Rundeck
routerRundeck.get('/rundeck', ListarRundeckController)
routerRundeck.post('/rundeck', AddRundeckController)

// Exportar el router de Rundeck
export default routerRundeck;
