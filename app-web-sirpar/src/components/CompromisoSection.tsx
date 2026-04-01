import { useState, useEffect } from 'react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

import carrusel1 from '../assets/img/carrusel1.png';
import carrusel2 from '../assets/img/carrusel2.png';
import carrusel3 from '../assets/img/carrusel3.png';
import imagenPrincipal from '../assets/img/imagen principal.png';


export interface CompromisoSectionProps {
  title?: string;
  description?: string;
  imagenes?: Array<{ id: number; nombre: string; url?: string }>;
  intervalo?: number;
  imagenQue?: string;
}

export function CompromisoSection({
  title = 'Nuestro compromiso ambiental',
  description = 'SIRPAR-RS busca prevenir focos infecciosos y quemas ilegales mediante el monitoreo de datos y la participación ciudadana, contribuyendo a la protección de la salud pública y del medio ambiente.',
  imagenes = [
    { id: 1, nombre: 'La contaminación en el Perú', url: carrusel1 },
    { id: 2, nombre: 'Una ciudad más limpia', url: carrusel2 },
    { id: 3, nombre: 'Tu reporte cuenta', url: carrusel3 },
],
  intervalo = 3000,
  imagenQue = imagenPrincipal
}: CompromisoSectionProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Autoplay del carrusel
  useEffect(() => {
    if (isHovering) return; // No cambiar mientras se hoverea

    const timer = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % imagenes.length);
    }, intervalo);

    return () => clearInterval(timer);
  }, [isHovering, imagenes.length, intervalo]);

  const irAAnterior = () => {
    setIndiceActual((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  const irASiguiente = () => {
    setIndiceActual((prev) => (prev + 1) % imagenes.length);
  };

  return (
    <section style={{
      padding: 'clamp(2rem, 5vw, 4rem) 2rem',
      backgroundColor: '#ffffff',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)'
    }}>
      {/* Tarjeta "¿Qué es SIPAR -RS?" */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto clamp(2rem, 5vw, 3rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: 'clamp(3rem, 8vw, 4rem)'
      }}>
        {/* Contenido */}
        <h2 style={{
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          color: '#1a1a1a',
          marginBottom: '1.5rem',
          margin: '0 0 1.5rem 0',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif"
        }}>
          ¿Qué es SIPAR -RS?
        </h2>
        <p style={{
          fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
          color: '#464251',
          lineHeight: '1.6',
          marginBottom: '2rem',
          margin: '0 0 2rem 0',
          fontFamily: "'Poppins', sans-serif",
          maxWidth: '700px'
        }}>
          SIPAR-RS monitorea zonas ambientales críticas mediante reportes ciudadanos y análisis predictivo, ayudando a prevenir riesgos para la salud y el medio ambiente.
        </p>

        {/* Imagen debajo */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          height: 'clamp(30em, 35vw, 350px)',
          borderRadius: '1rem',
          backgroundImage: `url(${imagenQue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#e5e7eb',
          marginBottom: '2rem'
        }} />
      </div>

      {/* Título y descripción principales */}
      <div style={{ maxWidth: '900px', margin: '0 auto clamp(2rem, 5vw, 3rem)' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          marginBottom: '1.5rem',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif",
          color: '#1a1a1a'
        }}>
          {title}
        </h2>
        <p style={{
          textAlign: 'center',
          fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
          color: '#6b7280',
          lineHeight: '1.6',
          fontFamily: "'Poppins', sans-serif",
          marginBottom: '0'
        }}>
          {description}
        </p>
      </div>

      {/* Carrusel */}
      <div style={{
        maxWidth: '900px',
        margin: 'clamp(2rem, 5vw, 3rem) auto 0',
        position: 'relative',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}>
        
        {/* Contenedor de imágenes */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '66.67%', // Ratio 3:2
          overflow: 'hidden',
          backgroundColor: '#e5e7eb'
        }}>
          {/* Imágenes */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            transition: 'transform 0.5s ease-in-out',
            transform: `translateX(-${indiceActual * 100}%)`
          }}>
            {imagenes.map((img) => (
              <div
                key={img.id}
                style={{
                  width: '100%',
                  height: '100%',
                  flexShrink: 0,
                  backgroundImage: `url(${img.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#e5e7eb'
                }}
              />
            ))}
          </div>

          {/* Botones de navegación */}
          <button
            onClick={irAAnterior}
            style={{
              position: 'absolute',
              left: 'clamp(0.75rem, 3vw, 1.5rem)',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(40px, 8vw, 50px)',
              height: 'clamp(40px, 8vw, 50px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              transition: 'all 0.3s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
          >
            <BsChevronLeft />
          </button>

          <button
            onClick={irASiguiente}
            style={{
              position: 'absolute',
              right: 'clamp(0.75rem, 3vw, 1.5rem)',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(40px, 8vw, 50px)',
              height: 'clamp(40px, 8vw, 50px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              transition: 'all 0.3s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
          >
            <BsChevronRight />
          </button>

          {/* Indicadores */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(0.75rem, 3vw, 1.25rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 10
          }}>
            {imagenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setIndiceActual(idx)}
                style={{
                  width: indiceActual === idx ? '2rem' : '0.75rem',
                  height: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: indiceActual === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Overlay con nombre de imagen */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: '#ffffff',
          padding: 'clamp(0.75rem, 2vw, 1.25rem)',
          textAlign: 'center',
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(0.85rem, 2vw, 1rem)',
          fontWeight: '500',
          zIndex: 9
        }}>
          {imagenes[indiceActual].nombre}
        </div>
      </div>
    </section>
  );
}
