import { useState } from 'react';
import { BsBox, BsGeo, BsGraphUp, BsPeople, BsBoxArrowRight } from 'react-icons/bs';
import { logoutUsuario, obtenerUsuarioActual } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export function DashboardOperador() {
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
        backgroundColor: '#1565a0',
        color: '#fff',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>
          📊 SIPAR-RS - Operador
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif" }}>👤 {usuario?.nombre || 'Operador'}</span>
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
          { id: 'inicio', label: 'Inicio', icon: BsBox },
          { id: 'reportes', label: 'Reportes en Revisión', icon: BsGeo },
          { id: 'validados', label: 'Reportes Validados', icon: BsGraphUp },
          { id: 'estadisticas', label: 'Estadísticas', icon: BsPeople },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '1rem 0',
              cursor: 'pointer',
              borderBottom: activeTab === id ? '3px solid #1565a0' : 'none',
              color: activeTab === id ? '#1565a0' : '#666',
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
        {activeTab === 'inicio' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1565a0', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              📋 Bienvenido, {usuario?.nombre}
            </h2>
            <p style={{ fontSize: '1rem', color: '#666', fontFamily: "'Poppins', sans-serif", lineHeight: '1.6' }}>
              Como operador ambiental, tu función es revisar y validar los reportes enviados por ciudadanos. Tu trabajo es crucial para:
            </p>
            <ul style={{ fontSize: '1rem', color: '#666', fontFamily: "'Poppins', sans-serif", lineHeight: '1.8', marginTop: '1rem' }}>
              <li>✅ Revisar la validez de reportes</li>
              <li>📸 Verificar contenido multimedia</li>
              <li>📝 Clasificar reportes por zona</li>
              <li>🔄 Hacer seguimiento a resoluciones</li>
            </ul>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1565a0', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              📋 Reportes en Revisión
            </h2>
            <p style={{ color: '#999', fontFamily: "'Poppins', sans-serif" }}>
              No hay reportes pendientes en este momento.
            </p>
          </div>
        )}

        {activeTab === 'validados' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1565a0', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              ✅ Reportes Validados
            </h2>
            <p style={{ color: '#999', fontFamily: "'Poppins', sans-serif" }}>
              Reportes validados y enviados a administración.
            </p>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1565a0', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              📊 Estadísticas de Operación
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Reportes Revisados', value: '0' },
                { label: 'Reportes Validados', value: '0' },
                { label: 'Reportes Rechazados', value: '0' },
              ].map((stat, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#999', fontFamily: "'Poppins', sans-serif" }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1565a0', fontFamily: "'Poppins', sans-serif" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
