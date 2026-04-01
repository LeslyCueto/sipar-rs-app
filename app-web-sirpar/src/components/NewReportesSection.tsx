import { useState, useEffect } from 'react';
import { BsChevronLeft, BsChevronRight, BsGeoAlt, BsCalendar, BsPersonCircle } from 'react-icons/bs';
import reporte1 from '../assets/img/img-reportes/reporte1.svg';
import reporte2 from '../assets/img/img-reportes/reporte2.svg';

export interface Reporte {
  id: number;
  titulo: string;
  fecha: string;
  ubicacion: string;
  estado: 'pendiente' | 'en_proceso' | 'resuelto';
  imagen?: string;
}

export interface NewReportesSectionProps {
  title?: string;
  reportes?: Reporte[];
  onVerTodos?: () => void;
}

export function NewReportesSection({
  title = 'Algunas personas ya reportaron...',
  reportes = [
    { id: 1, titulo: 'Residuos', fecha: '10 May, 2024', ubicacion: 'Zona Norte', estado: 'resuelto', imagen: reporte1 },
    { id: 2, titulo: 'Quema ilegal', fecha: '05 May, 2024', ubicacion: 'Zona Centro', estado: 'en_proceso', imagen: reporte2 },
    { id: 3, titulo: 'Contaminación de aire', fecha: '01 May, 2024', ubicacion: 'Zona Sur', estado: 'pendiente', imagen: reporte1 },
    { id: 4, titulo: 'Gases tóxicos', fecha: '28 Apr, 2024', ubicacion: 'Zona Este', estado: 'resuelto', imagen: reporte2 },
    { id: 5, titulo: 'Humo industrial', fecha: '25 Apr, 2024', ubicacion: 'Zona Oeste', estado: 'en_proceso', imagen: reporte1 }
  ]
}: NewReportesSectionProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [itemsPorVista, setItemsPorVista] = useState(3);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setItemsPorVista(window.innerWidth < 768 ? 1 : 3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay del carrusel
  useEffect(() => {
    if (isHovering) return;

    const timer = setInterval(() => {
      setIndiceActual((prev) => {
        const maxIndice = Math.max(0, reportes.length - itemsPorVista);
        return (prev + 1) % (maxIndice + 1);
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isHovering, itemsPorVista, reportes.length]);

  const irAAnterior = () => {
    setIndiceActual((prev) => {
      if (prev === 0) {
        return Math.max(0, reportes.length - itemsPorVista);
      }
      return prev - 1;
    });
  };

  const irASiguiente = () => {
    setIndiceActual((prev) => {
      const maxIndice = Math.max(0, reportes.length - itemsPorVista);
      return (prev + 1) % (maxIndice + 1);
    });
  };

  return (
    <section id="reportes" style={{
      padding: 'clamp(2rem, 5vw, 4rem) 2rem',
      backgroundColor: '#ffffff',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)'
    }}>
      <h2 style={{
        textAlign: 'center',
        fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
        marginBottom: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
        color: '#1a1a1a'
      }}>
        {title}
      </h2>

      {/* Párrafo descriptivo */}
      <p style={{
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto clamp(1.5rem, 4vw, 2rem)',
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        color: '#6b7280',
        lineHeight: '1.6',
        fontFamily: "'Poppins', sans-serif"
      }}>
        Tu seguridad es importante para nosotros. Puedes reportar de forma anónima y sin preocupaciones. Lo que realmente importa es tu aporte: cada acción ayuda a cuidar tu comunidad y prevenir riesgos para todos.
      </p>

      {/* Carrusel */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}>

        {/* Contenedor del carrusel */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          paddingBottom: 'clamp(1rem, 3vw, 2rem)'
        }}>
          {/* Contenedor de tarjetas */}
          <div style={{
            display: 'flex',
            transition: 'transform 0.5s ease-in-out',
            transform: `translateX(-${indiceActual * (100 / itemsPorVista)}%)`,
            gap: 'clamp(1rem, 2vw, 2rem)',
            padding: '0 clamp(1rem, 3vw, 2rem)'
          }}>
            {reportes.map((reporte) => (
              <div
                key={reporte.id}
                style={{
                  flex: `0 0 calc((100% - ${(itemsPorVista - 1) * 16}px) / ${itemsPorVista})`,
                  minWidth: 0
                }}
              >
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e5e7eb',
                  height: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  {/* Imagen */}
                  <div style={{
                    width: '100%',
                    height: 'clamp(200px, 30vw, 250px)',
                    backgroundColor: '#e5e7eb',
                    backgroundImage: reporte.imagen ? `url(${reporte.imagen})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '1rem 1rem 0 0'
                  }} />

                  {/* Contenido */}
                  <div style={{
                    padding: 'clamp(1rem, 2vw, 1.5rem)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 0.75rem 0',
                        color: '#1a1a1a',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
                        fontWeight: '600'
                      }}>
                        {reporte.titulo}
                      </h3>
                      
                      {/* Ubicación con icono */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        color: '#6b7280',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
                      }}>
                        <BsGeoAlt size={16} />
                        <span>{reporte.ubicacion}</span>
                      </div>

                      {/* Fecha con icono */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#9ca3af',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)'
                      }}>
                        <BsCalendar size={16} />
                        <span>{reporte.fecha}</span>
                      </div>
                    </div>

                    {/* Anónimo */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <BsPersonCircle size={20} />
                      <span style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        Anónimo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de navegación */}
        {reportes.length > itemsPorVista && (
          <>
            <button
              onClick={irAAnterior}
              style={{
                position: 'absolute',
                left: 0,
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
              <BsChevronLeft />
            </button>

            <button
              onClick={irASiguiente}
              style={{
                position: 'absolute',
                right: 0,
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
          </>
        )}
      </div>
    </section>
  );
}
