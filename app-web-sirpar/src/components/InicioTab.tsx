import { obtenerUsuarioActual } from '../utils/api';
import robotIcon from '../assets/img/robot-inicio.svg';

interface InicioTabProps {
  onReportarClick: () => void;
}

export function InicioTab({ onReportarClick }: InicioTabProps) {
  const usuario = obtenerUsuarioActual();
  
  // Parsear ubicación del usuario (guardada como "Departamento, Ciudad, Distrito")
  const ubicacionParts = usuario?.ubicacion?.split(', ') || [];
  const distrito = ubicacionParts[ubicacionParts.length - 1] || 'Tu Zona';

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center',
    }}>
      {/* Robot */}
      <div style={{ marginBottom: '2rem' }}>
        <img
          src={robotIcon}
          alt="Robot SIPAR"
          style={{
            width: '150px',
            height: '150px',
            margin: '0 auto',
            display: 'block',
          }}
        />
      </div>

      {/* Saludo */}
      <h2 style={{
        fontSize: '2rem',
        fontWeight: '700',
        color: '#2d7a47',
        fontFamily: "'Poppins', sans-serif",
        margin: '1rem 0',
      }}>
        ¡Hola, {usuario?.nombre?.split(' ')[0]}!
      </h2>

      {/* Distrito */}
      <p style={{
        fontSize: '1.1rem',
        color: '#666',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: '500',
        margin: '0.5rem 0 1.5rem 0',
      }}>
        {distrito} Limpio y Seguro
      </p>

      {/* Párrafo descriptivo */}
      <p style={{
        fontSize: '1rem',
        color: '#555',
        fontFamily: "'Poppins', sans-serif",
        lineHeight: '1.6',
        margin: '2rem 0',
        fontStyle: 'italic',
      }}>
        Detecta focos infecciosos y quemas ilegales en tiempo real. Tu reporte ayuda a salvar nuestro entorno.
      </p>

      {/* Botón Reportar */}
      <button
        onClick={onReportarClick}
        style={{
          backgroundColor: '#2d7a47',
          color: '#fff',
          border: 'none',
          padding: '1rem 2rem',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif",
          marginTop: '2rem',
          transition: 'background-color 0.3s',
          width: '100%',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#245a35')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2d7a47')}
      >
        📋 Reportar Incidente Ahora
      </button>
    </div>
  );
}
