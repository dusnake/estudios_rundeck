import express from 'express';

import { ListarDynatraceController } from '../controller/Dynatrace_Controller.js';

const routerDynatrace = express.Router();
routerDynatrace.get('/dynatrace', ListarDynatraceController)

// Exportar el router de Rundeck
export default routerDynatrace ;
