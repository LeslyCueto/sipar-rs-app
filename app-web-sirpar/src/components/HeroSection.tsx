import robotImg from '../assets/img/robot-inicio.svg'
import fondoHero from '../assets/img/fondo-hero.svg'

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function HeroSection({
  subtitle = 'Sistema Integral de Reportes Ambientales',
}: HeroSectionProps) {
  return (
    <>
      <section style={{
        backgroundImage: `url(${fondoHero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#ffffff',
        color: '#1a472a',
        padding: 'clamp(3rem, 5vw, 6rem) 2rem',
        textAlign: 'center',
        minHeight: 'clamp(400px, 80vh, 600px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginTop: 0,
        marginBottom: 0
      }}>
        <img 
          src={robotImg} 
          alt="Robot SIRPAR" 
          style={{
            maxWidth: '30em',
            width: '100%',
            height: 'auto',
            marginBottom: '2rem'
          }}
        />
        <div style={{ 
          marginBottom: '1rem'
        }}>
          <p style={{
            fontSize: 'clamp(1.25rem, 5vw, 1.8rem)',
            margin: 0,
            fontFamily: "'Poppins', sans-serif",
            color: '#1a1a1a',
            fontWeight: '400'
          }}>
            Bienvenido a
          </p>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            margin: '0.5rem 0 0 0',
            fontWeight: 'bold',
            fontFamily: "'Poppins', sans-serif"
          }}>
            <span style={{ color: '#2d7a47' }}>SIPAR</span><span style={{ color: '#464251' }}>-RS</span>
          </h2>
        </div>
        <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9, display: 'none' }}>{subtitle}</p>
        
        {/* Curva inferior */}
        <svg 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 'auto'
          }}
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M0,60 Q300,0 600,60 T1200,60 L1200,120 L0,120 Z" 
            fill="#f9fafb"
          />
        </svg>
      </section>
    </>
  );
}
