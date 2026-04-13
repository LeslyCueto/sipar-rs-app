import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { BsHourglassBottom, BsXCircle, BsGeoAlt, BsGraphUp } from 'react-icons/bs';

interface Zona {
  zona: string;
  departamento: string;
  provincia: string;
  coordenadas: { lat: number; lng: number };
  cantidad: number;
  tiposIncidente: { [key: string]: number };
  nivelRiesgo: 'alto' | 'medio' | 'bajo';
}

interface MapaRiesgosProps {
  googleMapsApiKey: string;
}

export function MapaRiesgos({ googleMapsApiKey }: MapaRiesgosProps) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredZona, setHoveredZona] = useState<Zona | null>(null);

  // Configuración del mapa
  const mapContainerStyle = {
    width: '100%',
    height: '600px',
    borderRadius: '1rem',
  };

  const mapCenter = {
    lat: -12.0432,
    lng: -77.0289, // Lima, Perú
  };

  const mapOptions = {
    zoom: 11,
    mapTypeId: 'roadmap' as const,
    streetViewControl: false,
    fullscreenControl: true,
  };

  // Colores según nivel de riesgo
  const getMarkerColor = (nivelRiesgo: string) => {
    switch (nivelRiesgo) {
      case 'alto':
        return '#c33'; // Rojo
      case 'medio':
        return '#ff9800'; // Naranja
      case 'bajo':
        return '#2d7a47'; // Verde
      default:
        return '#666';
    }
  };

  // Icono del marcador - Usar emojis
  const getMarkerIcon = (nivelRiesgo: string) => {
    const iconos: Record<string, string> = {
      'alto': '🔴',      // Rojo
      'medio': '🟡',     // Naranja
      'bajo': '🟢',      // Verde
    };
    return iconos[nivelRiesgo] || '🔵';  // Azul por defecto
  };

  // Cargar zonas desde la API
  useEffect(() => {
    const cargarZonas = async () => {
      try {
        setCargando(true);
        const token = localStorage.getItem('token');

        const respuesta = await fetch('/api/reports/admin/mapa', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!respuesta.ok) {
          throw new Error('Error al cargar los datos del mapa');
        }

        const datos = await respuesta.json();
        if (datos.success) {
          setZonas(datos.zonas);
        } else {
          setError('No se pudieron cargar las zonas');
        }
      } catch (err) {
        console.error('Error cargando zonas:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    };

    cargarZonas();
  }, []);

  if (cargando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '600px',
        backgroundColor: '#f5f5f5',
        borderRadius: '1rem',
        fontSize: '1.1rem',
        color: '#666',
        fontFamily: "'Poppins', sans-serif",
        gap: '0.5rem',
      }}>
        <BsHourglassBottom size={24} style={{ animation: 'spin 1s linear infinite' }} /> Cargando mapa de zonas...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '600px',
        backgroundColor: '#fee2e2',
        borderRadius: '1rem',
        fontSize: '1.1rem',
        color: '#b91c1c',
        fontFamily: "'Poppins', sans-serif",
        gap: '0.5rem',
      }}>
        <BsXCircle size={24} /> {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Leyenda */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        {[
          { color: '#c33', label: 'Riesgo Alto', count: zonas.filter(z => z.nivelRiesgo === 'alto').length },
          { color: '#ff9800', label: 'Riesgo Medio', count: zonas.filter(z => z.nivelRiesgo === 'medio').length },
          { color: '#2d7a47', label: 'Riesgo Bajo', count: zonas.filter(z => z.nivelRiesgo === 'bajo').length },
        ].map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: item.color,
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: '600', color: '#333' }}>
              {item.label} ({item.count})
            </span>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={mapOptions.zoom} options={mapOptions}>
          {zonas.map((zona, idx) => (
            <Marker
              key={idx}
              position={zona.coordenadas}
              title={`${getMarkerIcon(zona.nivelRiesgo)} ${zona.zona} - ${zona.cantidad} reportes`}
              onMouseOver={() => setHoveredZona(zona)}
              onMouseOut={() => setHoveredZona(null)}
            >
              {hoveredZona === zona && (
                <InfoWindow onCloseClick={() => setHoveredZona(null)}>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    minWidth: '250px',
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    <h3 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <BsGeoAlt size={20} /> {zona.zona}
                    </h3>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <BsGeoAlt size={14} /> {zona.provincia}, {zona.departamento}
                      </p>
                    </div>

                    <div style={{
                      backgroundColor: getMarkerColor(zona.nivelRiesgo),
                      color: '#fff',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.75rem',
                      textAlign: 'center',
                      fontWeight: '700',
                    }}>
                      Nivel de Riesgo: {zona.nivelRiesgo.toUpperCase()}
                    </div>

                    <div style={{
                      backgroundColor: '#f5f5f5',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.75rem',
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <BsGraphUp size={16} /> Total de Reportes: <span style={{ fontSize: '1.2rem' }}>{zona.cantidad}</span>
                      </p>

                      <div style={{ marginTop: '0.5rem' }}>
                        {Object.entries(zona.tiposIncidente).map(([tipo, count]) => (
                          <p key={tipo} style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                            • {tipo.replace(/_/g, ' ')}: <strong>{count}</strong>
                          </p>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      color: '#999',
                      textAlign: 'center',
                    }}>
                      Haz clic para más detalles
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}
        </GoogleMap>
      </LoadScript>

      {/* Estadísticas generales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        {[
          { label: 'Total de Zonas', value: zonas.length, color: '#2d7a47' },
          { label: 'Zonas en Riesgo Alto', value: zonas.filter(z => z.nivelRiesgo === 'alto').length, color: '#d32f2f' },
          { label: 'Zonas en Riesgo Medio', value: zonas.filter(z => z.nivelRiesgo === 'medio').length, color: '#f57c00' },
          { label: 'Zonas Seguras', value: zonas.filter(z => z.nivelRiesgo === 'bajo').length, color: '#388e3c' },
        ].map((stat, idx) => (
          <div key={idx} style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: stat.color,
              }} />
            </p>
            <p style={{
              margin: '0 0 0.25rem 0',
              fontSize: '0.95rem',
              color: '#999',
              fontFamily: "'Poppins', sans-serif",
            }}>
              {stat.label}
            </p>
            <p style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1565a0',
              fontFamily: "'Poppins', sans-serif",
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      {zonas.length === 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          color: '#d97706',
          fontFamily: "'Poppins', sans-serif",
        }}>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            ℹ️ No hay reportes registrados aún. Los datos aparecerán cuando se creen nuevos reportes.
          </p>
        </div>
      )}
    </div>
  );
}