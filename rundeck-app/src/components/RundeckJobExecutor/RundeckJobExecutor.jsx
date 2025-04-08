import { useState, useEffect, useMemo } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import axios from 'axios';
import './RundeckJobExecutor.css';
// import ExecutionSearch from '../ExecutionSearch/ExecutionSearch.jsx';
import { getJobConfiguration } from '../../config/jobConfigurations';
import DynamicJobForm from '../DynamicJobForm/DynamicJobForm';

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
  

  // Recuperar datos de Rundeck
  useEffect(() => {
    setLoading(prev => ({ ...prev, rundeck: true }));
    
    axios.get(`${API_BASE_URL}/rundeck`)
      .then((response) => {
        setListRundeck(response.data);
        setLoading(prev => ({ ...prev, rundeck: false }));
      })
      .catch((error) => {
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
      
      // Cargamos todos los jobs primero
      const response = await axios.get(`${API_BASE_URL}/rundeck/projects/${project}/jobs`);
      
      if (response.data && Array.isArray(response.data)) {
        // Filtramos los jobs que contienen "iaas" en su nombre (insensible a mayúsculas/minúsculas)
        const filteredJobs = response.data.filter(job => 
          job.name && job.name.toLowerCase().includes('iaas')
        );
        
        setJobs(filteredJobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
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
      }
    } catch (err) {
      // Error silencioso
    }
  };

  // Modificar la función handleJobSelect para cargar configuraciones personalizadas
const handleJobSelect = (job) => {
  setSelectedJob(job);
  
  // Obtener configuración personalizada para este job
  const jobConfig = getJobConfiguration(job);
  
  // Inicializar opciones del job basadas en la configuración
  let initialOptions = {};
  
  if (jobConfig && jobConfig.fields) {
    // Usar la configuración personalizada
    jobConfig.fields.forEach(field => {
      initialOptions[field.name] = field.defaultValue || '';
    });
  } else if (job.options) {
    // Usar las opciones predeterminadas del job
    job.options.forEach(option => {
      initialOptions[option.name] = option.defaultValue || '';
    });
  }
  
  setJobOptions(initialOptions);
};

  const handleOptionChange = (e, optionName) => {
    setJobOptions(prev => ({
      ...prev,
      [optionName]: e.target.value
    }));
  };

  // Función para manejar cambios en el formulario dinámico
const handleDynamicFormChange = (fieldName, value) => {
  setJobOptions(prev => ({
    ...prev,
    [fieldName]: value
  }));
};

// Modificar la función executeJob para validar según la configuración
const executeJob = async () => {
  if (!selectedJob) {
    setError('Por favor, selecciona un job antes de ejecutar');
    return;
  }
  
  // Obtener configuración para validación
  const jobConfig = getJobConfiguration(selectedJob);
  
  // Validar campos si hay una función de validación
  if (jobConfig && jobConfig.validate) {
    const errors = jobConfig.validate(jobOptions);
    
    // Si hay errores de validación, mostrar el primero
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      setError(`Error de validación: ${errors[firstErrorField]}`);
      return;
    }
  }
  
  try {
    setLoading(prev => ({ ...prev, general: true }));
    setError(null);
    setExecutionId(null);
    setExecutionStatus(null);
    
    // Extraer el nombre del job
    const jobName = selectedJob.name || selectedJob.jobName || `Job sin nombre`;
    
    const response = await axios.post(`${API_BASE_URL}/rundeck/jobs/execute`, {
      jobId: selectedJob.id || selectedJob.jobId,
      jobName: jobName, // Añadir el nombre del job
      options: jobOptions
    });
    
    if (response.data && response.data.execution && response.data.execution.id) {
      setExecutionId(response.data.execution.id);
      setExecutionStatus('running');
    } else if (response.data && response.data.id) {
      setExecutionId(response.data.id);
      setExecutionStatus('running');
    } else {
      setError('Respuesta inesperada del servidor al ejecutar el job');
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
      // Error silencioso
    }
  };

  // Función para obtener el nombre del job a partir de su ID
  const getJobName = (jobId) => {
    // Primero buscar en nuestro almacén de referencias
    if (allJobs[jobId]) {
      return allJobs[jobId].name || allJobs[jobId].jobName || jobId;
    }
    // Si no lo encontramos, devolver una representación amigable del ID
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

  // Función para procesar ejecuciones y obtener nombres de jobs
const processedExecutions = useMemo(() => {
  return recentExecutions.map(execution => {
    // Priorizar el campo jobName guardado específicamente, luego buscar otras fuentes
    let resolvedName = 
      execution.jobName ||  // Usar primero el nombre guardado directamente
      execution.job?.name || 
      execution.description || 
      'Job sin nombre';
    
    // Si tenemos un jobId y no tenemos el jobName, intentamos encontrarlo en allJobs
    if (execution.jobId && !execution.jobName) {
      // Buscar en todos los proyectos
      for (const projectName in allJobs) {
        const projectJobs = allJobs[projectName];
        const matchingJob = projectJobs.find(job => 
          (job.id && job.id === execution.jobId) || 
          (job.jobId && job.jobId === execution.jobId)
        );
        
        if (matchingJob) {
          // Encontramos el job, usamos su nombre
          resolvedName = matchingJob.name || matchingJob.jobName;
          break;
        }
      }
    }
    
    return {
      ...execution,
      resolvedJobName: resolvedName // Nombre resuelto para mostrar en la UI
    };
  });
}, [recentExecutions, allJobs]);

  return (
    <div className="rundeck-job-executor">
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
                {jobs.map((job, index) => {
                  // Crear un identificador único para cada job
                  const jobUniqueId = job.id || job.jobId || job.uuid;
                  const selectedJobId = selectedJob?.id || selectedJob?.jobId || selectedJob?.uuid;
                  
                  // Comparación estricta para saber si este job es el seleccionado
                  const isSelected = selectedJob && jobUniqueId === selectedJobId;
                  
                  return (
                    <li 
                      key={jobUniqueId || `job-${index}`}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleJobSelect(job)}
                    >
                      {job.name || job.jobName || 'Job sin nombre'}
                    </li>
                  );
                })}
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
            
            {/* Usar el componente de formulario dinámico si hay configuración personalizada */}
            {getJobConfiguration(selectedJob) ? (
              <DynamicJobForm 
                jobConfig={getJobConfiguration(selectedJob)}
                formValues={jobOptions}
                onChange={handleDynamicFormChange}
              />
            ) : selectedJob.options && selectedJob.options.length > 0 ? (
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
            ) : (
              <p className="no-options-message">Este job no tiene opciones configurables</p>
            )}
            
            <button 
              className="execute-button"
              onClick={() => {
                if (window.confirm(`¿Estás seguro que deseas ejecutar el job "${selectedJob.name || selectedJob.jobName || 'seleccionado'}"?`)) {
                  executeJob();
                }
              }}
              disabled={loading.general}
            >
              {loading.general ? 'Ejecutando...' : 'Ejecutar Job'}
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
                {/* Eliminada la columna "Fin" */}
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
                    {execution.resolvedJobName || 'Job sin nombre'}
                  </td>
                  <td className={`execution-status ${getStatusClass(execution.status)}`}>
                    {execution.status}
                  </td>
                  <td className="execution-date">{formatDate(execution.startedAt)}</td>
                  {/* Eliminada la celda que mostraba la hora de finalización */}
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