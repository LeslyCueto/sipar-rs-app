import { useEffect, useState } from 'react';

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
      const response = await fetch('/api/reports', {
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
      console.error('❌ Error:', err);
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
    return tipo === 'quema_ilegal' ? '🔥 Quema de residuos' : '🗑️ Acumulación de residuos';
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#2d7a47',
        fontFamily: "'Poppins', sans-serif",
        marginBottom: '2rem',
      }}>
        Mis Reportes
      </h2>

      {cargando && (
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontFamily: "'Poppins', sans-serif",
        }}>
          ⏳ Cargando reportes...
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
          gap: '1.5rem',
        }}>
          {reportes.map(reporte => (
            <div key={reporte._id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              backgroundColor: '#f9f9f9',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1rem',
              }}>
                <div>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: '600',
                    fontSize: '1rem',
                    color: '#333',
                    margin: '0 0 0.5rem 0',
                  }}>
                    {getTipoIncidenteLabel(reporte.tipoIncidente)}
                  </p>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.9rem',
                    color: '#666',
                    margin: '0',
                  }}>
                    📍 {reporte.ubicacion?.distrito}, {reporte.ubicacion?.provincia}
                  </p>
                </div>
                <div style={{
                  backgroundColor: getEstadoColor(reporte.estado),
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}>
                  {getEstadoLabel(reporte.estado)}
                </div>
              </div>

              {reporte.descripcion && (
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.9rem',
                  color: '#666',
                  margin: '0.75rem 0',
                  paddingLeft: '1rem',
                  borderLeft: '3px solid #2d7a47',
                }}>
                  "{reporte.descripcion}"
                </p>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e0e0e0',
              }}>
                <div>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.8rem',
                    color: '#999',
                    margin: '0 0 0.25rem 0',
                  }}>
                    Nivel de Riesgo
                  </p>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#333',
                    margin: '0',
                    textTransform: 'capitalize',
                  }}>
                    {reporte.nivelPercibido}
                  </p>
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.8rem',
                    color: '#999',
                    margin: '0 0 0.25rem 0',
                  }}>
                    Fecha de Reporte
                  </p>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#333',
                    margin: '0',
                  }}>
                    {new Date(reporte.fechas?.creado).toLocaleDateString('es-PE')}
                  </p>
                </div>
                {reporte.anonimo && (
                  <div>
                    <p style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.8rem',
                      color: '#999',
                      margin: '0 0 0.25rem 0',
                    }}>
                      Privacidad
                    </p>
                    <p style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#2d7a47',
                      margin: '0',
                    }}>
                      🔒 Anónimo
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
