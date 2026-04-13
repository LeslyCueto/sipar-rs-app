import { useState, useEffect } from 'react';
import { BsHouse, BsPencilSquare, BsFileText, BsGear, BsBoxArrowRight, BsPerson, BsList, BsX } from 'react-icons/bs';
import logo from '../assets/img/SIPAR-RS_logo.svg';
import { logoutUsuario, obtenerUsuarioActual } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { InicioTab } from './InicioTab';
import { ReportarTab } from './ReportarTab';
import { MisReportesTab } from './MisReportesTab';
import { PerfilTab } from './PerfilTab';

export function DashboardCiudadano() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioActual();
  const [activeTab, setActiveTab] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  const handleLogout = () => {
    logoutUsuario();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#2d7a47',
        color: '#fff',
        padding: '0.6rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <img src={logo} alt="SIPAR-RS" style={{ width: '10em', margin:'15px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', display: isMobile ? 'none' : 'flex' }}>
            <BsPerson size={16} /> {usuario?.nombre || 'Usuario'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#c33',
              color: '#fff',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: '600',
              fontSize: '0.85rem',
            }}
          >
            <BsBoxArrowRight size={16} /> {isMobile ? '' : 'Cerrar Sesión'}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '2px solid #e0e0e0',
        padding: '0 1.5rem',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          display: isMobile ? (menuOpen ? 'flex' : 'none') : 'flex',
          gap: 'clamp(1rem, 3vw, 2rem)',
          width: isMobile ? '100%' : 'auto',
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          justifyContent: !isMobile ? 'center' : 'flex-start',
          flex: !isMobile ? 1 : 'auto',
        }}>
          {[
            { id: 'inicio', label: 'Inicio', icon: BsHouse },
            { id: 'reportar', label: 'Reportar', icon: BsPencilSquare },
            { id: 'reportes', label: 'Mis Reportes', icon: BsFileText },
            { id: 'perfil', label: 'Perfil', icon: BsGear },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (isMobile) setMenuOpen(false);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: isMobile ? '0.6rem 0' : '0.8rem 0',
                cursor: 'pointer',
                borderBottom: activeTab === id ? '3px solid #2d7a47' : 'none',
                borderLeft: isMobile && activeTab === id ? '3px solid #2d7a47' : 'none',
                color: activeTab === id ? '#2d7a47' : '#666',
                fontWeight: activeTab === id ? '600' : '400',
                fontSize: '0.9rem',
                fontFamily: "'Poppins', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                paddingLeft: isMobile ? '0.8rem' : '0',
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: isMobile ? 'flex' : 'none',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#2d7a47',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: '0.5rem',
          }}
        >
          {menuOpen ? <BsX size={24} /> : <BsList size={24} />}
        </button>
      </nav>

      {/* Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'inicio' && <InicioTab onReportarClick={() => setActiveTab('reportar')} />}
        {activeTab === 'reportar' && <ReportarTab onReportEnviado={() => setActiveTab('reportes')} />}
        {activeTab === 'reportes' && <MisReportesTab />}
        {activeTab === 'perfil' && <PerfilTab />}
      </main>
    </div>
  );
}
