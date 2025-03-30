import reactImage from '../../assets/logoblancosan.png';
import './Header.css';

export default function Header() {
    
    return (
      <header>
        <a href="../index.htm"> <img src={reactImage} alt="React logo"/></a>
        <h1>Web IaaS</h1>
        {/* De esta forma podríamos hacerlo directamente en una línea
        <h1>{reactTitles[getRandomIntInRange(0, 2)]}</h1> */}
        <p>
          {/* ¡Conceptos fundamentales de React que necesitas conocer para desarrollar
          cualquier app con esta famosa librería! */}
        </p>
      </header>
    );
  }