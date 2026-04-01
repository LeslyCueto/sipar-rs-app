import robotCallForAction from '../assets/img/robot_callforaction.svg'
import fondoCallFor from '../assets/img/fondo_callfor.svg';

export interface CallActionSectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export function CallActionSection({
  title = 'Ayuda a proteger tu comunidad',
  description = 'Tu reporte puede ayudar a prevenir problemas ambientales y proteger la salud de todos.',
  primaryButtonText = 'Reportar incidente',
  onPrimaryClick,
}: CallActionSectionProps) {
  return (
    <section style={{
  backgroundImage: `url(${fondoCallFor})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  padding: 'clamp(3rem, 8vw, 5rem) 2rem',
}}>
  
  <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  alignItems: 'center',
  maxWidth: '1100px',
  margin: '0 auto',
  gap: 'clamp(2rem, 5vw, 4rem)'
}}>
    
    {/* IZQUIERDA → ROBOT */}
    <div style={{
      display: 'flex',
      justifyContent: 'center'
    }}>
      <img
        src={robotCallForAction}
        alt="Robot SIRPAR"
        style={{
          width: 'clamp(30em, 40vw, 50em)',
          height: 'auto'
        }}
      />
    </div>

    {/* DERECHA → CARD */}
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: 'clamp(1rem, 3vw, 1.5rem)',
      padding: 'clamp(2rem, 5vw, 3rem)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      textAlign: 'center'
    }}>
      <h2 style={{
        fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
        marginBottom: '1rem',
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
        color: '#1a1a1a'
      }}>
        {title}
      </h2>

      <p style={{
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
        color: '#6b7280',
        lineHeight: '1.6',
        fontFamily: "'Poppins', sans-serif"
      }}>
        {description}
      </p>

      <button
        onClick={onPrimaryClick}
        style={{
          backgroundColor: '#ff8c00',
          color: '#ffffff',
          border: 'none',
          padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
          fontSize: 'clamp(0.9rem, 2vw, 1rem)',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {primaryButtonText}
      </button>
    </div>

  </div>
</section>
  );
}
