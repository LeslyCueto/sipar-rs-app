import { useState } from 'react';
import { BsHouse, BsFileText, BsPeople, BsGear, BsPerson, BsBoxArrowRight, BsX, BsList, BsGeoAlt, BsBarChart, BsChevronDown } from 'react-icons/bs';
import { logoutUsuario } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/img/SIPAR-RS_logo.svg';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'operador' | 'ciudadano';
  userName?: string;
  isMobile: boolean;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab, userRole, userName = 'Admin', isMobile, onTabChange }: SidebarProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [configOpen, setConfigOpen] = useState(false);

  const adminNavItems: NavItem[] = [
    { id: 'inicio', label: 'Dashboard', icon: BsHouse },
    { id: 'usuarios', label: 'Gestión de Usuarios', icon: BsPeople },
    { id: 'operadores', label: 'Gestión de Operadores', icon: BsBarChart },
    { id: 'zonas', label: 'Gestión de Zonas', icon: BsGeoAlt },
  ];

  const operadorNavItems: NavItem[] = [
    { id: 'inicio', label: 'Dashboard', icon: BsHouse },
    { id: 'reportes', label: 'Gestión de Reportes', icon: BsFileText },
    { id: 'perfil', label: 'Perfil', icon: BsPerson },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : operadorNavItems;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange(tabId);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = () => {
    logoutUsuario();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          backgroundColor: '#0d3a26',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        {sidebarOpen ? <BsX size={16} /> : <BsList size={16} />}
      </button>

      {/* Sidebar Overlay Mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: isMobile ? '80%' : '250px',
          height: '100vh',
          background: '#0d3a26',
          color: '#fff',
          padding: '1.5rem 0',
          overflowY: 'auto',
          zIndex: 1000,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          isolation: 'isolate',
        }}
      >
        {/* Logo Section */}
        <div style={{ padding: '1rem 1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative', zIndex: 1 }}>
          <img
            src={Logo}
            alt="SIPAR-RS Logo"
            style={{
              height: '95%',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0', position: 'relative', zIndex: 1 }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              style={{
                width: '100%',
                backgroundColor: activeTab === id && id !== 'usuarios' ? 'rgba(45, 122, 71, 0.3)' : 'transparent',
                color: activeTab === id ? '#fff' : '#fff',
                border: 'none',
                padding: '0.9rem 1.5rem',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                fontWeight: activeTab === id ? '600' : '400',
                transition: 'all 0.2s ease',
                borderLeft: activeTab === id ? '3px solid #2d7a47' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (id !== 'usuarios') {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.3)';
                }
                (e.target as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== id || id === 'usuarios') {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Configuration Section */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: '1rem 0', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => setConfigOpen(!configOpen)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#fff',
              border: 'none',
              padding: '0.9rem 1.5rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              fontWeight: '400',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.3)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <BsGear size={18} />
            <span style={{ flex: 1 }}>Configuración</span>
            <BsChevronDown size={16} style={{ transform: configOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>

          {configOpen && (
            <>
              <button
                onClick={() => handleTabChange('perfil')}
                style={{
                  width: '100%',
                  backgroundColor: activeTab === 'perfil' ? 'rgba(45, 122, 71, 0.3)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8rem 1.5rem 0.8rem 3rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'perfil' ? '600' : '400',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.3)';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'perfil') {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                <BsPerson size={16} />
                Mi Perfil
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', padding: '1rem', position: 'relative', zIndex: 1 }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              backgroundColor: '#2d7a47',
              color: '#fff',
              border: 'none',
              padding: '0.8rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#1e5a32';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#2d7a47';
            }}
          >
            <BsBoxArrowRight size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
