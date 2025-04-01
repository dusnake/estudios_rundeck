import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from "./components/Header/Header.jsx";
import MainMenu from "./components/MainMenu/MainMenu.jsx";
import Login from "./components/Login/Login.jsx";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <>
      <Header />
      <main className="width:90% max-width: 50rem">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login />} 
          />
          <Route 
            path="/" 
            element={user ? <MainMenu /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </main>
    </>
  );
}

export default App;