import { useState } from 'react';
import axios from 'axios';
import './DragonBallCard.css';

export default function DragonBallCard({ character }) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  // Asegurar que todas las propiedades necesarias existan para evitar errores
  const safeCharacter = {
    id: character.id || character._id || 'unknown',
    name: character.name || 'Personaje desconocido',
    race: character.race || 'Desconocida',
    gender: character.gender || 'No especificado',
    originPlanet: character.originPlanet || character.planet || 'No especificado',
    ki: character.ki || 'No especificado',
    description: character.description || '',
    image: character.image || '',
    transformations: Array.isArray(character.transformations) ? character.transformations : []
  };

  // Función para ejecutar la acción en Rundeck
  const executeRundeckAction = async () => {
    // Limpiar cualquier resultado previo
    setActionResult(null);
    setIsLoading(true);

    try {
      const jobOptions = {
        "characterName": safeCharacter.name,
        // characterRace: safeCharacter.race,
        // characterId: safeCharacter.id,
        // characterGender: safeCharacter.gender,
        // characterPlanet: safeCharacter.originPlanet,
        // characterKi: safeCharacter.ki
      };
      
      const response = await axios.post(import.meta.env.VITE_NODE_API_BASE_URL + '/rundeck/jobs/execute/', {
        jobId: import.meta.env.VITE_RUNDECK_JOB_ID,
        options: jobOptions
      });

      console.log('Respuesta de Rundeck:', response.data);
      
      // Mostrar resultado exitoso
      setActionResult({
        success: true,
        message: `Acción ejecutada: ${response.data.message || 'Procesado correctamente'}`
      });
    } catch (error) {
      console.error('Error al ejecutar acción en Rundeck:', error);
      
      // Mostrar mensaje de error
      setActionResult({
        success: false,
        message: error.response?.data?.error || 'Error al ejecutar la acción'
      });
    } finally {
      setIsLoading(false);
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        setActionResult(null);
      }, 5000);
    }
  };

  return (
    <div className="character-card">
      <div className="character-image">
        {safeCharacter.image ? (
          <img 
            src={safeCharacter.image} 
            alt={safeCharacter.name}
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "https://www.salonlfc.com/wp-content/uploads/2018/01/image-not-found-1-scaled.png";
            }} 
          />
        ) : (
          <div className="no-image">Sin imagen</div>
        )}
      </div>
      
      <div className="character-info">
        <div className="character-header">
          <h3 title={safeCharacter.name}>{safeCharacter.name}</h3>
          <button 
            onClick={executeRundeckAction}
            className={`rundeck-action-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
            title="Ejecutar acción en Rundeck"
          >
            {/* Ícono de engranaje SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
            {isLoading && <span className="spinner"></span>}
          </button>
        </div>
        
        {actionResult && (
          <div className={`action-result ${actionResult.success ? 'success' : 'error'}`}>
            {actionResult.message}
          </div>
        )}
        
        {safeCharacter.race && (
          <p><strong>Raza:</strong> {safeCharacter.race}</p>
        )}
        
        {safeCharacter.gender && (
          <p><strong>Género:</strong> {safeCharacter.gender}</p>
        )}
        
        {safeCharacter.originPlanet && (
          <p><strong>Planeta:</strong> {safeCharacter.originPlanet}</p>
        )}
        
        {safeCharacter.ki && (
          <p><strong>Nivel de Ki:</strong> {safeCharacter.ki}</p>
        )}
      </div>
      
      {safeCharacter.description && (
        <div className="character-description" title={safeCharacter.description}>
          {safeCharacter.description}
        </div>
      )}
      
      {/* Siempre incluimos la sección de transformaciones para mantener la estructura */}
      <div className="transformations">
        {safeCharacter.transformations.length > 0 && (
          <>
            <h4>Transformaciones:</h4>
            <div className="transformations-list">
              {safeCharacter.transformations.map((transformation, index) => (
                <div key={index} className="transformation">
                  <span>{transformation.name}</span>
                  {transformation.image && (
                    <img 
                      src={transformation.image} 
                      alt={transformation.name} 
                      className="transformation-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}