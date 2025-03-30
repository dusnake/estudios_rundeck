import cron from 'node-cron';
import axios from 'axios';
import RundeckExecution from '../models/Rundeck_Exec_Model.js';

// Configuración de Rundeck
const RUNDECK_API_URL = process.env.RUNDECK_API_URL;
const RUNDECK_API_TOKEN = process.env.RUNDECK_API_TOKEN;
const UPDATE_INTERVAL = process.env.RUNDECK_UPDATE_INTERVAL || '*/5 * * * *'; // Por defecto cada 5 minutos

const headers = {
  'Content-Type': 'application/json',
  'X-Rundeck-Auth-Token': RUNDECK_API_TOKEN
};

/**
 * Actualiza el estado de una ejecución específica
 */
export const updateExecutionStatus = async (executionId) => {
  try {
    // Consultar estado en Rundeck
    const response = await axios.get(
      `${RUNDECK_API_URL}/execution/${executionId}`, 
      { headers }
    );
    
    const executionData = response.data;
    
    // Actualizar en MongoDB
    const execution = await RundeckExecution.findOne({ executionId });
    
    if (!execution) {
      console.log(`Ejecución ${executionId} no encontrada en la base de datos`);
      return null;
    }
    
    // Actualizar campos relevantes
    execution.status = executionData.status || execution.status;
    
    // Si la ejecución ha terminado, guardar la fecha de finalización
    if (
      (executionData.status === 'succeeded' || 
       executionData.status === 'failed' || 
       executionData.status === 'aborted') && 
      !execution.endedAt
    ) {
      execution.endedAt = new Date();
    }
    
    // Actualizar resultado y logs si están disponibles
    if (executionData.output) {
      execution.logOutput = executionData.output;
    }
    
    if (executionData.result) {
      execution.result = executionData.result;
    }
    
    await execution.save();
    console.log(`Ejecución ${executionId} actualizada: ${execution.status}`);
    
    return execution;
  } catch (error) {
    console.error(`Error al actualizar ejecución ${executionId}:`, error.message);
    return null;
  }
};

/**
 * Actualiza todas las ejecuciones en curso
 */
export const updateRunningExecutions = async () => {
  try {
    console.log('Iniciando actualización periódica de ejecuciones...');
    
    // Buscar todas las ejecuciones que aún están en curso
    const runningExecutions = await RundeckExecution.find({ 
      status: { $in: ['running', 'unknown'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 días
    });
    
    console.log(`Se encontraron ${runningExecutions.length} ejecuciones en curso para actualizar`);
    
    // Actualizar cada ejecución
    const updatePromises = runningExecutions.map(execution => 
      updateExecutionStatus(execution.executionId)
    );
    
    // Esperar a que todas las actualizaciones terminen
    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`Actualización completa: ${successful}/${runningExecutions.length} ejecuciones actualizadas con éxito`);
    
  } catch (error) {
    console.error('Error durante la actualización masiva:', error);
  }
};

/**
 * Iniciar el servicio de actualización periódica
 */
export const startUpdateService = () => {
  console.log(`Configurando actualizaciones periódicas con schedule: ${UPDATE_INTERVAL}`);
  
  // Programar la tarea con cron
  const task = cron.schedule(UPDATE_INTERVAL, async () => {
    await updateRunningExecutions();
  });
  
  return task;
};

/**
 * Detener el servicio de actualización
 */
export const stopUpdateService = (task) => {
  if (task) {
    task.stop();
    console.log('Servicio de actualización detenido');
  }
};