import { fetchCharacters, getCharacters, searchCharacters } from '../services/DragonBall_Service.js';

export const fetchCharactersController = async (req, res) => {
  try {
    const characters = await fetchCharacters();
    res.status(200).json({
      success: true,
      count: characters.length,
      characters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getCharactersController = async (req, res) => {
  try {
    const characters = await getCharacters();
    res.status(200).json(characters);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Añadir nuevo controlador para búsquedas
export const searchCharactersController = async (req, res) => {
  try {
    console.log('Iniciando búsqueda de personajes');
    
    // Obtener el término de búsqueda de la consulta
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      // Si no hay término de búsqueda, devolver todos los personajes
      const allCharacters = await getCharacters();
      return res.status(200).json(allCharacters);
    }
    
    console.log(`Buscando personajes con el término: "${query}"`);
    
    // Buscar personajes que coincidan con el término
    const characters = await searchCharacters(query);
    
    console.log(`Se encontraron ${characters.length} personajes que coinciden`);
    
    res.status(200).json(characters);
  } catch (error) {
    console.error('Error en el controlador searchCharactersController:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};