import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

// Configuración para el acceso a Rundeck
const RUNDECK_API_URL = process.env.RUNDECK_API_URL || 'http://localhost:4440/api/41';
const RUNDECK_API_TOKEN = process.env.RUNDECK_API_TOKEN || 'tu_token_de_rundeck';
const RUNDECK_JOB_IDS = {
  compliance: process.env.RUNDECK_COMPLIANCE_JOB_ID || 'compliance-job-id',
  patching: process.env.RUNDECK_PATCHING_JOB_ID || 'patching-job-id',
  default: process.env.RUNDECK_DEFAULT_JOB_ID || 'default-job-id'
};

/**
 * Controlador para manejar el envío del formulario a Rundeck
 */
export const submitRundeckForm = async (req, res) => {
  try {
    logger.info('Recibida solicitud de envío de formulario para Rundeck');
    
    const { changeType, machines, specificOptions } = req.body;
    
    // Validar campos requeridos generales
    if (!changeType) {
      logger.warn('Intento de envío de formulario sin tipo de cambio');
      return res.status(400).json({
        success: false,
        message: 'El tipo de cambio es obligatorio'
      });
    }
    
    if (!machines || machines.trim() === '') {
      logger.warn('Intento de envío de formulario sin especificar máquinas');
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos una máquina'
      });
    }
    
    // Validaciones específicas según el tipo de cambio
    if (changeType === 'compliance') {
      if (!specificOptions || (Array.isArray(specificOptions) && specificOptions.length === 0)) {
        logger.warn('Intento de envío de formulario de compliance sin opciones seleccionadas');
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos una opción de compliance'
        });
      }
    } else if (changeType === 'patching') {
      if (!specificOptions) {
        logger.warn('Intento de envío de formulario de patching sin versión seleccionada');
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar una versión de patching'
        });
      }
    }
    
    // Preparar las máquinas (convertir múltiples líneas en formato de lista)
    const machinesList = machines
      .trim()
      .split(/[\n,]+/)
      .map(machine => machine.trim())
      .filter(machine => machine !== '');
    
    if (machinesList.length === 0) {
      logger.warn('La lista de máquinas está vacía después de procesarla');
      return res.status(400).json({
        success: false,
        message: 'La lista de máquinas no puede estar vacía'
      });
    }
    
    logger.info(`Formulario validado correctamente para tipo: ${changeType}`);
    logger.debug('Datos del formulario:', { 
      changeType, 
      machinesCount: machinesList.length,
      specificOptions 
    });
    
    // Determinar qué job ID usar según el tipo de cambio
    const jobId = RUNDECK_JOB_IDS[changeType] || RUNDECK_JOB_IDS.default;
    
    // Preparar los argumentos para Rundeck
    const argString = prepareRundeckArguments(changeType, machinesList, specificOptions);
    
    try {
      // Ejecutar el job en Rundeck
      // NOTA: Esta parte está comentada para desarrollo/pruebas
      /*
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
      
      logger.info(`Job de Rundeck ejecutado exitosamente. ID: ${executionId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Formulario enviado correctamente',
        executionId: executionId,
        executionUrl: executionUrl
      });
      */
      
      // Simulación para desarrollo (quitar en producción)
      logger.info('[SIMULACIÓN] Procesando formulario para Rundeck');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular proceso
      
      const mockExecutionId = `${changeType}-${Date.now()}`;
      logger.info(`[SIMULACIÓN] Job ejecutado con ID simulado: ${mockExecutionId}`);
      
      res.status(200).json({
        success: true,
        message: 'Formulario enviado correctamente',
        executionId: mockExecutionId,
        argString: argString // Solo para depuración en desarrollo
      });
      
    } catch (rundeckError) {
      logger.error('Error al comunicarse con Rundeck:', rundeckError);
      
      res.status(502).json({
        success: false,
        message: 'Error al comunicarse con Rundeck',
        details: rundeckError.message
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
    
    // Simulación para desarrollo
    return res.status(200).json({
      success: true,
      status: 'running',
      progress: 65,
      started: new Date(Date.now() - 120000).toISOString(),
      executionId: executionId
    });
    
    /*
    // Implementación real
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
    */
  } catch (error) {
    logger.error('Error al obtener estado de ejecución:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de la ejecución',
      details: error.message
    });
  }
};

/**
 * Controlador para obtener la lista de opciones disponibles
 */
export const getRundeckFormOptions = async (req, res) => {
  try {
    // Opciones de formulario (en una aplicación real podrían venir de una base de datos)
    const formOptions = {
      changeTypes: [
        { value: 'compliance', label: 'Compliance' },
        { value: 'patching', label: 'Patching' }
      ],
      complianceRules: [
        { value: '1-1-1', label: '1-1-1' },
        { value: '2-2-2', label: '2-2-2' }
      ],
      patchingVersions: [
        { value: '90523', label: '90523' },
        { value: '85527', label: '85527' }
      ]
    };
    
    return res.status(200).json({
      success: true,
      options: formOptions
    });
  } catch (error) {
    logger.error('Error al obtener opciones del formulario:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener opciones del formulario',
      details: error.message
    });
  }
};