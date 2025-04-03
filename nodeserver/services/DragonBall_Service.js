import axios from 'axios';
import DragonBall from '../models/DragonBall_Model.js';
import https from 'https';

// URL correcta para la API de Dragon Ball
const API_URL = 'https://dragonball-api.com/api/';

export const fetchCharacters = async () => {
  try {
    console.log('Iniciando solicitud a la API de Dragon Ball');
    
    // Configuramos axios con opciones avanzadas para manejar CORS
    const axiosInstance = axios.create({
      timeout: 15000, // 15 segundos de timeout
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false // Permite certificados autofirmados (usar con precaución)
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5001' // Define un origen explícito
      }
    });
    
    // Realizamos la solicitud a la API externa
    const response = await axiosInstance.get(`${API_URL}/characters?limit=20`, {
      // Configuración específica para esta solicitud
    });
    
    console.log('Respuesta recibida de la API', { 
      status: response.status, 
      hasData: response.data ? 'sí' : 'no'
    });
    
    // Verificamos la estructura específica de la respuesta
    if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
      // Intentamos extraer personajes de la estructura que sea
      let characters = [];
      
      if (Array.isArray(response.data)) {
        characters = response.data;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        characters = response.data.items;
      } else if (typeof response.data === 'object') {
        // Intentamos encontrar un array en alguna propiedad
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            characters = response.data[key];
            break;
          }
        }
        
        // Si aún no tenemos personajes, tratamos de usar el objeto como un personaje
        if (characters.length === 0 && response.data.name) {
          characters = [response.data];
        }
      }
      
      if (characters.length === 0) {
        console.error('No se pudieron extraer personajes de la respuesta:', 
          JSON.stringify(response.data).substring(0, 200) + '...');
        throw new Error('No se pudieron extraer personajes de la respuesta');
      }
      
      console.log(`Se extrajeron ${characters.length} personajes de una estructura no estándar`);
      return await saveCharacters(characters);
    }
    
    // Extraemos los items (personajes) de la respuesta estándar
    const characters = response.data.items;
    console.log(`Se obtuvieron ${characters.length} personajes de la API`);
    
    return await saveCharacters(characters);
  } catch (error) {
    console.error('Error en fetchCharacters:', error);
    
    // Intentar un enfoque alternativo con fetch nativo
    try {
      console.log('Intentando solicitud alternativa con fetch y modo no-cors');
      
      // Usamos node-fetch si estamos en Node.js
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(`${API_URL}/characters?limit=20`, {
        method: 'GET',
        mode: 'no-cors', // Aquí aplicamos no-cors
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // En modo no-cors, obtendremos una respuesta opaca
      console.log('Respuesta alternativa recibida, tipo:', response.type);
      
      if (response.type === 'opaque') {
        // Con respuesta opaca, no podemos acceder al contenido
        throw new Error('La API devolvió una respuesta opaca que no podemos leer debido a restricciones CORS');
      }
      
      const data = await response.json();
      const characters = data.items || data;
      
      return await saveCharacters(Array.isArray(characters) ? characters : [characters]);
    } catch (fetchError) {
      console.error('Error en enfoque alternativo:', fetchError);
      
      // Como último recurso, usamos datos de ejemplo para demostración
      console.log('Usando datos de ejemplo como último recurso');
      return await saveCharacters(getExampleCharacters());
    }
  }
};

// Función para guardar personajes en la base de datos
async function saveCharacters(characters) {
  const savedCharacters = [];
  
  for (const character of characters) {
    // Validación básica del personaje
    if (!character.id) {
      character.id = `gen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    try {
      // Verificamos si el personaje ya existe en la base de datos
      const existingCharacter = await DragonBall.findOne({ id: character.id });
      
      if (existingCharacter) {
        // Actualizamos el personaje si ya existe
        Object.assign(existingCharacter, character);
        await existingCharacter.save();
        savedCharacters.push(existingCharacter);
      } else {
        // Creamos un nuevo documento si no existe
        const newCharacter = new DragonBall(character);
        await newCharacter.save();
        savedCharacters.push(newCharacter);
      }
    } catch (err) {
      console.error(`Error al guardar el personaje:`, err);
      // Continuamos con el siguiente personaje
    }
  }
  
  return savedCharacters;
}

// Datos de ejemplo para usar como último recurso
function getExampleCharacters() {
  return [
    {
      id: "1",
      name: "Son Goku",
      race: "Saiyan",
      gender: "Male",
      ki: "58,999",
      image: "https://static.wikia.nocookie.net/dragonball/images/5/5b/Goku_SS_Artwork.png",
      description: "El protagonista principal de Dragon Ball, un Saiyan enviado a la Tierra cuando era un bebé."
    },
    {
      id: "2",
      name: "Vegeta",
      race: "Saiyan",
      gender: "Male",
      ki: "56,000",
      image: "https://static.wikia.nocookie.net/dragonball/images/2/2c/Vegeta_SS_3D_Artwork.png",
      description: "El príncipe de los Saiyans y uno de los rivales/aliados más importantes de Goku."
    },
    {
      id: "3",
      name: "Piccolo",
      race: "Namekian",
      gender: "Male",
      ki: "42,000",
      image: "https://static.wikia.nocookie.net/dragonball/images/5/5b/Piccolo_artwork.png",
      description: "Un guerrero Namekiano que se convirtió en aliado de Goku y mentor de Gohan."
    },
    {
      id: "4",
      name: "Gohan",
      race: "Human/Saiyan Hybrid",
      gender: "Male",
      ki: "70,000",
      image: "https://static.wikia.nocookie.net/dragonball/images/1/1f/GohanSuperSaiyanIINV.png",
      description: "El hijo mayor de Goku, conocido por su potencial oculto."
    },
    {
      id: "5",
      name: "Bulma",
      race: "Human",
      gender: "Female",
      ki: "4",
      image: "https://static.wikia.nocookie.net/dragonball/images/1/13/Bulma_DB_Artwork.png",
      description: "Una brillante científica y uno de los primeros amigos de Goku."
    }
  ];
}

export const getCharacters = async () => {
  try {
    // Obtenemos todos los personajes de la base de datos
    return await DragonBall.find();
  } catch (error) {
    console.error('Error al listar personajes de Dragon Ball:', error);
    throw new Error('Error al listar personajes');
  }
};

export const searchCharacters = async (query) => {
  try {
    // Crear una expresión regular para búsqueda insensible a mayúsculas/minúsculas
    const searchRegex = new RegExp(query, 'i');
    
    // Buscar personajes que coincidan con el término en varios campos
    const characters = await DragonBall.find({
      $or: [
        { name: searchRegex },
        { race: searchRegex },
        { gender: searchRegex },
        { description: searchRegex },
        { originPlanet: searchRegex },
        { affiliation: searchRegex }
      ]
    });
    
    return characters;
  } catch (error) {
    console.error('Error al buscar personajes:', error);
    throw new Error('Error al buscar personajes');
  }
};