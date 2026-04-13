import { useEffect, useState } from 'react';
import { obtenerTodosReportes, obtenerToken } from '../utils/api';
import { BsExclamationCircle, BsCheckCircle } from 'react-icons/bs';

interface ZonaInfo {
  direccion: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  totalReportes: number;
  reportesResueltos: number;
  operadoresUnicos: Set<string>;
  operadoresCont: number;
  criticidad: 'BAJA' | 'MEDIA' | 'ALTA';
  reportesAlta: number;
  reportesMedia: number;
  reportesBaja: number;
}

export function GestionarZonas() {
  const [zonas, setZonas] = useState<ZonaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const cargarZonas = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = obtenerToken();
        if (!token) {
          throw new Error('No hay sesión activa');
        }

        const reportes = await obtenerTodosReportes();

        // Agrupar reportes por dirección
        const zonasMap = new Map<string, ZonaInfo>();

        reportes.forEach((reporte: any) => {
          const direccion = reporte.ubicacion?.direccion || 'Sin dirección';
          const distrito = reporte.ubicacion?.distrito || 'Sin distrito';
          const provincia = reporte.ubicacion?.provincia || 'Sin provincia';
          const departamento = reporte.ubicacion?.departamento || 'Sin departamento';

          if (!zonasMap.has(direccion)) {
            zonasMap.set(direccion, {
              direccion,
              distrito,
              provincia,
              departamento,
              totalReportes: 0,
              reportesResueltos: 0,
              operadoresUnicos: new Set(),
              operadoresCont: 0,
              criticidad: 'BAJA',
              reportesAlta: 0,
              reportesMedia: 0,
              reportesBaja: 0,
            });
          }

          const zonaInfo = zonasMap.get(direccion)!;

          // Contar reportes
          zonaInfo.totalReportes++;

          // Contar resueltos
          if (reporte.estado === 'resuelto') {
            zonaInfo.reportesResueltos++;
          }

          // Agregar operador único
          if (reporte.operadorAsignado?.id?._id || reporte.operadorAsignado?._id) {
            const operadorId = reporte.operadorAsignado?.id?._id || reporte.operadorAsignado?._id;
            zonaInfo.operadoresUnicos.add(operadorId.toString());
          }

          // Contar por nivel de riesgo real (nivelCalculado)
          const nivel = reporte.nivelCalculado || 'bajo';
          if (nivel === 'alto') {
            zonaInfo.reportesAlta++;
          } else if (nivel === 'medio') {
            zonaInfo.reportesMedia++;
          } else {
            zonaInfo.reportesBaja++;
          }
        });

        // Calcular criticidad general y operadores
        const zonasArray = Array.from(zonasMap.values()).map((zona) => {
          // Criticidad se basa en el porcentaje de reportes ALTA
          const porcentajeAlta = (zona.reportesAlta / zona.totalReportes) * 100;
          let criticidad: 'BAJA' | 'MEDIA' | 'ALTA' = 'BAJA';

          if (porcentajeAlta >= 50) {
            criticidad = 'ALTA';
          } else if (porcentajeAlta >= 25) {
            criticidad = 'MEDIA';
          }

          return {
            ...zona,
            operadoresCont: zona.operadoresUnicos.size,
            criticidad,
          };
        });

        // Ordenar por total de reportes descendente
        zonasArray.sort((a, b) => b.totalReportes - a.totalReportes);

        setZonas(zonasArray);
        setLoading(false);
      } catch (err: any) {
        console.error('Error cargando zonas:', err);
        setError(err.message || 'Error al cargar zonas');
        setLoading(false);
      }
    };

    cargarZonas();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad) {
      case 'ALTA':
        return '#ff3333';
      case 'MEDIA':
        return '#ff9800';
      case 'BAJA':
        return '#4caf50';
      default:
        return '#999';
    }
  };

  const getCriticidadBg = (criticidad: string) => {
    switch (criticidad) {
      case 'ALTA':
        return '#ffe0e0';
      case 'MEDIA':
        return '#fff3e0';
      case 'BAJA':
        return '#e8f5e9';
      default:
        return '#f5f5f5';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Indicador de carga */}
      {loading && (
        <div
          style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #4caf50',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#2e7d32',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          ⏳ Cargando información de zonas...
        </div>
      )}

      {/* Indicador de error */}
      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#c62828',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem', textAlign: 'left' }}>
        <h2
          style={{
            margin: 0,
            fontSize: isMobile ? '1.2rem' : '1.8rem',
            fontWeight: '700',
            color: '#244d3b',
            fontFamily: "'Poppins', sans-serif",
            textAlign: 'left',
          }}
        >
          MONITOREO DE DIRECCIONES
        </h2>
        <p
          style={{
            margin: '0.3rem 0 0 0',
            fontSize: isMobile ? '0.7rem' : '0.85rem',
            color: '#999',
            fontFamily: "'Poppins', sans-serif",
            textAlign: 'left',
          }}
        >
          UBICACIONES REPORTADAS • {zonas.length} DIRECCIONES ACTIVAS
        </p>
      </div>

      {/* Grid de Zonas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {zonas.length === 0 ? (
          <div
            style={{
              backgroundColor: '#f9f9f9',
              border: '2px dashed #ccc',
              borderRadius: '0.8rem',
              padding: '2rem',
              textAlign: 'center',
              gridColumn: '1 / -1',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: '#999',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              No hay reportes registrados aún.
            </p>
          </div>
        ) : (
          zonas.map((zona, idx) => {
            const efectividad =
              zona.totalReportes > 0
                ? Math.round((zona.reportesResueltos / zona.totalReportes) * 100)
                : 0;

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '0.8rem',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${getCriticidadColor(zona.criticidad)}20`,
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 4px 16px rgba(0,0,0,0.15)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 2px 8px rgba(0,0,0,0.1)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Header de la Tarjeta */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.5rem',
                    borderBottom: `3px solid ${getCriticidadColor(zona.criticidad)}`,
                  }}
                >
                  {/* Ícono Criticidad */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '50px',
                      height: '50px',
                      borderRadius: '0.6rem',
                      backgroundColor: getCriticidadBg(zona.criticidad),
                      flexShrink: 0,
                    }}
                  >
                    <BsExclamationCircle
                      size={28}
                      color={getCriticidadColor(zona.criticidad)}
                    />
                  </div>

                  {/* Información Principal */}
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: '0 0 0.3rem 0',
                        fontSize: isMobile ? '1rem' : '1.3rem',
                        fontWeight: '700',
                        color: '#244d3b',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {zona.direccion}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: '#999',
                        fontWeight: '600',
                        fontFamily: "'Poppins', sans-serif",
                        letterSpacing: '0.3px',
                      }}
                    >
                      {zona.distrito}, {zona.provincia}, {zona.departamento}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: getCriticidadBg(zona.criticidad),
                          color: getCriticidadColor(zona.criticidad),
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.3rem',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          letterSpacing: '0.3px',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        CRITICIDAD {zona.criticidad}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenido Principal */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Métricas Principales */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {/* Total Reportes */}
                    <div>
                      <p
                        style={{
                          margin: '0 0 0.3rem 0',
                          fontSize: '0.75rem',
                          color: '#999',
                          fontWeight: '600',
                          letterSpacing: '0.3px',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        TOTAL REPORTES
                      </p>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '1.8rem',
                          fontWeight: '700',
                          color: '#244d3b',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {zona.totalReportes}
                      </h4>
                    </div>

                    {/* Operadores */}
                    <div>
                      <p
                        style={{
                          margin: '0 0 0.3rem 0',
                          fontSize: '0.75rem',
                          color: '#999',
                          fontWeight: '600',
                          letterSpacing: '0.3px',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        OPERADORES
                      </p>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '1.8rem',
                          fontWeight: '700',
                          color: '#244d3b',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {zona.operadoresCont}
                      </h4>
                    </div>
                  </div>

                  {/* Distribución por Severidad */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '0.5rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#ffe0e0',
                        padding: '0.6rem',
                        borderRadius: '0.4rem',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.65rem',
                          color: '#c62828',
                          fontWeight: '700',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        ALTA
                      </p>
                      <p
                        style={{
                          margin: '0.2rem 0 0 0',
                          fontSize: '0.9rem',
                          color: '#ff3333',
                          fontWeight: '700',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {zona.reportesAlta}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#fff3e0',
                        padding: '0.6rem',
                        borderRadius: '0.4rem',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.65rem',
                          color: '#e65100',
                          fontWeight: '700',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        MEDIA
                      </p>
                      <p
                        style={{
                          margin: '0.2rem 0 0 0',
                          fontSize: '0.9rem',
                          color: '#ff9800',
                          fontWeight: '700',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {zona.reportesMedia}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#e8f5e9',
                        padding: '0.6rem',
                        borderRadius: '0.4rem',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.65rem',
                          color: '#2d7a47',
                          fontWeight: '700',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        BAJA
                      </p>
                      <p
                        style={{
                          margin: '0.2rem 0 0 0',
                          fontSize: '0.9rem',
                          color: '#4caf50',
                          fontWeight: '700',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {zona.reportesBaja}
                      </p>
                    </div>
                  </div>

                  {/* Sección Efectividad */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#999',
                          fontWeight: '600',
                          letterSpacing: '0.3px',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        EFECTIVIDAD
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          color: '#244d3b',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {efectividad}%
                      </p>
                    </div>

                    {/* Barra de Progreso */}
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: '#4caf50',
                          width: `${efectividad}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    {/* Detalle de Resueltos */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.7rem',
                        color: '#666',
                        fontWeight: '600',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {zona.reportesResueltos} de {zona.totalReportes} reportes resueltos
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          div[style*="grid-template-columns"] {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
