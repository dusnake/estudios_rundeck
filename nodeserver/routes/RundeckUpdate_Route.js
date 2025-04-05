import express from 'express';
import { updateExecutionField, updateCambioChg } from '../controller/RundeckUpdate_Controller.js';

const routerRundeckUpdate = express.Router();

// Ruta para actualizar un campo específico de una ejecución
routerRundeckUpdate.patch('/rundeck/executions/:executionId/field', updateExecutionField);

// Nueva ruta específica para actualizar el campo cambiochg
routerRundeckUpdate.patch('/rundeck/executions/:executionId/cambiochg', updateCambioChg);

export default routerRundeckUpdate;