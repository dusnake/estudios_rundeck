import reactImage from '../../assets/logoblancosan.png';
// import './Header.css';

export default function Header() {
    
    return (
      <header className='width: 90% max-w-50 m-auto'>
        <a href="../index.htm"> <img src={reactImage} alt="React logo" class="align-items: center;"/></a>
        <h1 className="
          m-0 
          font-['Roboto_Condensed']
          text-center
          text-5xl 
          bg-gradient-to-r from-[#3b5486] via-[#03d5ff] to-[#3b5486] 
          bg-clip-text 
          text-transparent 
          drop-shadow-lg"
          >
            Web IaaS
          </h1>
        {/* De esta forma podríamos hacerlo directamente en una línea
        <h1>{reactTitles[getRandomIntInRange(0, 2)]}</h1> */}
        <p>
          {/* ¡Conceptos fundamentales de React que necesitas conocer para desarrollar
          cualquier app con esta famosa librería! */}
        </p>
      </header>
    );
  }