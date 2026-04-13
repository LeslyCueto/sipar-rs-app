import { useEffect, useState } from 'react';
import { BsGeoAlt, BsLock, BsClock, BsPerson, BsChat, BsClipboard } from 'react-icons/bs';

export function MisReportesTab() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setCargando(true);
      const response = await fetch('http://localhost:5000/api/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportes(data.reportes || []);
      } else {
        setError('No se pudieron cargar los reportes');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Error al cargar los reportes');
    } finally {
      setCargando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return '#f57c00';
      case 'en_proceso':
        return '#1976d2';
      case 'resuelto':
        return '#388e3c';
      default:
        return '#666';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente de revisión';
      case 'en_proceso':
        return 'En proceso';
      case 'resuelto':
        return 'Resuelto';
      default:
        return estado;
    }
  };

  const getTipoIncidenteLabel = (tipo: string) => {
    return tipo === 'quema_ilegal' ? 'Quema de residuos' : 'Acumulación de residuos';
  };

  const formatearIdReporte = (id: string) => {
    return `REP-${id?.toString().slice(-4).toUpperCase()}`;
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: 'clamp(1.5rem, 5vw, 2rem)',
      borderRadius: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '100%',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
        fontWeight: '700',
        color: '#2d7a47',
        fontFamily: "'Poppins', sans-serif",
        marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
      }}>
        Mis Reportes
      </h2>

      {cargando && (
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontFamily: "'Poppins', sans-serif",
        }}>
          Cargando reportes...
        </p>
      )}

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #c33',
          color: '#c33',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontFamily: "'Poppins', sans-serif",
        }}>
          {error}
        </div>
      )}

      {!cargando && reportes.length === 0 && (
        <p style={{
          color: '#999',
          fontFamily: "'Poppins', sans-serif",
          textAlign: 'center',
          padding: '2rem 0',
        }}>
          No tienes reportes aún. ¡Crea uno para empezar!
        </p>
      )}

      {!cargando && reportes.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(250px, 90vw, 300px), 1fr))',
          gap: 'clamp(1rem, 3vw, 1.5rem)',
          justifyItems: 'start',
          alignItems: 'start',
        }}>
          {reportes.map(reporte => (
            <div key={reporte._id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}>
              {/* Imagen del reporte con badges */}
              {reporte.imagenes && reporte.imagenes[0] && (
                <div style={{
                  width: '100%',
                  height: '160px',
                  backgroundColor: '#e0e0e0',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img
                    src={reporte.imagenes[0].url}
                    alt={reporte.tipoIncidente}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* Badge de estado - IZQUIERDA */}
                  <div style={{
                    position: 'absolute',
                    top: '0.6rem',
                    left: '0.6rem',
                    backgroundColor: '#fff',
                    color: getEstadoColor(reporte.estado),
                    border: `2px solid ${getEstadoColor(reporte.estado)}`,
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.25rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    zIndex: 10,
                  }}>
                    {getEstadoLabel(reporte.estado).split(' ')[0]}
                  </div>
                </div>
              )}

              {/* Contenido */}
              <div style={{
                padding: '1rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                alignItems: 'flex-start',
              }}>
                {/* ID del Reporte */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.75rem',
                  color: '#2d7a47',
                  fontWeight: '700',
                  marginBottom: '0.3rem',
                  backgroundColor: '#e8f5e9',
                  border: '1px solid #a5d6a7',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.3rem',
                  width: 'fit-content',
                }}>
                  <BsClipboard size={14} />
                  {formatearIdReporte(reporte._id)}
                </div>

                {/* Hora */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.75rem',
                  color: '#999',
                }}>
                  <BsClock size={12} />
                  {reporte.fechas?.creado ? 
                    (() => {
                      const fecha = new Date(reporte.fechas.creado);
                      const hoy = new Date();
                      const esHoy = fecha.toDateString() === hoy.toDateString();
                      return esHoy ? `Hoy, ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 
                             fecha.toLocaleDateString('es-PE');
                    })()
                    : 'Sin fecha'
                  }
                </div>

                {/* Tipo de incidente y Nivel de Riesgo */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                }}>
                  <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#2d7a47',
                    margin: '0',
                    textTransform: 'uppercase',
                    lineHeight: '1.2',
                  }}>
                    {getTipoIncidenteLabel(reporte.tipoIncidente)}
                  </span>
                  <div style={{
                    backgroundColor: reporte.nivelCalculado === 'alto' ? '#d32f2f' : 
                                    reporte.nivelCalculado === 'medio' ? '#f57c00' : '#388e3c',
                    color: '#fff',
                    padding: '0.1rem 1rem',
                    borderRadius: '0.40rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    marginTop: '0.6em',
                  }}>
                    RIESGO {reporte.nivelCalculado}
                  </div>
                </div>

                {/* Ubicación */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.85rem',
                  color: '#5a5a5a',
                }}>
                  <BsGeoAlt size={14} style={{ minWidth: '14px', marginTop: '2px' }} />
                  <span>{reporte.ubicacion?.direccion || `${reporte.ubicacion?.distrito}, ${reporte.ubicacion?.provincia}`}</span>
                </div>

                {/* Descripción */}
                {reporte.descripcion && (
                  <div style={{
                    display: 'flex',
                    gap: '0.4rem',
                    alignItems: 'flex-start',
                    marginTop: '0.5rem',
                  }}>
                    <BsChat size={14} style={{ minWidth: '14px', marginTop: '2px', color: '#2d7a47', flexShrink: 0 }} />
                    <p style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.8rem',
                      color: '#666',
                      margin: '0',
                      lineHeight: '1.4',
                      fontStyle: 'italic',
                      minHeight: '2.4em',
                    }}>
                      "{reporte.descripcion}"
                    </p>
                  </div>
                )}

                {/* Usuario o Anónimo */}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.8rem',
                }}>
                  {reporte.anonimo ? (
                    <>
                      <BsLock size={13} style={{ color: '#9c9c9c' }} />
                      <span style={{ color: '#9c9c9c', fontWeight: '500' }}>ANÓNIMO</span>
                    </>
                  ) : (
                    <>
                      <BsPerson size={13} style={{ color: '#666' }} />
                      <span style={{ color: '#666', fontWeight: '500' }}>{reporte.usuario?.nombre || 'Usuario'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
