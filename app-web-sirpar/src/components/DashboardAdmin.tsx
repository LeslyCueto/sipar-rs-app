import { useState } from 'react';
import { BsBox, BsGeo, BsGraphUp, BsPeople, BsGear, BsBoxArrowRight } from 'react-icons/bs';
import { logoutUsuario, obtenerUsuarioActual } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export function DashboardAdmin() {
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
        backgroundColor: '#d32f2f',
        color: '#fff',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>
          🛡️ SIPAR-RS - Administrador
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontFamily: "'Poppins', sans-serif" }}>👤 {usuario?.nombre || 'Admin'}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#333',
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
          { id: 'inicio', label: 'Dashboard', icon: BsBox },
          { id: 'reportes', label: 'Todos los Reportes', icon: BsGeo },
          { id: 'usuarios', label: 'Gestión de Usuarios', icon: BsPeople },
          { id: 'estadisticas', label: 'Estadísticas', icon: BsGraphUp },
          { id: 'configuracion', label: 'Configuración', icon: BsGear },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '1rem 0',
              cursor: 'pointer',
              borderBottom: activeTab === id ? '3px solid #d32f2f' : 'none',
              color: activeTab === id ? '#d32f2f' : '#666',
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d32f2f', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              🎯 Panel de Administración
            </h2>
            <p style={{ fontSize: '1rem', color: '#666', fontFamily: "'Poppins', sans-serif", lineHeight: '1.6' }}>
              Bienvenido al panel administrativo de SIPAR-RS. Desde aquí puedes:
            </p>
            <ul style={{ fontSize: '1rem', color: '#666', fontFamily: "'Poppins', sans-serif", lineHeight: '1.8', marginTop: '1rem' }}>
              <li>👥 Gestionar usuarios y roles</li>
              <li>📋 Revisar y procesar todos los reportes</li>
              <li>📊 Ver estadísticas completas del sistema</li>
              <li>⚙️ Configurar parámetros del sistema</li>
              <li>🔍 Auditar actividades</li>
            </ul>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d32f2f', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              📋 Gestión de Reportes
            </h2>
            <p style={{ color: '#999', fontFamily: "'Poppins', sans-serif" }}>
              Vista consolidada de todos los reportes del sistema.
            </p>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d32f2f', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              👥 Gestión de Usuarios
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Ciudadanos', value: '0', color: '#2d7a47' },
                { label: 'Operadores', value: '2', color: '#1565a0' },
                { label: 'Admins', value: '1', color: '#d32f2f' },
              ].map((stat, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                  borderTop: `4px solid ${stat.color}`,
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#999', fontFamily: "'Poppins', sans-serif" }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: stat.color, fontFamily: "'Poppins', sans-serif" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <button style={{
              backgroundColor: '#d32f2f',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: "'Poppins', sans-serif",
            }}>
              ➕ Agregar Nuevo Usuario
            </button>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d32f2f', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              📊 Estadísticas del Sistema
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Reportes Total', value: '0' },
                { label: 'Reportes Resueltos', value: '0' },
                { label: 'Reportes Pendientes', value: '0' },
              ].map((stat, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#999', fontFamily: "'Poppins', sans-serif" }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#d32f2f', fontFamily: "'Poppins', sans-serif" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'configuracion' && (
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d32f2f', fontFamily: "'Poppins', sans-serif", marginBottom: '1rem' }}>
              ⚙️ Configuración del Sistema
            </h2>
            <p style={{ color: '#999', fontFamily: "'Poppins', sans-serif" }}>
              Opciones de configuración avanzada del sistema.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
