import { useState, useEffect } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Typography, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Paper,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LaunchIcon from '@mui/icons-material/Launch';
import './ExecutionSearch.css';

const ExecutionSearch = ({ executions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExecutions, setFilteredExecutions] = useState([]);

  useEffect(() => {
    if (executions) {
      setFilteredExecutions(executions);
    }
  }, [executions]);

  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      // Si no hay término de búsqueda, mostrar todas las ejecuciones
      setFilteredExecutions(executions);
      return;
    }
    
    // Filtrar las ejecuciones que coincidan con el término de búsqueda
    const filtered = executions.filter(execution => {
      const searchLower = term.toLowerCase();
      
      // Buscar en múltiples campos
      return (
        (execution.executionId && execution.executionId.toString().includes(searchLower)) ||
        (execution.description && execution.description.toLowerCase().includes(searchLower)) ||
        (execution.status && execution.status.toLowerCase().includes(searchLower)) ||
        (execution.projectName && execution.projectName.toLowerCase().includes(searchLower)) ||
        (execution.jobId && execution.jobId.toLowerCase().includes(searchLower))
      );
    });
    
    setFilteredExecutions(filtered);
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    status = status.toLowerCase();
    if (status === 'succeeded') return 'success';
    if (status === 'failed') return 'error';
    if (status === 'running') return 'info';
    if (status === 'aborted') return 'warning';
    
    return 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="execution-search-component">
      {/* Campo de búsqueda */}
      <div className="search-container">
        <TextField
          label="Buscar en ejecuciones recientes"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => { setSearchTerm(''); setFilteredExecutions(executions); }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {searchTerm && (
          <Typography variant="body2" className="search-results-count">
            {filteredExecutions.length} resultados
          </Typography>
        )}
      </div>

      {/* Tabla de resultados */}
      <TableContainer component={Paper} className="table-container">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <th>ID</th>
              <th>Job</th>
              <th>Estado</th>
              <th>Inicio</th>
              <th>Fin</th>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExecutions.length > 0 ? (
              filteredExecutions.map(execution => (
                <TableRow key={execution.executionId}
                    className={`execution-row ${execution.status === 'running' ? 'running-execution' : ''}`}>
                  <TableCell>
                    <a href={execution.permalink} target="_blank" rel="noopener noreferrer">
                      {execution.executionId}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="tooltip-container">
                      {execution.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={execution.status || 'N/A'} 
                      size="small" 
                      color={getStatusColor(execution.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(execution.startedAt)}</TableCell>
                  <TableCell>{formatDate(execution.endedAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" className="no-results">
                  {searchTerm 
                    ? "No se encontraron resultados para la búsqueda" 
                    : "No hay ejecuciones recientes"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ExecutionSearch;