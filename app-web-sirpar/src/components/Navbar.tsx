import { useState } from 'react';

export interface NavbarProps {
  title?: string;
  onLoginClick?: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .navbar-desktop-menu {
            display: none !important;
          }
          
          .navbar-hamburger {
            display: flex !important;
          }
          
          .navbar-mobile-menu {
            max-height: ${menuOpen ? '300px' : '0'};
            opacity: ${menuOpen ? '1' : '0'};
            transition: all 0.3s ease;
            overflow: hidden;
          }
          
          .navbar-spacer {
            height: 70px;
          }
          
          .navbar-mobile-menu a {
            transition: all 0.3s ease;
            padding-left: 0.5rem;
          }
          
          .navbar-mobile-menu a:hover {
            color: #ffd700;
            padding-left: 1rem;
          }
          
          nav {
            justify-content: space-between !important;
            flex-direction: row !important;
            padding: 1rem 2rem !important;
          }
        }
        
        @media (min-width: 769px) {
          .navbar-hamburger {
            display: none !important;
            visibility: hidden !important;
          }
          
          .navbar-mobile-menu {
            display: none !important;
            visibility: hidden !important;
          }
          
          .navbar-spacer {
            height: 70px;
          }
          
          nav {
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 1rem;
            padding: 1.25rem 3rem !important;
          }
          
          nav h1 {
            margin-bottom: 0.5rem !important;
          }
        }
        
        nav a {
          transition: all 0.3s ease;
          position: relative;
        }
        
        nav a:hover {
          color: #ffd700;
          transform: translateY(-2px);
        }
        
        nav a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #ffd700;
          transition: width 0.3s ease;
        }
        
        nav a:hover::after {
          width: 100%;
        }
        
        .hamburger-button {
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          font-size: 1.5rem;
          padding: 0;
          transition: all 0.3s ease;
        }
        
        .hamburger-button:hover {
          color: #ffd700;
          transform: scale(1.1);
        }
      `}</style>
      
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a472a',
        color: '#ffffff',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        zIndex: 500,
        transition: 'all 0.3s ease'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', 
          fontWeight: 'bold',
          fontFamily: "'Poppins', sans-serif",
          letterSpacing: '1px'
        }}>
          <span style={{ color: '#90ee90' }}>SIPAR</span>-RS
        </h1>

        {/* Menú Desktop */}
        <ul className="navbar-desktop-menu" style={{
          listStyle: 'none',
          display: 'flex',
          gap: 'clamp(1.5rem, 5vw, 3rem)',
          margin: 0,
          padding: 0,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <li><a href="#inicio" style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500' }}>Inicio</a></li>
          <li><a href="#compromiso" style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500' }}>Compromiso</a></li>
          <li><a href="#reportar" style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500' }}>Reportar</a></li>
          <li><a onClick={() => onLoginClick?.()} style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500', cursor: 'pointer' }}>Iniciar Sesión</a></li>
        </ul>

        {/* Botón Hamburguesa */}
        <button 
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: 0,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffd700';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ☰
        </button>
      </nav>

      {/* Menú Mobile */}
      <div className="navbar-mobile-menu" style={{
        position: 'fixed',
        top: '70px',
        left: 0,
        right: 0,
        backgroundColor: '#1a472a',
        padding: '1rem',
        zIndex: 999,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
      }}>
        <ul style={{
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          margin: 0,
          padding: 0
        }}>
          <li><a href="#inicio" onClick={() => setMenuOpen(false)} style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500', display: 'block', padding: '0.5rem 0.5rem' }}>Inicio</a></li>
          <li><a href="#compromiso" onClick={() => setMenuOpen(false)} style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500', display: 'block', padding: '0.5rem 0.5rem' }}>Compromiso</a></li>
          <li><a href="#reportar" onClick={() => setMenuOpen(false)} style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500', display: 'block', padding: '0.5rem 0.5rem' }}>Reportar</a></li>
          <li><a onClick={() => { setMenuOpen(false); onLoginClick?.(); }} style={{ color: '#ffffff', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: '500', display: 'block', padding: '0.5rem 0.5rem', cursor: 'pointer' }}>Iniciar Sesión</a></li>
        </ul>
      </div>
      
      {/* Spacer compensar navbar */}
      <div className="navbar-spacer"></div>
    </>
  );
}
