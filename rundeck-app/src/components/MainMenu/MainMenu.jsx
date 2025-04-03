import TabButton from "../TabButton/TabButton.jsx";
import Section from "../Section/Section.jsx";
import TabsMenu from "../TabsMenu/TabsMenu.jsx";
import RundeckJobExecutor from "../RundeckJobExecutor/RundeckJobExecutor.jsx";
import DragonBallList from "../DragonBallList/DragonBallList.jsx";
import RundeckForm from "../RundeckForm/RundeckForm.jsx";
import { useState, useEffect } from "react";
import axios from "axios";
import "./MainMenu.css";

const API_BASE_URL = "http://localhost:5001/api";

export default function MainMenu() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [listRundeck, setListRundeck] = useState([]);
  const [listDynatrace, setListDynatrace] = useState([]);
  const [loading, setLoading] = useState({
    rundeck: false,
    dynatrace: false
  });
  const [error, setError] = useState({
    rundeck: null,
    dynatrace: null
  });

  // Recuperar datos de Rundeck
  useEffect(() => {
    setLoading(prev => ({ ...prev, rundeck: true }));
    
    axios.get(`${API_BASE_URL}/rundeck`)
      .then((response) => {
        setListRundeck(response.data);
        setLoading(prev => ({ ...prev, rundeck: false }));
        console.log("Datos de Rundeck obtenidos:", response.data);
      })
      .catch((error) => {
        console.error("Error al obtener datos de Rundeck:", error);
        setError(prev => ({ 
          ...prev, 
          rundeck: "Error al cargar instancias de Rundeck" 
        }));
        setLoading(prev => ({ ...prev, rundeck: false }));
      });
  }, []);

  // Recuperar datos de Dynatrace
  useEffect(() => {
    setLoading(prev => ({ ...prev, dynatrace: true }));
    
    axios.get(`${API_BASE_URL}/dynatrace`)
      .then((response) => {
        setListDynatrace(response.data);
        setLoading(prev => ({ ...prev, dynatrace: false }));
        console.log("Datos de Dynatrace obtenidos:", response.data);
      })
      .catch((error) => {
        console.error("Error al obtener datos de Dynatrace:", error);
        setError(prev => ({ 
          ...prev, 
          dynatrace: "Error al cargar instancias de Dynatrace" 
        }));
        setLoading(prev => ({ ...prev, dynatrace: false }));
      });
  }, []);

  function handleClickMenu(selectedButton) {
    setSelectedTopic(selectedButton);
  }

  let tabContent = <></>;

  if (selectedTopic) {
    if (selectedTopic === 'rundeck') {
      // Contenido de la lista de Rundecks
      tabContent = (
        <div id="tab-content">
          <h3>Rundecks Disponibles</h3>
          
          {loading.rundeck && (
            <div className="loading-indicator">Cargando instancias de Rundeck...</div>
          )}
          
          {error.rundeck && (
            <div className="error-message">{error.rundeck}</div>
          )}
          
          {!loading.rundeck && !error.rundeck && listRundeck.length === 0 && (
            <div className="empty-message">No hay instancias de Rundeck disponibles</div>
          )}
          
          <div className="instance-list rundeck-list">
            {listRundeck.map((rundeck, index) => (
              <a 
                key={index} 
                href={rundeck.link}
                target="_blank"
                rel="noopener noreferrer"
                className="instance-button rundeck-button"
              >
                <span className={`flag-icon ${rundeck.name.toLowerCase().includes('santander') ? 'flag-santander' : 
                                            rundeck.name.toLowerCase().includes('chile') ? 'flag-chile' : 
                                            'flag-default'}`}>                          
                </span>
                {rundeck.name}
              </a>
            ))}
          </div>
        </div>
      );
    } else if (selectedTopic === 'jobs') {
      // Contenido para ejecutar Jobs con el selector de proyectos predefinido
      tabContent = (
        <div id="tab-content">
          <h3>Ejecutar Jobs de Rundeck</h3>
          <RundeckJobExecutor />
        </div>
      );
    } else if (selectedTopic === 'dynatrace') {
      // Contenido para Dynatrace 
      tabContent = (
        <div id="tab-content">
          <h3>Dynatrace Disponibles</h3>
          
          {loading.dynatrace && (
            <div className="loading-indicator">Cargando instancias de Dynatrace...</div>
          )}
          
          {error.dynatrace && (
            <div className="error-message">{error.dynatrace}</div>
          )}
          
          {!loading.dynatrace && !error.dynatrace && listDynatrace.length === 0 && (
            <div className="empty-message">No hay instancias de Dynatrace disponibles</div>
          )}
          
          <div className="instance-list dynatrace-list">
            {listDynatrace.map((dynatrace, index) => (
              <a 
                key={index} 
                href={dynatrace.link}
                target="_blank"
                rel="noopener noreferrer"
                className="instance-button dynatrace-button"
              >
                <span className={`tenant-icon ${dynatrace.name.toLowerCase().includes('santander') ? 'tenant-santander' : 
                                            dynatrace.name.toLowerCase().includes('chile') ? 'tenant-chile' : 
                                            'tenant-default'}`}>                          
                </span>
                {dynatrace.name}
                {dynatrace.environment && (
                  <span className="environment-tag">{dynatrace.environment}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      );
    } else if (selectedTopic === 'pruebasAPI') {
      // Nuevo contenido para Dragon Ball API
      tabContent = (
        <div id="tab-content">
          <h3>Personajes de Dragon Ball</h3>
          <DragonBallList />
        </div>
      );
    } else if (selectedTopic === 'formulario') {
      // Nuevo contenido para el formulario
      tabContent = (
        <div id="tab-content">
          <RundeckForm />
        </div>
      );
    }
  }

  // Botones del menú (agregamos el nuevo botón)
  const exampleButtons = (
    <>
      <TabButton 
        onClick={() => handleClickMenu('rundeck')}
        className={selectedTopic === 'rundeck' ? 'active' : ''}>
        Rundeck
      </TabButton>
      <TabButton 
        onClick={() => handleClickMenu('jobs')}
        className={selectedTopic === 'jobs' ? 'active' : ''}>
        Ejecutar Jobs
      </TabButton>
      <TabButton 
        onClick={() => handleClickMenu('dynatrace')}
        className={selectedTopic === 'dynatrace' ? 'active' : ''}>
        Dynatrace
      </TabButton>
      <TabButton 
        onClick={() => handleClickMenu('pruebasAPI')}
        className={selectedTopic === 'pruebasAPI' ? 'active' : ''}>
        Pruebas API
      </TabButton>
      <TabButton 
        onClick={() => handleClickMenu('formulario')}
        className={selectedTopic === 'formulario' ? 'active' : ''}>
        Cambios Auto
      </TabButton>
    </>
  );

  return (
    <Section title="" id="reactExamples" className="miClase">
      <TabsMenu ButtonsContainer="menu" buttons={exampleButtons}>
        {tabContent}
      </TabsMenu>
    </Section>
  );
}