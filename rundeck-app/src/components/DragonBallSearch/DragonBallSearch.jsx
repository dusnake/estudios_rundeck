import { useState } from 'react';
import './DragonBallSearch.css';

export default function DragonBallSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };
  
  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar personajes..."
            className="search-input"
          />
          
          {searchTerm && (
            <button 
              type="button"
              className="clear-button"
              onClick={handleClear}
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
          
          <button 
            type="submit" 
            className="search-button"
            title="Buscar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}