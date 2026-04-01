import { BsLightbulb, BsArrowClockwise } from 'react-icons/bs';

export interface EstadoAmbientalSectionProps {
  title?: string;
  stats?: Array<{ icon: React.ReactNode; label: string; value: string; subtitle: string }>;
}

export function EstadoAmbientalSection({
  title = 'Estado Ambiental Actual',
  stats = [
    { icon: <BsLightbulb />, label: 'Número de Reportes', value: '50', subtitle: 'incidentes' },
    { icon: <BsArrowClockwise />, label: 'Última Actualización', value: '03/12', subtitle: '' }
  ]
}: EstadoAmbientalSectionProps) {
  return (
    <section id="estado" style={{ 
      padding: 'clamp(2rem, 5vw, 4rem) 2rem', 
      backgroundColor: '#f9fafb', 
      width: '100vw', 
      marginLeft: 'calc(-50vw + 50%)' 
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
        marginBottom: 'clamp(1.5rem, 5vw, 3rem)', 
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
        color: '#1a1a1a'
      }}>
        {title}
      </h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(1.5rem, 4vw, 2.5rem)',
        maxWidth: '800px',
        margin: '0 auto',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            backgroundColor: '#ffffff',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            borderRadius: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            textAlign: 'center',
            minWidth: 'clamp(280px, 90vw, 350px)',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{
              fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'center',
              color: '#2d7a47'
            }}>
              {stat.icon}
            </div>
            <h3 style={{ 
              marginBottom: '0.5rem', 
              color: '#1a1a1a',
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
              fontWeight: '500'
            }}>
              {stat.label}
            </h3>
            <p style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
              fontWeight: '400',
              color: '#484C52',
              margin: '0.5rem 0 0 0',
              fontFamily: "'Poppins', sans-serif"
            }}>
              {stat.value}
            </p>
            {stat.subtitle && (
              <p style={{
                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                color: '#6b7280',
                margin: '0.5rem 0 0 0',
                fontFamily: "'Poppins', sans-serif"
              }}>
                {stat.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
