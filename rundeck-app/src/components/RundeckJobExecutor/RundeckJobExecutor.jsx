import { useState, useEffect, useMemo } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';
import './RundeckJobExecutor.css';
import { getJobConfiguration } from './jobConfigurations';
// import ExecutionSearch from '../ExecutionSearch/ExecutionSearch.jsx';

const API_BASE_URL = 'http://localhost:5001/api';

// Proyectos predefinidos
const PREDEFINED_PROJECTS = [
  // 'TRANSACTIONAL_SYSTEMS_WINDOWS',
  // 'TRANSACTIONAL_SYSTEMS_LINUX',
  'TEST_EDU'
];

export default function RundeckJobExecutor({ initialProject = null, initialRundeck = null }) {
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState({}); // Almacén de todos los jobs cargados de todos los proyectos
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobOptions, setJobOptions] = useState({});
  const [loading, setLoading] = useState({ general: false, rundeck: false });
  const [error, setError] = useState(null);
  const [executionId, setExecutionId] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [selectedRundeck, setSelectedRundeck] = useState(initialRundeck);
  const [loadingAllJobs, setLoadingAllJobs] = useState(false);
  const [listRundeck, setListRundeck] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  

  // Recuperar datos de Rundeck
  useEffect(() => {
    setLoading(prev => ({ ...prev, rundeck: true }));
    
    axios.get(`${API_BASE_URL}/rundeck`)
      .then((response) => {
        setListRundeck(response.data);
        setLoading(prev => ({ ...prev, rundeck: false }));
        console.log("Datos de Rundeck obtenidos:", response.data);
      })
      .catch((error) => {
        console.error("Error al obtener datos de Rundeck:", error);
        setError(prev => ({ 
          ...prev, 
          rundeck: "Error al cargar instancias de Rundeck" 
        }));
        setLoading(prev => ({ ...prev, rundeck: false }));
      });
  }, []);


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

  // Cargar todos los projects al inicio para tener referencia de nombres
  useEffect(() => {
    loadAllProjectsJobs();
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

  // Función para cargar los jobs de todos los proyectos predefinidos
const loadAllProjectsJobs = async () => {
  setLoadingAllJobs(true);
  console.log('Cargando jobs de todos los proyectos para referencia...');
  
  const jobsMap = { ...allJobs };
  
  for (const project of PREDEFINED_PROJECTS) {
    try {
      const response = await axios.get(`${API_BASE_URL}/rundeck/projects/${project}/jobs`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filtramos aquí también
        const filteredJobs = response.data.filter(job => 
          job.name && job.name.toLowerCase().includes('iaas')
        );
        jobsMap[project] = filteredJobs;
      }
    } catch (err) {
      console.error(`Error cargando jobs del proyecto ${project}:`, err);
      jobsMap[project] = [];
    }
  }
  
  setAllJobs(jobsMap);
  setLoadingAllJobs(false);
};

  const loadJobs = async (project) => {
    try {
      setLoading(prev => ({ ...prev, general: true }));
      setError(null);
      
      console.log(`Cargando jobs para el proyecto: ${project}`);
      
      // Cargamos todos los jobs primero
      const response = await axios.get(`${API_BASE_URL}/rundeck/projects/${project}/jobs`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filtramos los jobs que contienen "iaas" en su nombre (insensible a mayúsculas/minúsculas)
        const filteredJobs = response.data.filter(job => 
          job.name && job.name.toLowerCase().includes('iaas')
        );
        
        setJobs(filteredJobs);
        console.log(`Se cargaron ${filteredJobs.length} jobs con "iaas" en el nombre`);
      } else {
        console.warn('La respuesta no contiene un array de jobs:', response.data);
        setJobs([]);
      }
    } catch (err) {
      console.error('Error cargando jobs:', err);
      setError('Error cargando jobs: ' + (err.response?.data?.error || err.message));
      setJobs([]);
    } finally {
      setLoading(prev => ({ ...prev, general: false }));
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
    console.log('Job seleccionado:', job);
    setSelectedJob(job);
    
    // Obtener la configuración predefinida para este job
    const jobName = job.name || job.jobName;
    const jobConfig = getJobConfiguration(jobName);
    
    if (jobConfig) {
      console.log(`Configuración predefinida encontrada para job: ${jobName}`, jobConfig);
      
      // Inicializar las opciones con los valores por defecto de la configuración
      const initialOptions = {};
      jobConfig.fields.forEach(field => {
        initialOptions[field.name] = field.default || '';
      });
      
      setJobOptions(initialOptions);
      
      // Enriquecemos el job seleccionado con la configuración personalizada
      setSelectedJob({
        ...job,
        customConfig: jobConfig
      });
    } else {
      // Fallback al comportamiento anterior si no hay configuración predefinida
      console.log(`No se encontró configuración predefinida para job: ${jobName}`);
      
      if (job.options) {
        const initialOptions = {};
        job.options.forEach(option => {
          initialOptions[option.name] = option.defaultValue || '';
        });
        setJobOptions(initialOptions);
      } else {
        setJobOptions({});
      }
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
    
    // Si el job tiene configuración personalizada, validamos sus campos
    if (selectedJob.customConfig) {
      const validationErrors = selectedJob.customConfig.validate(jobOptions);
      if (validationErrors && validationErrors.length > 0) {
        setError(`Errores de validación: ${validationErrors.join(', ')}`);
        return;
      }
    }
    
    try {
      setLoading(prev => ({ ...prev, general: true }));
      setError(null);
      setExecutionId(null);
      setExecutionStatus(null);
      
      console.log('Ejecutando job con ID:', selectedJob.id, 'Opciones:', jobOptions);
      
      const response = await axios.post(`${API_BASE_URL}/rundeck/jobs/execute`, {
        jobId: selectedJob.id,
        options: jobOptions
      });
      
      console.log('Respuesta de ejecución:', response.data);
      
      if (response.data && response.data.execution && response.data.execution.id) {
        setExecutionId(response.data.execution.id);
        setExecutionStatus('running');
      } else if (response.data && response.data.id) {
        setExecutionId(response.data.id);
        setExecutionStatus('running');
      } else {
        setError('Respuesta inesperada del servidor al ejecutar el job');
        console.error('Respuesta inesperada:', response.data);
      }
      
      setLoading(prev => ({ ...prev, general: false }));
      
      // Recargar ejecuciones recientes
      setTimeout(() => loadRecentExecutions(), 1000);
    } catch (err) {
      setLoading(prev => ({ ...prev, general: false }));
      let errorMessage = `Error al ejecutar el job: ${err.message}`;
      
      if (err.response && err.response.data) {
        errorMessage += ` - ${JSON.stringify(err.response.data)}`;
      }
      
      setError(errorMessage);
      console.error('Error al ejecutar el job:', err);
    }
  };

  const checkExecutionStatus = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rundeck/executions/${id}`);
      
      if (response.data && response.data.execution) {
        setExecutionStatus(response.data.execution.status);
        
        if (['succeeded', 'failed', 'aborted'].includes(response.data.execution.status)) {
          setTimeout(() => loadRecentExecutions(), 1000);
        }
      } else if (response.data && response.data.status) {
        setExecutionStatus(response.data.status);
        
        if (['succeeded', 'failed', 'aborted'].includes(response.data.status)) {
          setTimeout(() => loadRecentExecutions(), 1000);
        }
      }
    } catch (err) {
      console.error('Error al verificar estado de ejecución:', err);
    }
  };

  // Función para obtener el nombre del job a partir de su ID
  const getJobName = (jobId) => {
    // Primero buscar en nuestro almacén de referencias
    if (allJobs[jobId]) {
      return allJobs[jobId].name || allJobs[jobId].jobName || jobId;
    }
    
    // Si no lo encontramos, devolver una representación amigable del ID
    // return `Job ${jobId.substring(0, 8)}...`;
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

  // Procesamiento de ejecuciones para mostrar nombres de jobs
  const processedExecutions = useMemo(() => {
    return recentExecutions.map(execution => ({
      ...execution,
      jobName: execution.description || getJobName(execution.jobId)
    }));
  }, [recentExecutions, allJobs]);

  return (
    <div className="rundeck-job-executor">
      {/* Añade esto en la parte superior de tu componente */}
      <ConfirmDialog />
      
      {/* SELECTOR PROYECTO       */}
      <div className="job-selector-panel">
        <h3>Selector de Rundeck</h3>
          <div className="rundeck-selector">
            <select
              value={selectedRundeck || ''}
              onChange={(e) => setSelectedRundeck(e.target.value || null)}
              className="project-dropdown"
            >
              <option value="">-- Seleccionar Rundeck --</option>
              {listRundeck.map((rundeck, index) => (
                <option key={index} value={rundeck.name}>
                  {rundeck.name}
                </option>
              ))}
            </select>
          </div>


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
            {loading.general && <div className="loading">Cargando jobs...</div>}
            {error && <div className="error">{error}</div>}
            
            {jobs.length > 0 ? (
              <ul className="job-list">
                {jobs.map(job => (
                  <li 
                    key={job.id || job.jobId || Math.random().toString()}
                    className={
                      selectedJob && 
                      JSON.stringify(job) === JSON.stringify(selectedJob)
                        ? 'selected' 
                        : ''
                    }
                    onClick={() => handleJobSelect(job)}
                  >
                    {job.name || job.jobName || 'Job sin nombre'}
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
            <h3>{selectedJob.name || selectedJob.jobName || 'Job seleccionado'}</h3>
            {selectedJob.description && <p className="job-description">{selectedJob.description}</p>}
            
            {/* Renderizamos opciones según la configuración personalizada o las opciones del job */}
            {selectedJob.customConfig ? (
              <div className="job-options">
                <h4>{selectedJob.customConfig.title || 'Opciones'}</h4>
                
                {selectedJob.customConfig.fields.map(field => (
                  <div key={field.name} className="option-field">
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}:
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={jobOptions[field.name] || ''}
                        onChange={(e) => handleOptionChange(e, field.name)}
                        className="option-input select-input"
                        required={field.required}
                      >
                        <option value="">-- Seleccionar --</option>
                        {field.options && field.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={jobOptions[field.name] || ''}
                        onChange={(e) => handleOptionChange(e, field.name)}
                        placeholder={field.description || ''}
                        className="option-input textarea-input"
                        rows={4}
                        required={field.required}
                      />
                    ) : field.type === 'checkbox' ? (
                      <div className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={jobOptions[field.name] === 'true'}
                          onChange={(e) => handleOptionChange({
                            target: { value: e.target.checked ? 'true' : 'false' }
                          }, field.name)}
                          id={`option-${field.name}`}
                          className="option-checkbox"
                        />
                        <label htmlFor={`option-${field.name}`} className="checkbox-label"></label>
                      </div>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        value={jobOptions[field.name] || ''}
                        onChange={(e) => handleOptionChange(e, field.name)}
                        placeholder={field.description || ''}
                        className="option-input"
                        min={field.min}
                        max={field.max}
                        required={field.required}
                      />
                    ) : (
                      <input 
                        type="text"
                        value={jobOptions[field.name] || ''}
                        onChange={(e) => handleOptionChange(e, field.name)}
                        placeholder={field.description || ''}
                        className="option-input"
                        required={field.required}
                      />
                    )}
                    
                    {field.description && (
                      <small className="option-description">{field.description}</small>
                    )}
                  </div>
                ))}
              </div>
            ) : selectedJob.options && selectedJob.options.length > 0 ? (
              /* Formulario existente para opciones originales del job */
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
                      className="option-input"
                    />
                    {option.description && (
                      <small className="option-description">{option.description}</small>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-options-message">Este job no tiene opciones configurables</p>
            )}
            
            <button 
              className="execute-button"
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading.general}
            >
              {loading.general ? 'Ejecutando...' : 'Ejecutar Job'}
            </button>

            {showConfirmDialog && (
              <div className="custom-confirm-overlay">
                <div className="custom-confirm-dialog">
                  <h4>Confirmar ejecución</h4>
                  <p>¿Estás seguro que deseas ejecutar el job "{selectedJob.name || selectedJob.jobName || 'seleccionado'}"?</p>
                  <div className="custom-confirm-actions">
                    <button 
                      className="confirm-cancel-btn"
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="confirm-execute-btn"
                      onClick={() => {
                        setShowConfirmDialog(false);
                        executeJob();
                      }}
                    >
                      Ejecutar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            {/* Sección de estado de ejecución existente */}
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

        {loadingAllJobs && (
          <div className="loading-info">Cargando información de jobs...</div>
        )}

        {/* Buscador de ejecuciones recientes */}
        {/* <ExecutionSearch executions={processedExecutions} /> */}
        
        {processedExecutions.length > 0 ? (
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
              {processedExecutions.map(execution => (
                <tr key={execution.executionId}
                    className={`execution-row ${execution.status === 'running' ? 'running-execution' : ''}`}>
                  <td className="execution-id">
                    <a href={execution.permalink} target="_blank" rel="noopener noreferrer">
                      {execution.executionId}
                    </a>
                  </td>
                  <td className="job-name">
                    <div className="tooltip-container">
                      {execution.description}
                      {/* <span className="tooltip-text">ID: {execution.jobId}</span> */}
                    </div>
                  </td>
                  <td className={`execution-status ${getStatusClass(execution.status)}`}>
                    {execution.status}
                  </td>
                  <td className="execution-date">{formatDate(execution.startedAt)}</td>
                  <td className="execution-date">{formatDate(execution.endedAt)}</td>
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