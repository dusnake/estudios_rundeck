import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ExecutionsFilter.css';

export default function ExecutionsFilter({ executions, onFilterChange, changeTypeOptions }) {
  // Estado para almacenar los criterios de filtrado
  const [filters, setFilters] = useState({
    id: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    machines: '',
    options: ''
  });

  // Obtener opciones únicas para los selectores de filtro
  const [statusOptions, setStatusOptions] = useState([]);

  // Extraer estados únicos al cargar el componente o cambiar las ejecuciones
  useEffect(() => {
    if (executions && executions.length > 0) {
      // Extraer estados únicos de las ejecuciones
      // Define el orden de prioridad para los estados
      const statusOrder = {
        'running': 1,
        'succeeded': 2, 
        'failed': 3,
        'aborted': 4,
        'desconocido': 5
      };
      
      // Extraer estados únicos y ordenarlos según prioridad definida
      const uniqueStatuses = [...new Set(executions.map(exec => 
        exec.status || 'Desconocido'
      ))].sort((a, b) => {
        const aValue = statusOrder[a.toLowerCase()] || 999;
        const bValue = statusOrder[b.toLowerCase()] || 999;
        return aValue - bValue;
      });
      
      // Normalizar los estados para asegurar consistencia
      const normalizedStatuses = uniqueStatuses.map(status => ({
        value: status.toLowerCase(),
        label: status.charAt(0).toUpperCase() + status.slice(1)
      }));
      
      setStatusOptions([{ value: '', label: 'Todos' }, ...normalizedStatuses]);
    }
  }, [executions]);

  // Manejar cambios en los campos de filtro
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Actualizar estado con el nuevo valor del filtro
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [name]: value };
      
      // Llamar al callback con los nuevos filtros
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    const emptyFilters = {
      id: '',
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      machines: '',
      options: ''
    };
    
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  // Verificar si hay filtros activos para aplicar estilos
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={`executions-filter ${hasActiveFilters ? 'has-active-filters' : ''}`}>
      <div className="filter-header">
        <h4>Filtros</h4>
        <button 
          type="button" 
          className="clear-filters-btn" 
          onClick={handleClearFilters}
          title="Limpiar todos los filtros"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="filter-grid">
        {/* Filtro por ID */}
        <div className="filter-item">
          <label htmlFor="filter-id">ID de ejecución:</label>
          <input
            id="filter-id"
            type="text"
            name="id"
            value={filters.id}
            onChange={handleFilterChange}
            placeholder="Buscar por ID..."
            className="filter-input"
          />
        </div>
        
        {/* Filtro por tipo de cambio */}
        <div className="filter-item">
          <label htmlFor="filter-type">Tipo de cambio:</label>
          <select
            id="filter-type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Todos</option>
            {/* Solo mostrar las opciones con valor */}
            {changeTypeOptions
                .filter(option => option.value) // Solo incluir opciones con valor
                .map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
            ))
            }
          </select>
        </div>
        
        {/* Filtro por estado */}
        <div className="filter-item">
          <label htmlFor="filter-status">Estado:</label>
          <select
            id="filter-status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filtro por fecha (desde) */}
        <div className="filter-item">
          <label htmlFor="filter-date-from">Desde:</label>
          <input
            id="filter-date-from"
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        
        {/* Filtro por fecha (hasta) */}
        <div className="filter-item">
          <label htmlFor="filter-date-to">Hasta:</label>
          <input
            id="filter-date-to"
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        
        {/* Filtro por máquinas */}
        <div className="filter-item">
          <label htmlFor="filter-machines">Máquinas:</label>
          <input
            id="filter-machines"
            type="text"
            name="machines"
            value={filters.machines}
            onChange={handleFilterChange}
            placeholder="Nombre de máquina..."
            className="filter-input"
          />
        </div>
        
        {/* Filtro por opciones específicas */}
        <div className="filter-item">
          <label htmlFor="filter-options">Opciones específicas:</label>
          <input
            id="filter-options"
            type="text"
            name="options"
            value={filters.options}
            onChange={handleFilterChange}
            placeholder="Reglas, versiones..."
            className="filter-input"
          />
        </div>
      </div>
    </div>
  );
}

ExecutionsFilter.propTypes = {
  executions: PropTypes.array.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  changeTypeOptions: PropTypes.array.isRequired
};