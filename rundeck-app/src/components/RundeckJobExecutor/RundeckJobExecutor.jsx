import { useState, useEffect } from 'react';
import axios from 'axios';
import './RundeckJobExecutor.css';

const API_BASE_URL = 'http://localhost:5001/api';

// Proyectos predefinidos
const PREDEFINED_PROJECTS = [
  'TRANSACTIONAL_SYSTEMS_WINDOWS',
  'TRANSACTIONAL_SYSTEMS_LINUX',
  'GENERAL'
];

export default function RundeckJobExecutor({ initialProject = null }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobOptions, setJobOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionId, setExecutionId] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialProject);

  // Cargar los jobs disponibles cuando se selecciona un proyecto
  useEffect(() => {
    if (selectedProject) {
      loadJobs(selectedProject);
    } else {
      setJobs([]);
      setSelectedJob(null);
    }
  }, [selectedProject]);

  // Cargar ejecuciones recientes
  useEffect(() => {
    loadRecentExecutions();
  }, []);

  // Verificar estado de ejecución
  useEffect(() => {
    let interval;
    if (executionId) {
      interval = setInterval(() => {
        checkExecutionStatus(executionId);
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [executionId]);

  const loadJobs = async (project) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/rundeck/projects/${project}/jobs`);
      
      if (response.data && Array.isArray(response.data.jobs)) {
        setJobs(response.data.jobs);
      } else {
        setJobs([]);
        setError('No se encontraron jobs para este proyecto o formato de respuesta inesperado');
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Error al cargar los jobs: ${err.message}`);
      console.error('Error al cargar los jobs:', err);
    }
  };

  const loadRecentExecutions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rundeck/saved-executions`);
      if (response.data && Array.isArray(response.data.executions)) {
        setRecentExecutions(response.data.executions || []);
      } else {
        console.error('Formato de respuesta inesperado para ejecuciones:', response.data);
      }
    } catch (err) {
      console.error('Error al cargar ejecuciones recientes:', err);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    // Inicializar las opciones si el job tiene parámetros
    if (job.options) {
      const initialOptions = {};
      job.options.forEach(option => {
        initialOptions[option.name] = option.defaultValue || '';
      });
      setJobOptions(initialOptions);
    } else {
      setJobOptions({});
    }
  };

  const handleOptionChange = (e, optionName) => {
    setJobOptions(prev => ({
      ...prev,
      [optionName]: e.target.value
    }));
  };

  const executeJob = async () => {
    if (!selectedJob) {
      setError('Por favor, selecciona un job antes de ejecutar');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setExecutionId(null);
      setExecutionStatus(null);
      
      const response = await axios.post(`${API_BASE_URL}/rundeck/jobs/execute`, {
        jobId: selectedJob.id,
        options: jobOptions
      });
      
      if (response.data && response.data.execution && response.data.execution.id) {
        setExecutionId(response.data.execution.id);
        setExecutionStatus('running');
      } else {
        setError('Respuesta inesperada del servidor al ejecutar el job');
      }
      
      setLoading(false);
      
      // Recargar ejecuciones recientes
      setTimeout(() => loadRecentExecutions(), 1000);
    } catch (err) {
      setLoading(false);
      setError(`Error al ejecutar el job: ${err.message}`);
      console.error('Error al ejecutar el job:', err);
    }
  };

  const checkExecutionStatus = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rundeck/executions/${id}`);
      
      if (response.data && response.data.execution) {
        setExecutionStatus(response.data.execution.status);
        
        // Si ya terminó, detener las actualizaciones y recargar la lista
        if (['succeeded', 'failed', 'aborted'].includes(response.data.execution.status)) {
          setTimeout(() => loadRecentExecutions(), 1000);
        }
      }
    } catch (err) {
      console.error('Error al verificar estado de ejecución:', err);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'succeeded') return 'status-success';
    if (status === 'failed') return 'status-failed';
    if (status === 'aborted') return 'status-aborted';
    if (status === 'running') return 'status-running';
    return 'status-unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="rundeck-job-executor">
      <div className="job-selector-panel">
        <h3>Selector de Proyecto</h3>
        <div className="project-selector">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="project-dropdown"
          >
            <option value="">-- Seleccionar Proyecto --</option>
            {PREDEFINED_PROJECTS.map(project => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
        
        {selectedProject && (
          <>
            <h3>Jobs disponibles</h3>
            {loading && <div className="loading">Cargando jobs...</div>}
            {error && <div className="error">{error}</div>}
            
            {jobs.length > 0 ? (
              <ul className="job-list">
                {jobs.map(job => (
                  <li 
                    key={job.id}
                    className={selectedJob && selectedJob.id === job.id ? 'selected' : ''}
                    onClick={() => handleJobSelect(job)}
                  >
                    {job.name}
                  </li>
                ))}
              </ul>
            ) : !loading && !error ? (
              <p className="no-jobs-message">No hay jobs disponibles para este proyecto</p>
            ) : null}
          </>
        )}
      </div>

      <div className="job-executor-panel">
        {selectedJob ? (
          <>
            <h3>{selectedJob.name}</h3>
            {selectedJob.description && <p className="job-description">{selectedJob.description}</p>}
            
            {selectedJob.options && selectedJob.options.length > 0 && (
              <div className="job-options">
                <h4>Opciones</h4>
                {selectedJob.options.map(option => (
                  <div key={option.name} className="option-field">
                    <label>
                      {option.name}
                      {option.required && <span className="required">*</span>}:
                    </label>
                    <input 
                      type="text"
                      value={jobOptions[option.name] || ''}
                      onChange={(e) => handleOptionChange(e, option.name)}
                      placeholder={option.description || option.name}
                    />
                    {option.description && (
                      <small className="option-description">{option.description}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="execute-button"
              onClick={executeJob}
              disabled={loading}
            >
              {loading ? 'Ejecutando...' : 'Ejecutar Job'}
            </button>

            {executionId && (
              <div className="execution-status">
                <h4>Estado de la ejecución</h4>
                <p>ID: {executionId}</p>
                <p>
                  Estado: <span className={getStatusClass(executionStatus)}>
                    {executionStatus || 'Desconocido'}
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="select-job-message">
            {selectedProject ? (
              <p>Selecciona un job para ejecutar</p>
            ) : (
              <p>Primero selecciona un proyecto</p>
            )}
          </div>
        )}
      </div>

      <div className="recent-executions-panel">
        <h3>Ejecuciones recientes</h3>
        
        {recentExecutions.length > 0 ? (
          <table className="executions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {recentExecutions.map(execution => (
                <tr key={execution.executionId}>
                  <td>{execution.executionId}</td>
                  <td>{execution.description || execution.jobId}</td>
                  <td className={getStatusClass(execution.status)}>
                    {execution.status}
                  </td>
                  <td>{formatDate(execution.startedAt)}</td>
                  <td>{formatDate(execution.endedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-executions-message">No hay ejecuciones recientes</p>
        )}
      </div>
    </div>
  );
}