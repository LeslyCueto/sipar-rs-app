import { useState } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';

export interface ZonaGeo {
  nombre: string;
  direccion: string;
  nivel: 'bajo' | 'medio' | 'alto';
  porcentaje: number;
  incidentes: number;
  lat: number;
  lng: number;
}

export interface ZonasNivelRiesgoProps {
  title?: string;
  zonas?: ZonaGeo[];
  googleMapsApiKey?: string;
}

export function ZonasNivelRiesgo({
  title = 'Identifica zonas por su nivel de Riesgo...',
  zonas = [
    {
      nombre: 'Av. Próceres con Av. Tusilagos',
      direccion: 'Intersección Av. Próceres de la Independencia con Av. Tusilagos',
      nivel: 'alto',
      porcentaje: 82,
      incidentes: 412,
      lat: -11.9407,
      lng: -76.9736
    },
    {
      nombre: 'Asentamiento Virgen de Fátima',
      direccion: 'Zona de laderas - Asentamiento Humano Virgen de Fátima',
      nivel: 'medio',
      porcentaje: 45,
      incidentes: 185,
      lat: -11.9350,
      lng: -76.9850
    },
    {
      nombre: 'Urbanización Zárate',
      direccion: 'Urbanización Zárate (Cerca al límite con la Vía de Evitamiento)',
      nivel: 'bajo',
      porcentaje: 18,
      incidentes: 54,
      lat: -11.9500,
      lng: -76.9650
    }
  ],
  googleMapsApiKey = 'AIzaSyDummy' // Reemplazar con clave real
}: ZonasNivelRiesgoProps) {
  const [infoWindowOpen, setInfoWindowOpen] = useState<number | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
    libraries: ['places']
  });
  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'bajo': return '#22c55e';
      case 'medio': return '#eab308';
      case 'alto': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getNivelLabel = (nivel: string) => {
    switch (nivel) {
      case 'bajo': return 'Riesgo Bajo';
      case 'medio': return 'Riesgo Medio';
      case 'alto': return 'Riesgo Alto';
      default: return 'Desconocido';
    }
  };

  const leyendas = [
    { nivel: 'bajo', label: 'Riesgo Bajo', descripcion: 'Zonas sin incidentes recientes.' },
    { nivel: 'medio', label: 'Riesgo Medio', descripcion: 'Reportes moderados registrados.' },
    { nivel: 'alto', label: 'Riesgo Alto', descripcion: 'Alta concentración de incidentes detectados.' }
  ];

  // Centro del mapa: San Juan de Lurigancho
  const mapCenter = { lat: -11.9400, lng: -76.9750 };
  const mapOptions = {
    zoom: 14,
    mapTypeId: 'roadmap' as const,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'water',
        stylers: [{ color: '#c5e8ff' }]
      }
    ]
  };

  if (loadError) {
    return (
      <section style={{
        padding: 'clamp(2rem, 5vw, 4rem) 2rem',
        backgroundColor: '#f9fafb',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        textAlign: 'center'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          marginBottom: '2rem',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif",
          color: '#1a1a1a'
        }}>
          {title}
        </h2>
        <p style={{ color: '#ef4444', fontFamily: "'Poppins', sans-serif" }}>
          Error al cargar el mapa. Por favor, verifica tu API key de Google Maps.
        </p>
      </section>
    );
  }

  if (!isLoaded) {
    return (
      <section style={{
        padding: 'clamp(2rem, 5vw, 4rem) 2rem',
        backgroundColor: '#f9fafb',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        textAlign: 'center'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
          marginBottom: '2rem',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif",
          color: '#1a1a1a'
        }}>
          {title}
        </h2>
        <p style={{ color: '#6b7280', fontFamily: "'Poppins', sans-serif" }}>
          Cargando mapa...
        </p>
      </section>
    );
  }

  return (
    <section style={{
      padding: 'clamp(2rem, 5vw, 4rem) 2rem',
      backgroundColor: '#f9fafb',
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      position: 'relative'
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

      {/* Mapa Google Maps */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto clamp(2rem, 5vw, 3rem)',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        height: 'clamp(400px, 50vw, 550px)',
        position: 'relative'
      }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={14}
          options={mapOptions}
        >
          {zonas.map((zona, idx) => (
            <div key={idx}>
              <MarkerF
                position={{ lat: zona.lat, lng: zona.lng }}
                onClick={() => setInfoWindowOpen(idx)}
                icon={{
                  path: 'M 0,-28 C -7.72,-28 -15.44,-24.86 -15.44,-17.5 C -15.44,-10.5 0,28 0,28 C 0,28 15.44,-10.5 15.44,-17.5 C 15.44,-24.86 7.72,-28 0,-28 Z',
                  fillColor: getNivelColor(zona.nivel),
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 1.2
                }}
              />
              {infoWindowOpen === idx && (
                <InfoWindowF
                  position={{ lat: zona.lat, lng: zona.lng }}
                  onCloseClick={() => setInfoWindowOpen(null)}
                >
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    minWidth: '250px',
                    fontFamily: "'Poppins', sans-serif",
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: getNivelColor(zona.nivel),
                        boxShadow: `0 2px 6px ${getNivelColor(zona.nivel)}40`
                      }} />
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1a1a1a'
                      }}>
                        {zona.nombre}
                      </h4>
                    </div>
                    <p style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.85rem',
                      color: '#6b7280'
                    }}>
                      {zona.direccion}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      backgroundColor: '#f9fafb',
                      padding: '0.75rem',
                      borderRadius: '0.5rem'
                    }}>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>
                          Riesgo
                        </p>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: getNivelColor(zona.nivel) }}>
                          {zona.porcentaje}%
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>
                          Incidentes
                        </p>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#484C52' }}>
                          {zona.incidentes}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: getNivelColor(zona.nivel),
                      color: '#ffffff',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {getNivelLabel(zona.nivel)}
                    </div>
                  </div>
                </InfoWindowF>
              )}
            </div>
          ))}
        </GoogleMap>
      </div>

      {/* Instrucciones */}
      <p style={{
        textAlign: 'center',
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        color: '#6b7280',
        marginBottom: 'clamp(2rem, 5vw, 3rem)',
        fontFamily: "'Poppins', sans-serif"
      }}>
        📍 Haz clic en los marcadores para ver los detalles de cada zona
      </p>

      {/* Leyenda */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'clamp(1.5rem, 4vw, 2rem)'
      }}>
        {leyendas.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              backgroundColor: '#ffffff',
              padding: 'clamp(1.25rem, 3vw, 1.75rem)',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: `2px solid ${getNivelColor(item.nivel)}`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: getNivelColor(item.nivel),
              flexShrink: 0,
              marginTop: '2px',
              boxShadow: `0 2px 6px ${getNivelColor(item.nivel)}40`
            }} />
            <div>
              <h3 style={{
                margin: 0,
                fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                color: '#1a1a1a',
                marginBottom: '0.25rem'
              }}>
                {item.label}
              </h3>
              <p style={{
                margin: 0,
                fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
                color: '#6b7280',
                fontFamily: "'Poppins', sans-serif"
              }}>
                {item.descripcion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
