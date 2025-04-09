import { useState, useEffect } from 'react';
import './Home.css';
import { newsData } from '../../../data/newsData';


export default function Home() {
  const [news, setNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);

  useEffect(() => {
    // Simulando carga de datos desde API
    setTimeout(() => {
      setNews(newsData);
    }, 500);
  }, []);

  const categories = ['Todos', ...Array.from(new Set(newsData.map(item => item.category)))];

  const filteredNews = news.filter(item => {
    return (selectedCategory === 'Todos' || item.category === selectedCategory) && 
           (item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.summary.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const toggleCardExpansion = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Noticias y Novedades</h1>
        <p className="subtitle">Mantente al día con las últimas actualizaciones de la plataforma de transaccionales</p>
      </div>
      
      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="categories-filter">
          {categories.map(category => (
            <button 
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {news.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Cargando noticias...</span>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="no-results">No se encontraron resultados para tu búsqueda.</div>
      ) : (
        <div className="news-grid">
          {filteredNews.map(item => (
            <div 
              key={item.id} 
              className={`news-card ${expandedCardId === item.id ? 'expanded' : ''}`}
              onClick={() => toggleCardExpansion(item.id)}
            >
              <div className="card-image-container">
                <img src={item.image} alt={item.title} className="card-image" />
                <span className="card-category">{item.category}</span>
              </div>
              <div className="card-content">
                <span className="card-date">{item.date}</span>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-summary">{item.summary}</p>
                
                {expandedCardId === item.id && (
                  <div className="card-expanded-content">
                    <p>{item.content}</p>
                    <div className="card-actions">
                      <button className="card-action-btn primary">Leer más</button>
                      <button className="card-action-btn secondary">Compartir</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <span className="read-more">
                  {expandedCardId === item.id ? 'Ocultar' : 'Leer más'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="home-footer">
        <button className="load-more-btn">Cargar más noticias</button>
      </div>
    </div>
  );
}
