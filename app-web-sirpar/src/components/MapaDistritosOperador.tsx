import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import { BsHourglassBottom } from 'react-icons/bs';

interface DistritoData {
  distrito: string;
  total: number;
  tiposCount: Record<string, number>;
  nivelRiesgo: 'alto' | 'medio' | 'bajo';
  coordenadas?: { lat: number; lng: number };
  direccion: string;
}

interface MapaDistritosOperadorProps {
  reportesPorDistrito: DistritoData[];
  googleMapsApiKey: string;
  isMobile?: boolean;
}

export function MapaDistritosOperador({ reportesPorDistrito, googleMapsApiKey, isMobile = false }: MapaDistritosOperadorProps) {
  const [selectedDistrito, setSelectedDistrito] = useState<DistritoData | null>(null);

  // Log para debugging
  console.log('MapaDistritosOperador - googleMapsApiKey:', googleMapsApiKey ? 'Presente' : 'Falta');
  console.log('MapaDistritosOperador - reportesPorDistrito:', reportesPorDistrito);

  // Usar el hook useJsApiLoader para mejor manejo del ciclo de vida
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
    libraries: ['places'],
  });

  // Si no hay API Key, mostrar error
  if (!googleMapsApiKey) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: isMobile ? '300px' : '400px',
        backgroundColor: '#fee2e2',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        color: '#b91c1c',
        fontFamily: "'Poppins', sans-serif",
        textAlign: 'center',
        padding: '1rem',
      }}>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>❌ Error: API Key no encontrada</p>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>Verifica que VITE_GOOGLE_MAPS_API_KEY esté configurada en .env.local</p>
        </div>
      </div>
    );
  }

  // Si hay error cargando el script
  if (loadError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: isMobile ? '300px' : '400px',
        backgroundColor: '#fee2e2',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        color: '#b91c1c',
        fontFamily: "'Poppins', sans-serif",
        textAlign: 'center',
        padding: '1rem',
      }}>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>⚠️ Error al cargar Google Maps</p>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>{loadError.message}</p>
        </div>
      </div>
    );
  }

  // Mientras se carga el script
  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: isMobile ? '300px' : '400px',
        backgroundColor: '#f5f5f5',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        color: '#999',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <BsHourglassBottom size={20} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} /> Cargando Google Maps...
      </div>
    );
  }

  // Función para normalizar nombres de distritos
  const normalizarNombreDistrito = (nombre: string): string => {
    if (!nombre) return 'SIN DISTRITO';
    return nombre.trim().toUpperCase().replace(/\s+/g, ' ');
  };

  const mapContainerStyle = {
    width: '100%',
    height: isMobile ? '300px' : '400px',
    borderRadius: '0.5rem',
  };

  const mapCenter = {
    lat: -12.0432,
    lng: -77.0289, // Lima, Perú
  };

  const mapOptions = {
    zoom: 12,
    mapTypeId: 'roadmap' as const,
    streetViewControl: false,
    fullscreenControl: true,
    draggable: true,
    scrollwheel: true,
    zoomControl: true,
    panControl: true,
  };

  // Colores según nivel de riesgo
  const getMarkerColor = (nivelRiesgo: string) => {
    switch (nivelRiesgo) {
      case 'alto':
        return '#c33'; // Rojo
      case 'medio':
        return '#ffd700'; // Amarillo
      case 'bajo':
        return '#2d7a47'; // Verde
      default:
        return '#999';
    }
  };

  // Traducir tipo de incidente
  const traducirTipo = (tipo: string): string => {
    const traducciones: Record<string, string> = {
      'acumulacion_residuos': 'Acumulación de Residuos',
      'quema_ilegal': 'Quema Ilegal',
      'Sin clasificar': 'Sin clasificar',
    };
    return traducciones[tipo] || tipo;
  };

  if (!reportesPorDistrito || reportesPorDistrito.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: isMobile ? '300px' : '400px',
        backgroundColor: '#f5f5f5',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        color: '#999',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <BsHourglassBottom size={20} style={{ marginRight: '0.5rem' }} /> Cargando mapa...
      </div>
    );
  }

  return (
    <GoogleMap 
      mapContainerStyle={mapContainerStyle} 
      center={mapCenter} 
      zoom={mapOptions.zoom} 
      options={mapOptions}
    >
      {reportesPorDistrito.map((distrito, idx) => {
        const nombreNormalizado = normalizarNombreDistrito(distrito.distrito);
        const coords = distrito.coordenadas && distrito.coordenadas.lat && distrito.coordenadas.lng 
          ? distrito.coordenadas 
          : mapCenter;
        
        console.log(`🗺️ MARCADOR ${idx + 1}: ${distrito.distrito}`);
        console.log(`   Nombre normalizado: ${nombreNormalizado}`);
        console.log(`   Coordenadas: ${coords.lat}, ${coords.lng}`);
        console.log(`   Origen: ${coords === distrito.coordenadas ? 'De DashboardOperador (centroide calculado)' : 'Centro Lima (fallback)'}`);
        
        const markerColor = getMarkerColor(distrito.nivelRiesgo);
        const isSelected = selectedDistrito === distrito;

        return (
          <Marker
            key={idx}
            position={coords}
            title={`${distrito.distrito} - ${distrito.total} reportes - ${distrito.nivelRiesgo.toUpperCase()}`}
            onClick={() => setSelectedDistrito(isSelected ? null : distrito)}
            options={{
              icon: {
                path: 'M0,-28a28,28 0 0,1 56,0c0,28 -28,60 -28,60s -28,-32 -28,-60z',
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: isSelected ? 3 : 2,
                scale: isSelected ? 0.85 : 0.7,
              },
            }}
          >
            {isSelected && (
              <InfoWindow onCloseClick={() => setSelectedDistrito(null)}>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  minWidth: '220px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.85rem',
                }}>
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedDistrito(null)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: '#f0f0f0',
                      border: 'none',
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#e0e0e0';
                      (e.target as HTMLButtonElement).style.color = '#333';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#f0f0f0';
                      (e.target as HTMLButtonElement).style.color = '#666';
                    }}
                    title="Cerrar"
                  >
                    ✕
                  </button>

                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#0d3a26',
                    paddingRight: '1.5rem',
                  }}>
                    {distrito.distrito}
                  </h4>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ margin: '0.25rem 0', fontWeight: '600', color: '#333' }}>
                      Total reportes: <span style={{ fontWeight: 'bold' }}>{distrito.total}</span>
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#666' }}>
                      Nivel: <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.3rem',
                        backgroundColor: getMarkerColor(distrito.nivelRiesgo),
                        color: '#fff',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                      }}>
                        {distrito.nivelRiesgo}
                      </span>
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', fontWeight: '600', color: '#333' }}>
                      Por tipo:
                    </p>
                    {Object.entries(distrito.tiposCount).map(([tipo, count]) => (
                      <p key={tipo} style={{ margin: '0.15rem 0', fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem' }}>
                        • {traducirTipo(tipo)}: {count}
                      </p>
                    ))}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        );
      })}
    </GoogleMap>
  );
}
