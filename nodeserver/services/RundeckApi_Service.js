import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuración básica para las llamadas a Rundeck
const rundeckConfig = {
    baseURL: process.env.RUNDECK_API_URL,
    headers: {
        'X-Rundeck-Auth-Token': process.env.RUNDECK_API_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Servicio para ejecutar un job en Rundeck
export const executeRundeckJob = async (jobId, options = {}) => {
    try {
        const rundeckClient = axios.create(rundeckConfig);
        const response = await rundeckClient.post(`/job/${jobId}/executions`, options);
        return response.data;
    } catch (error) {
        console.error('Error ejecutando job en Rundeck:', error.response?.data || error.message);
        throw new Error(`Error al ejecutar job en Rundeck: ${error.message}`);
    }
};

// Servicio para obtener los detalles de una ejecución
export const getExecutionStatus = async (executionId) => {
    try {
        const rundeckClient = axios.create(rundeckConfig);
        const response = await rundeckClient.get(`/execution/${executionId}`);
        return response.data;
    } catch (error) {
        console.error('Error obteniendo el estado de la ejecución:', error.response?.data || error.message);
        throw new Error(`Error al obtener el estado de la ejecución: ${error.message}`);
    }
};

// Servicio para listar los jobs disponibles en un proyecto
export const listProjectJobs = async (projectName) => {
    try {
        console.log(`Solicitando jobs para el proyecto: ${projectName}`);
        console.log(`URL: ${rundeckConfig.baseURL}/project/${projectName}/jobs`);
        console.log('Headers:', rundeckConfig.headers);
        
        const rundeckClient = axios.create(rundeckConfig);
        const response = await rundeckClient.post(`/project/${projectName}/jobs`, {});
        
        console.log(`Respuesta recibida para jobs de ${projectName}:`, response.status);
        return response.data;
    } catch (error) {
        console.error('Error obteniendo jobs del proyecto:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        
        if (error.response) {
            console.error('Headers de respuesta:', error.response.headers);
        }
        
        throw new Error(`Error al obtener jobs del proyecto: ${error.message}`);
    }
};
