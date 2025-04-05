import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import RundeckExecution from '../models/Rundeck_Exec_Model.js';

dotenv.config();

// Configuración para el acceso a Rundeck
const RUNDECK_API_URL = process.env.RUNDECK_API_URL || 'http://localhost:4440/api/41';
const RUNDECK_API_TOKEN = process.env.RUNDECK_API_TOKEN || 'tu_token_de_rundeck';
const RUNDECK_JOB_IDS = {
  compliance: process.env.RUNDECK_COMPLIANCE_JOB_ID || 'compliance-job-id',
  patching: process.env.RUNDECK_PATCHING_JOB_ID || 'patching-job-id',
  default: process.env.RUNDECK_DEFAULT_JOB_ID || 'default-job-id'
};

export const submitRundeckForm = async (req, res) => {
  try {
    logger.info('Recibida solicitud de envío de formulario para Rundeck');
    
    const { changeType, machines, specificOptions } = req.body;
    
    // Validación básica
    if (!changeType) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de cambio es obligatorio'
      });
    }
    
    // Validar que el tipo de cambio esté soportado
    if (!RUNDECK_JOB_IDS[changeType]) {
      return res.status(400).json({
        success: false,
        message: `Tipo de cambio no soportado: ${changeType}`
      });
    }
    
    // Validar que se proporcionen máquinas
    if (!machines || machines.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos una máquina'
      });
    }
    
    // Preparar la lista de máquinas
    let machinesList = [];
    
    // Las máquinas pueden venir como texto separado por comas o saltos de línea
    if (typeof machines === 'string') {
      // Dividir por comas o saltos de línea y eliminar espacios en blanco
      machinesList = machines.split(/[\n,]+/).map(machine => machine.trim()).filter(machine => machine !== '');
    } else if (Array.isArray(machines)) {
      // Si ya viene como array, simplemente limpiamos cada elemento
      machinesList = machines.map(machine => machine.trim()).filter(machine => machine !== '');
    }
    
    // Validar que haya máquinas después de procesar
    if (machinesList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos una máquina válida'
      });
    }
    
    const jobId = RUNDECK_JOB_IDS[changeType] || RUNDECK_JOB_IDS.default;
    
    logger.info(`Formulario validado correctamente para tipo: ${changeType}`);
    logger.debug('Datos del formulario:', { 
      changeType, 
      machinesName: machinesList,
      machinesCount: machinesList.length,
      specificOptions,
      jobId
    });
    
    // Preparar los argumentos para Rundeck
    const argString = prepareRundeckArguments(changeType, machinesList, specificOptions);
    
    try {
      // Ejecutar el job en Rundeck
      const rundeckResponse = await axios.post(
        `${RUNDECK_API_URL}/job/${jobId}/executions`, 
        {
          argString: argString
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Rundeck-Auth-Token': RUNDECK_API_TOKEN
          }
        }
      );
      
      const executionId = rundeckResponse.data.id;
      const executionUrl = `${RUNDECK_API_URL}/execution/${executionId}`;
      const permalinkUrl = rundeckResponse.data.permalink || executionUrl;
      
      logger.info(`Job de Rundeck ejecutado exitosamente. ID: ${executionId}`);
      
      // Guardar la ejecución en MongoDB
      try {
       
        // Crear un nuevo documento para la ejecución
        const newExecution = new RundeckExecution({
          executionId: executionId,
          status: 'running',
          permalink: permalinkUrl,
          project: rundeckResponse.data.project || 'default',
          // Guardar el tipo de cambio en ambos niveles para compatibilidad
          changeType: changeType,
          // Guardar los datos específicos
          specificOptions: specificOptions,
          machines: machines, // Guardamos el string original
          // Estructura de opciones completa
          options: {
            changeType: changeType,
            specificOptions: specificOptions,
            machines: machines, // Guardamos el string original
            machinesList: machinesList, // También guardamos la lista procesada
            argString: argString
          },
          startedAt: new Date(),
          createdAt: new Date()
        });
        
        // Guardar el documento en la base de datos
        await newExecution.save();
        logger.info(`Ejecución guardada en la base de datos con ID: ${newExecution._id}`);
      } catch (dbError) {
        // Si hay un error al guardar en la base de datos, registrarlo pero no detener la respuesta al usuario
        logger.error('Error al guardar la ejecución en la base de datos:', dbError);
      }
      
      // Responder al cliente
      return res.status(200).json({
        success: true,
        message: 'Formulario enviado correctamente',
        executionId: executionId,
        executionUrl: executionUrl,
        permalink: permalinkUrl
      });
      
    } catch (rundeckError) {
      logger.error('Error al ejecutar job en Rundeck:', rundeckError);
      
      return res.status(500).json({
        success: false,
        message: 'Error al ejecutar el job en Rundeck',
        details: rundeckError.message || 'Error de comunicación con Rundeck'
      });
    }
    
  } catch (error) {
    logger.error('Error interno en submitRundeckForm:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: error.message
    });
  }
};

/**
 * Prepara los argumentos para Rundeck según el tipo de cambio
 */
function prepareRundeckArguments(changeType, machinesList, specificOptions) {
  // Convertir lista de máquinas a formato string
  const machinesString = machinesList.join(',');
  
  // Base de argumentos común
  let args = `-changeType "${changeType}" -machines "${machinesString}"`;
  
  // Añadir argumentos específicos según el tipo de cambio
  if (changeType === 'compliance') {
    // Para compliance, unimos las opciones seleccionadas
    const complianceRulesString = Array.isArray(specificOptions) 
      ? specificOptions.join(',') 
      : specificOptions.toString();
    
    args += ` -complianceRules "${complianceRulesString}"`;
  } 
  else if (changeType === 'patching') {
    // Para patching, añadimos la versión seleccionada
    args += ` -patchingVersion "${specificOptions}"`;
  }
  
  return args;
}

/**
 * Controlador para obtener estado de una ejecución en Rundeck
 */
export const getRundeckExecutionStatus = async (req, res) => {
  try {
    const { executionId } = req.params;
    
    if (!executionId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de ejecución es obligatorio'
      });
    }
    
    const response = await axios.get(
      `${RUNDECK_API_URL}/execution/${executionId}/state`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Rundeck-Auth-Token': RUNDECK_API_TOKEN
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      ...response.data
    });


  } catch (error) {
    logger.error('Error al obtener estado de ejecución:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de la ejecución',
      details: error.message
    });
  }
};


export const getFormExecutions = async (req, res) => {
  try {
    logger.info('Solicitando historial de ejecuciones del formulario');
    
    // Buscar las ejecuciones relacionadas con el formulario
    const executions = await RundeckExecution.find({})
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente
      .limit(50); // Limitar a las últimas 50 ejecuciones
    
    // Procesar las ejecuciones para asegurar que tienen la estructura correcta
    const processedExecutions = executions.map(execution => {
      const execData = execution.toObject();
      
      // Asegúrate de que los campos necesarios están presentes
      // y estructurados correctamente
      if (!execData.options) {
        execData.options = {};
      }
      
      // Si el changeType está en el nivel superior, asegúrate de que también esté en options
      if (execData.changeType && !execData.options.changeType) {
        execData.options.changeType = execData.changeType;
      }
      
      // Normalizar otros campos si es necesario
      if (execData.options.argString && typeof execData.options.argString === 'string') {
        // Intentar extraer información del argString si es necesario
        // Por ejemplo, si has guardado todo como argString
        const changeTypeMatch = execData.options.argString.match(/-changeType "([^"]+)"/);
        if (changeTypeMatch && changeTypeMatch[1]) {
          execData.options.changeType = changeTypeMatch[1];
        }
        
        // Y así con otros campos que necesites extraer
      }
      
      return execData;
    });
    
    logger.info(`Se encontraron ${processedExecutions.length} ejecuciones`);
    
    return res.status(200).json({
      success: true,
      count: processedExecutions.length,
      executions: processedExecutions
    });
    
  } catch (error) {
    logger.error('Error al obtener historial de ejecuciones:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de ejecuciones',
      details: error.message
    });
  }
};



export const updateExecutionStatus = async (executionId) => {
  try {
    logger.info(`Actualizando estado de ejecución ID: ${executionId}`);
    
    // Comprobar que la ejecución existe en nuestra base de datos
    const execution = await RundeckExecution.findOne({ executionId });
    
    if (!execution) {
      logger.warn(`No se encontró la ejecución con ID: ${executionId}`);
      return false;
    }
    
    // Si ya está en un estado terminal (completado, fallido, abortado), no es necesario actualizar
    if (['succeeded', 'failed', 'aborted'].includes(execution.status)) {
      logger.debug(`La ejecución ${executionId} ya está en estado terminal: ${execution.status}`);
      return true;
    }
    
    // Consultar estado actual a Rundeck
    const response = await axios.get(
      `${RUNDECK_API_URL}/execution/${executionId}/state`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Rundeck-Auth-Token': RUNDECK_API_TOKEN
        }
      }
    );
    
    // Actualizar el estado en nuestra base de datos
    const rundeckStatus = response.data.executionState;
    const mappedStatus = mapRundeckStatus(rundeckStatus);
    
    execution.status = mappedStatus;
    
    // Si está terminado, guardar la fecha de finalización
    if (['succeeded', 'failed', 'aborted'].includes(mappedStatus)) {
      execution.endedAt = new Date();
    }
    
    // Guardar los cambios
    await execution.save();
    logger.info(`Estado de ejecución ${executionId} actualizado a: ${mappedStatus}`);
    
    return true;
  } catch (error) {
    logger.error(`Error al actualizar estado de ejecución ${executionId}:`, error);
    return false;
  }
};

/**
 * Mapea los estados de Rundeck a nuestros estados internos
 */
function mapRundeckStatus(rundeckStatus) {
  const statusMap = {
    'running': 'running',
    'succeeded': 'succeeded',
    'failed': 'failed',
    'aborted': 'aborted',
    'scheduled': 'running',
    'waiting': 'running'
    // Añadir otros estados según sea necesario
  };
  
  return statusMap[rundeckStatus] || 'unknown';
}

/**
 * Actualiza el estado de todas las ejecuciones en progreso
 * Esta función podría ejecutarse periódicamente mediante un job programado
 */
export const updateAllRunningExecutions = async () => {
  try {
    const runningExecutions = await RundeckExecution.find({
      status: 'running'
    });
    
    logger.info(`Actualizando estado de ${runningExecutions.length} ejecuciones en progreso`);
    
    const updatePromises = runningExecutions.map(execution => 
      updateExecutionStatus(execution.executionId)
    );
    
    await Promise.all(updatePromises);
    
    return true;
  } catch (error) {
    logger.error('Error al actualizar ejecuciones en progreso:', error);
    return false;
  }
};

