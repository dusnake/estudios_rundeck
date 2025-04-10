// import { executeRundeckJob, getExecutionStatus, listProjectJobs } from '../services/RundeckApi_Service.js';
import { listProjectJobs } from '../services/RundeckApi_Service.js';
import RundeckExecution from '../models/Rundeck_Exec_Model.js';
import axios from 'axios';


// Configuración de Rundeck
const RUNDECK_API_URL = process.env.RUNDECK_API_URL;
const RUNDECK_API_TOKEN = process.env.RUNDECK_API_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'X-Rundeck-Auth-Token': RUNDECK_API_TOKEN
};


// Controlador para ejecutar un job
export const runJobController = async (req, res) => {
    try {
      // Modificar para recibir también el nombre del job
      const { jobId, options, jobName } = req.body;
      
      if (!jobId) {
        return res.status(400).json({ error: 'Se requiere un jobId' });
      }
  
      // Debug: Mostrar los datos recibidos
      console.log('Ejecutando job con los siguientes datos:');
      console.log('jobId:', jobId);
      console.log('jobName:', jobName); // Añadir log para el nombre
      console.log('options:', options);
      console.log('headers:', headers);
      
      // Ejecutar el job en Rundeck
      const response = await axios.post(
        `${RUNDECK_API_URL}/job/${jobId}/run`, 
        { options: options || {} },
        { headers }
      );
      // Mostrar debug de los datos enviados
      console.log('Datos enviados a Rundeck:', {
        jobId,
        jobName,
        options: options || {},
        headers
      });

      // Debug: Mostrar respuesta recibida
      console.log('Respuesta de Rundeck:', response.status);
  
      // Extraer información relevante de la respuesta
      const executionData = response.data;
      
      // Guardar la información de la ejecución en MongoDB con el nombre del job
      const newExecution = new RundeckExecution({
        jobId,
        jobName: jobName || executionData.job?.name || `Job ${jobId}`, // Usar el nombre proporcionado o el de la respuesta
        executionId: executionData.id,
        status: 'running',
        options: options || {},
        projectName: executionData.project,
        description: executionData.job?.name || `Ejecución del job ${jobId}`,
        permalink: executionData.permalink,
      });
  
      await newExecution.save();
  
      res.status(200).json({
        success: true,
        message: 'Job ejecutado correctamente',
        execution: executionData,
        savedToDb: true
      });
      
    } catch (error) {
      console.error('Error al ejecutar el job:', error);
      res.status(500).json({ 
        error: 'Error al ejecutar el job', 
        details: error.message 
      });
    }
  };

// Controlador para obtener el estado de una ejecución
export const getExecutionStatusController = async (req, res) => {
    try {
      const { executionId } = req.params;
      
      // Obtener datos de la ejecución desde Rundeck
      const response = await axios.get(
        `${RUNDECK_API_URL}/execution/${executionId}`, 
        { headers }
      );
      
      const executionData = response.data;
      
      // Actualizar el estado en MongoDB
      const execution = await RundeckExecution.findOne({ executionId });
      
      if (execution) {
        execution.status = executionData.status || 'unknown';
        
        if (executionData.status === 'succeeded' || 
            executionData.status === 'failed' || 
            executionData.status === 'aborted') {
          execution.endedAt = new Date();
        }
        
        // Guardar resultado si está disponible
        if (executionData.output) {
          execution.logOutput = executionData.output;
        }
        
        // Guardar resultado si está disponible
        if (executionData.result) {
          execution.result = executionData.result;
        }
        
        await execution.save();
      }
      
      res.status(200).json({
        success: true,
        execution: executionData,
        savedToDb: !!execution
      });
      
    } catch (error) {
      console.error('Error al obtener estado de ejecución:', error);
      res.status(500).json({ 
        error: 'Error al obtener estado de ejecución', 
        details: error.message 
      });
    }
  };

// Controlador para listar los jobs disponibles en un proyecto
export const listProjectJobsController = async (req, res) => {
    try {
        const { projectName } = req.params;
        
        if (!projectName) {
            return res.status(400).json({ error: "Se requiere un nombre de proyecto" });
        }
        
        const jobs = await listProjectJobs(projectName);
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Nuevo controlador para listar ejecuciones almacenadas en MongoDB
export const listSavedExecutionsController = async (req, res) => {
    try {
      const { jobId, status } = req.query;
      let query = {};
      
      if (jobId) query.jobId = jobId;
      if (status) query.status = status;
      
      const filter = {};
      
      // Safely apply filters only if they match expected values
      if (jobId && typeof jobId === 'string') {
        filter.jobId = jobId;
      }
      
      if (status && ['running', 'succeeded', 'failed', 'aborted'].includes(status)) {
        filter.status = status;
      }
      
      const executions = await RundeckExecution.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);
      
      res.status(200).json({
        success: true,
        count: executions.length,
        executions
      });
      
    } catch (error) {
      console.error('Error al listar ejecuciones guardadas:', error);
      res.status(500).json({ 
        error: 'Error al listar ejecuciones guardadas', 
        details: error.message 
      });
    }
  };