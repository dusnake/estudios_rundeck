import { useState, useEffect } from 'react';
import axios from 'axios';
import DragonBallCard from '../DragonBallCard/DragonBallCard';
import DragonBallSearch from '../DragonBallSearch/DragonBallSearch';
import './DragonBallList.css';

const API_BASE_URL = 'http://localhost:5001/api';

export default function DragonBallList() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingApiData, setFetchingApiData] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Cargar personajes de la base de datos
  const loadCharacters = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage("Cargando personajes guardados...");
    setIsSearching(false);
    setSearchQuery("");
    
    try {
      const response = await axios.get(`${API_BASE_URL}/dragonball`);
      
      if (Array.isArray(response.data)) {
        setCharacters(response.data);
        setStatusMessage(`${response.data.length} personajes cargados de la base de datos`);
      } else {
        setCharacters([]);
        setStatusMessage("No se encontraron personajes en la base de datos");
      }
    } catch (err) {
      console.error('Error al cargar personajes:', err);
      setError(`Error al cargar personajes: ${err.response?.data?.error || err.message}`);
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Buscar personajes
  const searchCharacters = async (query) => {
    if (!query.trim()) {
      loadCharacters();
      return;
    }
    
    setIsSearching(true);
    setLoading(true);
    setError(null);
    setStatusMessage(`Buscando personajes con: "${query}"`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/dragonball/search`, {
        params: { query }
      });
      
      if (Array.isArray(response.data)) {
        setCharacters(response.data);
        setStatusMessage(`Se encontraron ${response.data.length} resultados para "${query}"`);
      } else {
        setCharacters([]);
        setStatusMessage(`No se encontraron personajes que coincidan con "${query}"`);
      }
    } catch (err) {
      console.error('Error al buscar personajes:', err);
      setError(`Error en la búsqueda: ${err.response?.data?.error || err.message}`);
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Obtener personajes de la API externa (mantener código existente)
  const fetchFromAPI = async () => {
    // Mantener el código existente...
  };

  // Cargar personajes al montar el componente
  useEffect(() => {
    loadCharacters();
  }, []);

  return (
    <div className="dragonball-container">
      {/* Barra de búsqueda */}
      <DragonBallSearch onSearch={searchCharacters} />
      
      <div className="actions-container">
        <button 
          onClick={fetchFromAPI} 
          className={`fetch-button ${fetchingApiData ? 'loading' : ''}`}
          disabled={fetchingApiData}
        >
          {fetchingApiData ? 'Importando...' : 'Importar Personajes de la API'}
        </button>
        <button 
          onClick={loadCharacters}
          className="refresh-button"
          disabled={loading}
        >
          {loading ? 'Cargando...' : isSearching ? 'Mostrar todos' : 'Refrescar'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}
      
      {statusMessage && (
        <div className="status-message">
          <span className="status-icon">ℹ️</span> {statusMessage}
        </div>
      )}
      
      <div className="characters-grid">
      {characters.length > 0 ? (
        characters.map(character => (
          <DragonBallCard 
            key={character.id || character._id || Math.random().toString(36)} 
            character={character} 
          />
        ))
      ) : (
          !loading && !fetchingApiData && (
            <div className="no-characters-message">
              {isSearching ? 
                'No se encontraron personajes que coincidan con tu búsqueda.' : 
                'No hay personajes disponibles. Haz clic en "Importar Personajes de la API" para obtenerlos.'}
            </div>
          )
        )}
      </div>
      
      {(loading || fetchingApiData) && characters.length === 0 && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{loading ? 'Cargando personajes...' : 'Importando personajes...'}</p>
        </div>
      )}
    </div>
  );
}