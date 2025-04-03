import express from 'express';
import { 
  submitRundeckForm, 
  getRundeckExecutionStatus, 
  getRundeckFormOptions 
} from '../controller/RundeckForm_Controller.js';

const routerRundeckForm = express.Router();

// Ruta para enviar el formulario
routerRundeckForm.post('/rundeck/form-submit', submitRundeckForm);

// Ruta para consultar el estado de una ejecución
routerRundeckForm.get('/rundeck/executions/:executionId', getRundeckExecutionStatus);

// Ruta para obtener las opciones disponibles para el formulario
routerRundeckForm.get('/rundeck/form-options', getRundeckFormOptions);

export default routerRundeckForm;