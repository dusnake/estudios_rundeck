import express from 'express';
import { 
  submitRundeckForm, 
  getRundeckExecutionStatus, 
  // getRundeckFormOptions,
  getFormExecutions // Nuevo controlador para obtener las ejecuciones del formulario
} from '../controller/RundeckForm_Controller.js';

const routerRundeckForm = express.Router();

// Ruta para enviar el formulario
routerRundeckForm.post('/rundeck/form-submit', submitRundeckForm);

// Ruta para consultar el estado de una ejecución
routerRundeckForm.get('/rundeck/executions/:executionId', getRundeckExecutionStatus);

// Ruta para obtener las opciones disponibles para el formulario
// routerRundeckForm.get('/rundeck/form-options', getRundeckFormOptions);

// Nueva ruta para obtener el historial de ejecuciones del formulario
routerRundeckForm.get('/rundeck/form-executions', getFormExecutions);

export default routerRundeckForm;