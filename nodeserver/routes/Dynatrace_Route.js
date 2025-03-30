import express from 'express';

import { ListarDynatraceController, AddDynatraceController } from '../controller/Dynatrace_Controller.js';

const routerDynatrace = express.Router();
routerDynatrace.get('/dynatrace', ListarDynatraceController)
routerDynatrace.post('/dynatrace', AddDynatraceController)

// Exportar el router de Rundeck
export default routerDynatrace ;
