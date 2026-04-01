import { useState } from 'react';
import { BsHouse, BsPencilSquare, BsFileText, BsGear, BsBoxArrowRight } from 'react-icons/bs';
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
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>
          🌍 SIPAR-RS
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif" }}>👤 {usuario?.nombre || 'Usuario'}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#c33',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: '600',
            }}
          >
            <BsBoxArrowRight size={18} /> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '2px solid #e0e0e0',
        padding: '0 2rem',
        display: 'flex',
        gap: '2rem',
      }}>
        {[
          { id: 'inicio', label: 'Inicio', icon: BsHouse },
          { id: 'reportar', label: 'Reportar', icon: BsPencilSquare },
          { id: 'reportes', label: 'Mis Reportes', icon: BsFileText },
          { id: 'perfil', label: 'Perfil', icon: BsGear },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '1rem 0',
              cursor: 'pointer',
              borderBottom: activeTab === id ? '3px solid #2d7a47' : 'none',
              color: activeTab === id ? '#2d7a47' : '#666',
              fontWeight: activeTab === id ? '600' : '400',
              fontSize: '1rem',
              fontFamily: "'Poppins', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Icon size={20} /> {label}
          </button>
        ))}
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
