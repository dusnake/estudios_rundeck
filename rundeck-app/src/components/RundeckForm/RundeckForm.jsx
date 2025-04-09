// Importaciones necesarias para el funcionamiento del componente
import { useState, useEffect } from 'react'; // Hooks de React para manejar estado y efectos
import axios from 'axios'; // Cliente HTTP para realizar peticiones a la API
import './RundeckForm.css'; // Estilos específicos para el componente
import { exportExecutionsToExcel } from '../../utils/ExcelExporter'; // Utilidad para exportar datos a Excel
import ExcelExportButton from '../ExcelExportButton/ExcelExportButton'; // Componente botón para la exportación
import ExecutionsFilter from '../ExecutionsFilter/ExecutionsFilter'; // Componente para filtrar ejecuciones
import RefreshButton from '../RefreshButton/RefreshButton'; // Componente botón para refrescar
import DateTimeRangePicker from '../DateTimeRangePicker/DateTimeRangePicker'; // Componente para seleccionar rango de fecha y hora


export default function RundeckForm() {
  // Estado para manejar los datos del formulario
  // Cada campo representa un valor diferente del formulario
  const [formData, setFormData] = useState({
    changeType: '',           // Tipo de cambio seleccionado (compliance, patching, etc.)
    machines: '',             // Lista de máquinas ingresadas como texto
    complianceOptions: [],    // Opciones de compliance seleccionadas (para el tipo compliance)
    patchingVersion: '',      // Versión de patching seleccionada (para el tipo patching)
    startDate: '',            // Fecha de inicio para compliance y patching
    endDate: ''               // Fecha de fin para compliance y patching
  });

  // Nuevo estado para manejar las ejecuciones filtradas
  const [filteredExecutions, setFilteredExecutions] = useState([]);


  // Estado para manejar los diferentes estados del envío del formulario
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,           // Indica si se está procesando una solicitud
    error: null,              // Mensaje de error, si existe
    success: false,           // Indica si la solicitud fue exitosa
    response: null            // Datos de respuesta de la API
  });

  // Estados para manejar las ejecuciones de Rundeck recuperadas de MongoDB
  const [executions, setExecutions] = useState([]); // Lista de ejecuciones
  const [loadingExecutions, setLoadingExecutions] = useState(false); // Indica si se están cargando las ejecuciones

  // Agregar estado para controlar si está refrescando
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Opciones para los selectores del formulario
  // Carga opciones desde variables de entorno (configuradas en .env)
  const changeTypeOptions = [
    { value: '', label: 'Seleccione un tipo de cambio' }, // Opción por defecto
    // Carga dinámicamente los tipos de cambio desde variables de entorno o usa un array vacío si no existe
    ...(import.meta.env.VITE_CHG_CATEGORIES ? JSON.parse(import.meta.env.VITE_CHG_CATEGORIES) : [])
  ];
  
  // Opciones para el selector de compliance (convertidas de string a array de objetos)
  const complianceOptions = import.meta.env.VITE_COMPLIANCE_OPTIONS ? 
    import.meta.env.VITE_COMPLIANCE_OPTIONS.split(',').map(value => ({ value: value.trim(), label: value.trim() })) : 
    [];
  
  // Opciones para el selector de patching (convertidas de string a array de objetos)
  const patchingOptions = import.meta.env.VITE_PATCHING_OPTIONS ? 
    import.meta.env.VITE_PATCHING_OPTIONS.split(',').map(value => ({ value: value.trim(), label: value.trim() })) : 
    [];

  // Hook useEffect que se ejecuta al montar el componente
  // Carga las ejecuciones desde la API cuando el componente se inicializa
  useEffect(() => {
    fetchExecutions();
  }, []);

  // Función asincrónica para obtener las ejecuciones desde MongoDB a través de la API
  const fetchExecutions = async () => {
    try {
      setLoadingExecutions(true);
      const response = await axios.get('http://localhost:5001/api/rundeck/form-executions');
      setExecutions(response.data.executions || []);
      
      // No hacemos scroll automático después de cargar 
      // El usuario controlará cuándo y dónde hacer scroll
    } catch (error) {
      console.error('Error al cargar las ejecuciones:', error);
    } finally {
      setLoadingExecutions(false);
    }
  };

  // Función para refrescar las ejecuciones
  const handleRefreshExecutions = async () => {
    setIsRefreshing(true);
    try {
      await fetchExecutions();
    } catch (error) {
      console.error('Error al refrescar ejecuciones:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función auxiliar para formatear fechas para mostrarlas en la interfaz
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Si no hay fecha, devuelve 'N/A'
    const date = new Date(dateString); // Convierte el string a objeto Date
    return date.toLocaleString(); // Formatea la fecha según la configuración local del navegador
  };

  // Maneja los cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target; // Extrae nombre y valor del campo modificado
    
    if (name === 'changeType') {
      // Si cambia el tipo de cambio, reinicia las opciones específicas
      // para evitar que queden selecciones incompatibles
      setFormData(prev => ({
        ...prev,
        [name]: value,
        complianceOptions: [], // Reinicia opciones de compliance
        patchingVersion: '', // Reinicia versión de patching
        startDate: '', // Reinicia fecha de inicio
        endDate: '' // Reinicia fecha de fin
      }));
    } else {
      // Para otros campos, simplemente actualiza el valor correspondiente
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Función para manejar la selección tipo "chip" de opciones de compliance
  // Estas son selecciones múltiples que se pueden activar/desactivar
  const handleComplianceOptionClick = (optionValue) => {
    setFormData(prev => {
      // Si la opción ya está seleccionada, la quita del array
      if (prev.complianceOptions.includes(optionValue)) {
        return {
          ...prev,
          complianceOptions: prev.complianceOptions.filter(value => value !== optionValue)
        };
      } 
      // Si no está seleccionada, la añade al array
      else {
        return {
          ...prev,
          complianceOptions: [...prev.complianceOptions, optionValue]
        };
      }
    });
  };
  
  // Función para eliminar una opción de compliance de la lista seleccionada
  // (desde el listado de "chips" seleccionados)
  const removeComplianceOption = (optionValue) => {
    setFormData(prev => ({
      ...prev,
      complianceOptions: prev.complianceOptions.filter(value => value !== optionValue)
    }));
  };

  // Función principal para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    
    // Validación básica de los campos del formulario
    let hasError = false;
    
    // Verifica que se haya seleccionado un tipo de cambio
    if (!formData.changeType) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, seleccione un tipo de cambio.",
        success: false,
        response: null
      });
      hasError = true;
    } 
    // Si el tipo es compliance, verifica que haya opciones seleccionadas
    else if (formData.changeType === 'compliance' && formData.complianceOptions.length === 0) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, seleccione al menos una opción de compliance.",
        success: false,
        response: null
      });
      hasError = true;
    } 
    // Si el tipo es patching, verifica que haya una versión seleccionada
    else if (formData.changeType === 'patching' && !formData.patchingVersion) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, seleccione una versión de patching.",
        success: false,
        response: null
      });
      hasError = true;
    } 
    // Verifica que se hayan ingresado máquinas
    else if (!formData.machines) {
      setSubmitStatus({
        loading: false,
        error: "Por favor, ingrese al menos una máquina.",
        success: false,
        response: null
      });
      hasError = true;
    }
    // Validación de fechas para compliance y patching
    else if ((formData.changeType === 'compliance' || formData.changeType === 'patching')) {
      // Validar que ambas fechas estén presentes
      if (!formData.startDate || !formData.endDate) {
        setSubmitStatus({
          loading: false,
          error: "Por favor, seleccione fecha de inicio y fecha de fin.",
          success: false,
          response: null
        });
        hasError = true;
      }
      // Validar que la fecha de fin sea posterior a la de inicio
      else if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setSubmitStatus({
          loading: false,
          error: "La fecha de fin debe ser posterior a la fecha de inicio.",
          success: false,
          response: null
        });
        hasError = true;
      }
    }
    
    // Si hay algún error de validación, detiene la ejecución
    if (hasError) {
      return;
    }
    
    // Inicia el proceso de envío y actualiza el estado
    setSubmitStatus({
      loading: true,  // Indica que está cargando
      error: null,    // Reinicia cualquier error previo
      success: false, // Aún no es exitoso
      response: null  // No hay respuesta aún
    });
    
    try {
      // Prepara los datos a enviar según el tipo de cambio seleccionado
      const dataToSend = {
        changeType: formData.changeType,
        machines: formData.machines,
        // También se envían los datos en una estructura anidada para facilitar el procesamiento
        options: {
          changeType: formData.changeType,
          machines: formData.machines
        }
      };
      
      // Añade datos específicos según el tipo de cambio seleccionado
      if (formData.changeType === 'compliance') {
        // Para compliance, envía el array de opciones seleccionadas
        dataToSend.specificOptions = formData.complianceOptions;
        dataToSend.options.specificOptions = formData.complianceOptions;
        // Añadir las fechas
        dataToSend.startDate = formData.startDate;
        dataToSend.endDate = formData.endDate;
        dataToSend.options.startDate = formData.startDate;
        dataToSend.options.endDate = formData.endDate;
      } else if (formData.changeType === 'patching') {
        // Para patching, envía la versión seleccionada
        dataToSend.specificOptions = formData.patchingVersion;
        dataToSend.options.specificOptions = formData.patchingVersion;
        // Añadir las fechas
        dataToSend.startDate = formData.startDate;
        dataToSend.endDate = formData.endDate;
        dataToSend.options.startDate = formData.startDate;
        dataToSend.options.endDate = formData.endDate;
      }
      
      // Envía los datos a la API mediante una solicitud POST
      console.log('Enviando datos:', dataToSend);
      const response = await axios.post('http://localhost:5001/api/rundeck/form-submit', dataToSend);
      
      // Actualiza el estado con la respuesta exitosa
      setSubmitStatus({
        loading: false,
        error: null,
        success: true,
        response: response.data
      });
      
      // Actualiza la lista de ejecuciones después de un breve retraso
      // para dar tiempo a que se procese la solicitud en el servidor
      setTimeout(() => fetchExecutions(), 1000);
      
      // Limpia el formulario después del envío exitoso
      setFormData({
        changeType: '',
        machines: '',
        complianceOptions: [],
        patchingVersion: '',
        startDate: '',
        endDate: ''
      });
      
      // Limpia el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSubmitStatus(prev => ({
          ...prev,
          success: false,
          response: null
        }));
      }, 5000);
      
    } catch (error) {
      // Maneja errores durante el envío
      console.error('Error al enviar formulario:', error);
      
      // Actualiza el estado con el mensaje de error
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

  // Función para manejar la exportación a Excel
  const handleExportToExcel = async () => {
    // Verifica que haya datos para exportar
    if (filteredExecutions.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    
    try {
      // Utiliza la función utilitaria importada para exportar las ejecuciones FILTRADAS
      await exportExecutionsToExcel(filteredExecutions, formatDate);
      console.log("Archivo Excel generado correctamente");
    } catch (error) {
      // Maneja errores durante la exportación
      console.error("Error al generar archivo Excel:", error);
      alert("Ocurrió un error al exportar los datos: " + error.message);
    }
  };

// Función para aplicar los filtros a las ejecuciones
const handleFilterChange = (filters) => {
  // Si no hay ejecuciones, no hay nada que filtrar
  if (!executions || executions.length === 0) {
    setFilteredExecutions([]);
    return;
  }
  
  console.log('Aplicando filtros:', filters); // Log para depuración
  
  // Filtrar las ejecuciones según los criterios
  const filtered = executions.filter(execution => {
    // Para depuración
    if (filters.type || filters.status) {
      console.log('Ejecución:', {
        id: execution.executionId,
        type: execution.options?.changeType || execution.changeType,
        status: execution.status
      });
    }
    
    // Filtro por ID
    if (filters.id && !String(execution.executionId).includes(filters.id)) {
      return false;
    }
    
    // Filtro por tipo de cambio - comparación insensible a mayúsculas/minúsculas
    if (filters.type) {
      const execType = (execution.options?.changeType || execution.changeType || '').toLowerCase();
      if (execType !== filters.type.toLowerCase()) {
        return false;
      }
    }
    
    // Filtro por estado - comparación insensible a mayúsculas/minúsculas
    if (filters.status) {
      const execStatus = (execution.status || 'desconocido').toLowerCase();
      if (execStatus !== filters.status.toLowerCase()) {
        return false;
      }
    }
    
    // Filtro por fecha desde
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      dateFrom.setHours(0, 0, 0, 0); // Ajustar al inicio del día
      
      const execDate = new Date(execution.createdAt || execution.startedAt);
      if (execDate < dateFrom) {
        return false;
      }
    }
    
    // Filtro por fecha hasta
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // Ajustar al final del día
      
      const execDate = new Date(execution.createdAt || execution.startedAt);
      if (execDate > dateTo) {
        return false;
      }
    }
    
    // Filtro por máquinas
    if (filters.machines) {
      // Obtener la lista de máquinas como texto
      const machinesStr = typeof (execution.options?.machines || execution.machines) === 'string'
        ? (execution.options?.machines || execution.machines)
        : Array.isArray(execution.options?.machines || execution.machines)
          ? (execution.options?.machines || execution.machines).join('\n')
          : '';
          
      if (!machinesStr.toLowerCase().includes(filters.machines.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro por opciones específicas
    if (filters.options) {
      const specificOptions = execution.options?.specificOptions || execution.specificOptions;
      let optionsStr = '';
      
      if (Array.isArray(specificOptions)) {
        optionsStr = specificOptions.join(', ');
      } else if (specificOptions !== null && specificOptions !== undefined) {
        optionsStr = String(specificOptions);
      }
          
      if (!optionsStr.toLowerCase().includes(filters.options.toLowerCase())) {
        return false;
      }
    }
    
    // Si pasa todos los filtros, se incluye en los resultados
    return true;
  });
  
  console.log('Resultados filtrados:', filtered.length); // Log para depuración
  
  // Actualizar las ejecuciones filtradas
  setFilteredExecutions(filtered);
};


  // Usar useEffect para inicializar las ejecuciones filtradas cuando se cargan las ejecuciones
  useEffect(() => {
    setFilteredExecutions(executions);
  }, [executions]);
  


  // La función de renderizado devuelve el JSX que representa la interfaz de usuario
  return (
    <div className="rundeck-form-container">
      <h3>Formulario para Rundeck</h3>
      
      {/* Formulario principal para enviar trabajos a Rundeck */}
      <form onSubmit={handleSubmit} className="rundeck-form">
        {/* Selector para el tipo de cambio */}
        <div className="form-group">
          <label htmlFor="changeType">Tipo de cambio:</label>
          <select 
            id="changeType" 
            name="changeType" 
            value={formData.changeType}
            onChange={handleChange}
            className="form-control"
          >
            {/* Mapea las opciones de tipo de cambio para generar elementos <option> */}
            {changeTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selector tipo "chips" para Compliance - solo se muestra si el tipo de cambio es 'compliance' */}
        {formData.changeType === 'compliance' && (
          <div className="form-group">
            <label htmlFor="complianceOptions">Opciones de Compliance:</label>
            {/* Contenedor de opciones tipo "chip" */}
            <div className="compliance-options-container">
              {/* Mapea las opciones para generar elementos seleccionables */}
              {complianceOptions.map(option => (
                <button 
                  key={option.value}
                  type="button"
                  className={`compliance-option ${formData.complianceOptions.includes(option.value) ? 'selected' : ''}`}
                  onClick={() => handleComplianceOptionClick(option.value)}
                  aria-pressed={formData.complianceOptions.includes(option.value)}
                >
                  {option.label}
                </button>
              ))}
              </div>

              {/* Lista de opciones seleccionadas - solo se muestra si hay opciones seleccionadas */}
            {formData.complianceOptions.length > 0 && (
              <div className="selected-options">
                <div className="selected-options-header">Reglas seleccionadas:</div>
                <div className="selected-options-list">
                  {/* Mapea las opciones seleccionadas para mostrarlas con botón de eliminar */}
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
            
            {/* Usar DateRangePicker en lugar de código duplicado */}
            <DateTimeRangePicker 
              startDate={formData.startDate}
              endDate={formData.endDate}
              handleChange={handleChange}
            />
          </div>
        )}
        
        {/* Selector único para Patching - solo se muestra si el tipo de cambio es 'patching' */}
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
              {/* Mapea las opciones de patching para generar elementos <option> */}
              {patchingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Usar DateRangePicker en lugar de código duplicado */}
            <DateTimeRangePicker 
              startDate={formData.startDate}
              endDate={formData.endDate}
              handleChange={handleChange}
            />
          </div>
        )}
        
        {/* Campo para ingresar las máquinas */}
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
                
        {/* Botón para enviar el formulario */}
        <div className="form-actions">
          <button 
            type="submit" 
            className={`submit-button ${submitStatus.loading ? 'loading' : ''}`}
            disabled={submitStatus.loading}
          >
            {/* Muestra un spinner durante la carga o el texto normal */}
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
      
      {/* Mensajes de error o éxito que se muestran después de interactuar con el formulario */}
      {/* Mensaje de error - solo se muestra si hay un error */}
      {submitStatus.error && (
        <div className="form-message error">
          <span className="icon">⚠️</span> {submitStatus.error}
        </div>
      )}
      
      {/* Mensaje de éxito - solo se muestra después de un envío exitoso */}
      {submitStatus.success && (
        <div className="form-message success">
          <span className="icon">✅</span> El formulario se ha enviado correctamente.
          {/* Muestra el ID de ejecución si está disponible */}
          {submitStatus.response?.executionId && (
            <p className="execution-id">ID de ejecución: {submitStatus.response.executionId}</p>
          )}
        </div>
      )}
      
      {/* Sección para mostrar el historial de ejecuciones */}
      <div className="form-executions-container">
        <h3>Historial de ejecuciones</h3>
        
        {/* Componente para filtrar ejecuciones */}
        {!loadingExecutions && executions.length > 0 && (
          <ExecutionsFilter 
            executions={executions}
            onFilterChange={handleFilterChange}
            changeTypeOptions={changeTypeOptions}
          />
        )}
        
        {/* Contenedor para los botones de acción */}
        <div className="table-actions">
          <div className="left-actions">
            <ExcelExportButton 
              onClick={handleExportToExcel}
              isDisabled={loadingExecutions || filteredExecutions.length === 0}
              title={filteredExecutions.length === 0 ? "No hay datos para exportar" : `Exportar ${filteredExecutions.length} ejecuciones a Excel`}
            />
          </div>
          
          <div className="right-actions">
            <RefreshButton 
              onClick={handleRefreshExecutions}
              isDisabled={loadingExecutions}
              isRefreshing={isRefreshing}
              title="Actualizar lista de ejecuciones"
            />
          </div>
        </div>

        {/* Muestra un indicador de carga, la tabla de ejecuciones o un mensaje si no hay datos */}
        {loadingExecutions || isRefreshing ? (
          <div className="loading-indicator">
            {isRefreshing ? 'Actualizando ejecuciones...' : 'Cargando ejecuciones...'}
          </div>
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
                  <th>CambioChg</th>
                </tr>
              </thead>
              <tbody>
                {/* Mapea las ejecuciones para generar filas en la tabla */}
                {filteredExecutions.map(execution => (
                  <tr key={execution._id || execution.executionId} className={`execution-row ${execution.status === 'running' ? 'running-execution' : ''}`}>
                    {/* Columna ID - con enlace a la ejecución en Rundeck */}
                    <td>
                      {execution.permalink ? (
                        <a href={execution.permalink} target="_blank" rel="noopener noreferrer">
                          {execution.executionId}
                        </a>
                      ) : execution.executionId}
                    </td>
                    {/* Columna Tipo - muestra el tipo de cambio */}
                    <td>
                      {execution.options?.changeType || 
                      execution.changeType || 
                      'N/A'}
                    </td>
                    {/* Columna Detalles - con detalles expandibles */}
                    <td>
                      <details>
                        <summary>Ver detalles</summary>
                        <div className="execution-details">
                          {/* Tipo de cambio */}
                          <div>
                            <strong>Tipo:</strong> {
                              (execution.options?.changeType || execution.changeType) === 'compliance' ? 'Compliance' : 
                              (execution.options?.changeType || execution.changeType) === 'patching' ? 'Patching' : 
                              'Desconocido'
                            }
                          </div>
                          
                          {/* Opciones específicas según el tipo */}
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
                          
                          {/* Información sobre las máquinas */}
                          {(execution.options?.machines || execution.machines) && (
                            <div>
                              <strong>Máquinas:</strong> {
                                typeof (execution.options?.machines || execution.machines) === 'string'
                                  ? (execution.options?.machines || execution.machines).split(/[\n,]+/).length + ' máquina(s)'
                                  : Array.isArray(execution.options?.machines || execution.machines)
                                    ? (execution.options?.machines || execution.machines).length + ' máquina(s)'
                                    : 'N/A'
                              }
                              {/* Lista detallada de máquinas expandible */}
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
                    {/* Columna Estado - con clases CSS según el estado */}
                    <td className={`execution-status ${execution.status === 'succeeded' ? 'status-success' : 
                                     execution.status === 'failed' ? 'status-failed' : 
                                     execution.status === 'running' ? 'status-running' : 
                                     execution.status === 'aborted' ? 'status-aborted' : 'status-unknown'}`}>
                      {execution.status || 'Desconocido'}
                    </td>
                    {/* Columna Fecha - con fecha formateada */}
                    <td>{formatDate(execution.createdAt || execution.startedAt)}</td>
                    <td>
                    <div className="cambiochg-container">
                      <span>{execution.cambiochg || 'Sin valor'}</span>
                    </div>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : executions.length > 0 ? (
            <div className="no-executions-message">No hay resultados para los filtros aplicados</div>
          ) : (
            <div className="no-executions-message">No hay ejecuciones registradas</div>
        )}
      </div>
    </div>
  );
}