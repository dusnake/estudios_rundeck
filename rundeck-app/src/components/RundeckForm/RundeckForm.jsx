import { useState, useEffect } from 'react'; // Importamos useEffect
import axios from 'axios';
import './RundeckForm.css';
import { exportExecutionsToExcel } from '../../utils/ExcelExporter';
import ExcelExportButton from '../ExcelExportButton/ExcelExportButton';


export default function RundeckForm() {
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    changeType: '',
    machines: '',
    complianceOptions: [],
    patchingVersion: ''
  });
  
  // Estado para manejar la respuesta y estado de envío
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    error: null,
    success: false,
    response: null
  });

  // Nuevo estado para las ejecuciones
  const [executions, setExecutions] = useState([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  // Opciones para el combo de tipo de cambio
  const changeTypeOptions = [
    { value: '', label: 'Seleccione un tipo de cambio' },
    ...(import.meta.env.VITE_CHG_CATEGORIES ? JSON.parse(import.meta.env.VITE_CHG_CATEGORIES) : [])
  ];
  
  // Opciones para el combo de compliance
  const complianceOptions = import.meta.env.VITE_COMPLIANCE_OPTIONS ? 
    import.meta.env.VITE_COMPLIANCE_OPTIONS.split(',').map(value => ({ value: value.trim(), label: value.trim() })) : 
    [];
  
  // Opciones para el combo de patching
  const patchingOptions = import.meta.env.VITE_PATCHING_OPTIONS ? 
    import.meta.env.VITE_PATCHING_OPTIONS.split(',').map(value => ({ value: value.trim(), label: value.trim() })) : 
    [];

  // Cargar ejecuciones al montar el componente
  useEffect(() => {
    fetchExecutions();
  }, []);

  // Función para cargar las ejecuciones desde MongoDB
  const fetchExecutions = async () => {
    try {
      setLoadingExecutions(true);
      const response = await axios.get('http://localhost:5001/api/rundeck/form-executions');
      setExecutions(response.data.executions || []);
    } catch (error) {
      console.error('Error al cargar las ejecuciones:', error);
    } finally {
      setLoadingExecutions(false);
    }
  };

  // Formatear fecha para mostrarla en la tabla
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'changeType') {
      // Reiniciar opciones específicas al cambiar el tipo
      setFormData(prev => ({
        ...prev,
        [name]: value,
        complianceOptions: [],
        patchingVersion: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Manejar la selección de una regla de compliance
  const handleComplianceOptionClick = (optionValue) => {
    setFormData(prev => {
      // Si ya está seleccionada, la quitamos
      if (prev.complianceOptions.includes(optionValue)) {
        return {
          ...prev,
          complianceOptions: prev.complianceOptions.filter(value => value !== optionValue)
        };
      } 
      // Si no está seleccionada, la añadimos
      else {
        return {
          ...prev,
          complianceOptions: [...prev.complianceOptions, optionValue]
        };
      }
    });
  };
  
  // Eliminar una regla de compliance de la lista seleccionada
  const removeComplianceOption = (optionValue) => {
    setFormData(prev => ({
      ...prev,
      complianceOptions: prev.complianceOptions.filter(value => value !== optionValue)
    }));
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    let hasError = false;
    
    if (!formData.changeType) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, seleccione un tipo de cambio.",
        success: false,
        response: null
      });
      hasError = true;
    } else if (formData.changeType === 'compliance' && formData.complianceOptions.length === 0) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, seleccione al menos una opción de compliance.",
        success: false,
        response: null
      });
      hasError = true;
    } else if (formData.changeType === 'patching' && !formData.patchingVersion) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, seleccione una versión de patching.",
        success: false,
        response: null
      });
      hasError = true;
    } else if (!formData.machines) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, ingrese al menos una máquina.",
        success: false,
        response: null
      });
      hasError = true;
    }
    
    if (hasError) {
      return;
    }
    
    // Iniciar proceso de envío
    setSubmitStatus({
      loading: true,
      error: null,
      success: false,
      response: null
    });
    
    try {
      // Preparar los datos a enviar según el tipo de cambio
      const dataToSend = {
        changeType: formData.changeType,
        machines: formData.machines,
        options: {
          changeType: formData.changeType,
          machines: formData.machines
        }
      };
      
      // Añadir datos específicos según el tipo de cambio
      if (formData.changeType === 'compliance') {
        dataToSend.specificOptions = formData.complianceOptions;
        dataToSend.options.specificOptions = formData.complianceOptions;
      } else if (formData.changeType === 'patching') {
        dataToSend.specificOptions = formData.patchingVersion;
        dataToSend.options.specificOptions = formData.patchingVersion;
      }
      
      // Enviar datos a la API
      console.log('Enviando datos:', dataToSend);
      const response = await axios.post('http://localhost:5001/api/rundeck/form-submit', dataToSend);
      
      // Actualizar estado con respuesta exitosa
      setSubmitStatus({
        loading: false,
        error: null,
        success: true,
        response: response.data
      });
      
      // Actualizar la lista de ejecuciones
      setTimeout(() => fetchExecutions(), 1000);
      
      // Limpiar formulario después de envío exitoso
      setFormData({
        changeType: '',
        machines: '',
        complianceOptions: [],
        patchingVersion: ''
      });
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSubmitStatus(prev => ({
          ...prev,
          success: false,
          response: null
        }));
      }, 5000);
      
    } catch (error) {
      // Manejar error
      console.error('Error al enviar formulario:', error);
      
      setSubmitStatus({
        loading: false,
        error: error.response?.data?.message || 
               error.message || 
               "Ocurrió un error al enviar el formulario.",
        success: false,
        response: null
      });
    }
  };

  // Función para exportar a Excel simplificada
  const handleExportToExcel = async () => {
    if (executions.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    
    try {
      await exportExecutionsToExcel(executions, formatDate);
      console.log("Archivo Excel generado correctamente");
    } catch (error) {
      console.error("Error al generar archivo Excel:", error);
      alert("Ocurrió un error al exportar los datos: " + error.message);
    }
  };

  // Renderizar componente
  return (
    <div className="rundeck-form-container">
      <h3>Formulario para Rundeck</h3>
      
      <form onSubmit={handleSubmit} className="rundeck-form">
        <div className="form-group">
          <label htmlFor="changeType">Tipo de cambio:</label>
          <select 
            id="changeType" 
            name="changeType" 
            value={formData.changeType}
            onChange={handleChange}
            className="form-control"
          >
            {changeTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selector tipo "chips" para Compliance */}
        {formData.changeType === 'compliance' && (
          <div className="form-group">
            <label>Opciones de Compliance:</label>
            <div className="compliance-options-container">
              {complianceOptions.map(option => (
                <div 
                  key={option.value}
                  className={`compliance-option ${formData.complianceOptions.includes(option.value) ? 'selected' : ''}`}
                  onClick={() => handleComplianceOptionClick(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
            
            {/* Lista de opciones seleccionadas */}
            {formData.complianceOptions.length > 0 && (
              <div className="selected-options">
                <div className="selected-options-header">Reglas seleccionadas:</div>
                <div className="selected-options-list">
                  {formData.complianceOptions.map(optionValue => {
                    const option = complianceOptions.find(opt => opt.value === optionValue);
                    return (
                      <div key={optionValue} className="selected-option">
                        <span>{option ? option.label : optionValue}</span>
                        <button 
                          type="button" 
                          className="remove-option" 
                          onClick={() => removeComplianceOption(optionValue)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        

        
        {/* Selector único para Patching */}
        {formData.changeType === 'patching' && (
          <div className="form-group">
            <label htmlFor="patchingVersion">Versión de Patching:</label>
            <select 
              id="patchingVersion" 
              name="patchingVersion" 
              value={formData.patchingVersion}
              onChange={handleChange}
              className="form-control"
            >
              <option value="">Seleccione una versión</option>
              {patchingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="machines">Máquinas:</label>
          <textarea 
            id="machines" 
            name="machines" 
            value={formData.machines}
            onChange={handleChange}
            placeholder="Ingrese las máquinas del mismo cliente (una por línea)"
            className="form-control"
            rows="4"
          />
        </div>
                
        <div className="form-actions">
          <button 
            type="submit" 
            className={`submit-button ${submitStatus.loading ? 'loading' : ''}`}
            disabled={submitStatus.loading}
          >
            {submitStatus.loading ? (
              <>
                <span className="spinner"></span>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg className="rundeck-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12L13 4V9C13 9.55 12.55 10 12 10H5C4.45 10 4 10.45 4 11V13C4 13.55 4.45 14 5 14H12C12.55 14 13 14.45 13 15V20L21 12Z" fill="currentColor"/>
                </svg>
                <span>Enviar a Rundeck</span>
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Mostrar mensajes de error o éxito */}
      {submitStatus.error && (
        <div className="form-message error">
          <span className="icon">⚠️</span> {submitStatus.error}
        </div>
      )}
      
      {submitStatus.success && (
        <div className="form-message success">
          <span className="icon">✅</span> El formulario se ha enviado correctamente.
          {submitStatus.response?.executionId && (
            <p className="execution-id">ID de ejecución: {submitStatus.response.executionId}</p>
          )}
        </div>
      )}
      
      {/* Nueva tabla de ejecuciones */}
      <div className="form-executions-container">
        <h3>Historial de ejecuciones</h3>
        
        {/* Botón para exportar a Excel */}
        <ExcelExportButton 
            onClick={handleExportToExcel}
            isDisabled={loadingExecutions || executions.length === 0}
          />

        {loadingExecutions ? (
          <div className="loading-indicator">Cargando ejecuciones...</div>
        ) : executions.length > 0 ? (
          <div className="executions-table-container">
            <table className="executions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Detalles</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(execution => (
                  <tr key={execution._id || execution.executionId} className={`execution-row ${execution.status === 'running' ? 'running-execution' : ''}`}>
                    <td>
                      {execution.permalink ? (
                        <a href={execution.permalink} target="_blank" rel="noopener noreferrer">
                          {execution.executionId}
                        </a>
                      ) : execution.executionId}
                    </td>
                    <td>
                      {/* Mostrar el tipo de cambio */}
                      {execution.options?.changeType || 
                      execution.changeType || 
                      'N/A'}
                    </td>
                    <td>
                      <details>
                        <summary>Ver detalles</summary>
                        <div className="execution-details">
                          {/* Mostrar las opciones específicas */}
                          <div>
                            <strong>Tipo:</strong> {
                              (execution.options?.changeType || execution.changeType) === 'compliance' ? 'Compliance' : 
                              (execution.options?.changeType || execution.changeType) === 'patching' ? 'Patching' : 
                              'Desconocido'
                            }
                          </div>
                          
                          {/* Mostrar las opciones específicas según el tipo */}
                          {(execution.options?.specificOptions || execution.specificOptions) && (
                            <div>
                              <strong>
                                {(execution.options?.changeType || execution.changeType) === 'compliance' ? 'Reglas: ' : 'Versión: '}
                              </strong>
                              {Array.isArray(execution.options?.specificOptions || execution.specificOptions) 
                                ? (execution.options?.specificOptions || execution.specificOptions).join(', ')
                                : (execution.options?.specificOptions || execution.specificOptions)}
                            </div>
                          )}
                          
                          {/* Mostrar información sobre las máquinas */}
                          {(execution.options?.machines || execution.machines) && (
                            <div>
                              <strong>Máquinas:</strong> {
                                typeof (execution.options?.machines || execution.machines) === 'string'
                                  ? (execution.options?.machines || execution.machines).split(/[\n,]+/).length + ' máquina(s)'
                                  : Array.isArray(execution.options?.machines || execution.machines)
                                    ? (execution.options?.machines || execution.machines).length + ' máquina(s)'
                                    : 'N/A'
                              }
                              <details>
                                <summary>Ver máquinas</summary>
                                <pre className="machines-list">
                                  {typeof (execution.options?.machines || execution.machines) === 'string'
                                    ? (execution.options?.machines || execution.machines)
                                    : Array.isArray(execution.options?.machines || execution.machines)
                                      ? (execution.options?.machines || execution.machines).join('\n')
                                      : 'No hay máquinas especificadas'
                                  }
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                    <td className={`execution-status ${execution.status === 'succeeded' ? 'status-success' : 
                                     execution.status === 'failed' ? 'status-failed' : 
                                     execution.status === 'running' ? 'status-running' : 
                                     execution.status === 'aborted' ? 'status-aborted' : 'status-unknown'}`}>
                      {execution.status || 'Desconocido'}
                    </td>
                    <td>{formatDate(execution.createdAt || execution.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-executions-message">No hay ejecuciones registradas</div>
        )}
      </div>
    </div>
  );
}