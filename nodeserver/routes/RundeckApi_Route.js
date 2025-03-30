import express from 'express';
import { 
    runJobController, 
    getExecutionStatusController, 
    listProjectJobsController,
    listSavedExecutionsController
} from '../controller/RundeckApi_Controller.js';

const routerRundeckApi = express.Router();

// Ruta para ejecutar un job en Rundeck
routerRundeckApi.post('/rundeck/jobs/execute', runJobController);

// Ruta para obtener el estado de una ejecución
routerRundeckApi.get('/rundeck/executions/:executionId', getExecutionStatusController);

// Ruta para listar los jobs disponibles en un proyecto
routerRundeckApi.get('/rundeck/projects/:projectName/jobs', listProjectJobsController);

// Nueva ruta para consultar ejecuciones guardadas en MongoDB
routerRundeckApi.get('/rundeck/saved-executions', listSavedExecutionsController);

export default routerRundeckApi;