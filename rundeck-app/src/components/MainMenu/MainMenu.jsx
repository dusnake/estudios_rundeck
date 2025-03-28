import TabButton from "../TabButton/TabButton.jsx";
import Section from "../Section/Section.jsx";
import TabsMenu from "../TabsMenu/TabsMenu.jsx";
import { useState, useEffect } from "react";
import { EXAMPLES } from "../../data.js";
import "./MainMenu.css";

export default function MainMenu() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [listRundeck, setListRundeck] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/rundeck")
      .then((response) => response.json())
      .then((data) => {
        setListRundeck(data);
        console.log("Datos de Rundeck obtenidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener datos de Rundeck:", error);
      });
  }, []);

  function handleClickMenu(selectedButton) {
    setSelectedTopic(selectedButton);
  }

  let tabContent = <></>;

  if (selectedTopic) {
    if (selectedTopic === 'rundeck') {
      // Contenido especial para Rundeck
      tabContent = (
        <div id="tab-content">
          {/* <h3>Rundecks Disponibles</h3> */}
          <div className="rundeck-list">
            {listRundeck.map((rundeck, index) => (
              <button 
                key={index} 
                onClick={() => window.open(rundeck.link, '_blank')}
                className="rundeck-button"
              >
                <span className={`flag-icon ${rundeck.name.toLowerCase().includes('santander') ? 'flag-santander' : 
                                            rundeck.name.toLowerCase().includes('chile') ? 'flag-chile' : 
                                            'flag-default'}`}>                          
                </span>
                {rundeck.name}
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  // Botones del menú (incluyendo Rundeck como una opción)
  const exampleButtons = (
    <>
      {/* {Object.values(EXAMPLES).map((button, index) => (
        <TabButton 
          key={`example-${index}`} 
          onClick={() => handleClickMenu(button.key)}
        >
          {button.title}
        </TabButton>
      ))} */}
      <TabButton 
        onClick={() => handleClickMenu('rundeck')}
      >
        Rundeck
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
