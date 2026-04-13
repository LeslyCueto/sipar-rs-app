import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { BsUpload, BsArrowRepeat, BsCheck, BsExclamationTriangle, BsCamera, BsGeoAlt } from 'react-icons/bs';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { CameraCapture } from './CameraCapture';
import { obtenerUsuarioActual } from '../utils/api';

interface ReportarTabProps {
  onReportEnviado?: () => void;
}

// ⭐ IMPORTANTE: Sacar libraries como constante para evitar que LoadScript se recargue
const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

// Función para comprimir imágenes
const comprimirImagen = (
  base64: string,
  maxWidth: number = 640,
  maxHeight: number = 640,
  quality: number = 0.6
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Reducir tamaño si es necesario
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64);
      }
    };
  });
};

export function ReportarTab({ onReportEnviado }: ReportarTabProps) {
  const usuario = obtenerUsuarioActual();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  // Cargar Google Maps API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const autocompleteRef = useRef<any>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      tipoIncidente: '',
      nivelRiesgo: '',
      comentario: '',
      anonimo: false,
    }
  });

  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [tipoImagen, setTipoImagen] = useState<'capturada' | 'cargada' | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [datosParaEnviar, setDatosParaEnviar] = useState<any>(null);
  const [direccion, setDireccion] = useState<string>('');
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [coordenadas, setCoord] = useState({ lat: 0, lng: 0 });
  const [ubicacionData, setUbicacionData] = useState({ departamento: '', provincia: '', distrito: '' });
  const [usarNominatim, setUsarNominatim] = useState(false);
  const [sugerenciasNominatim, setSugerenciasNominatim] = useState<any[]>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodingRetriesRef = useRef<number>(0);

  const tipoIncidente = watch('tipoIncidente');
  const nivelRiesgo = watch('nivelRiesgo');

  // Obtener ubicación actual al montar el componente
  useEffect(() => {
    obtenerUbicacionActual();
    
    // Limpiar debounce timer al desmontar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Función para obtener ubicación actual
  const obtenerUbicacionActual = async () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocalización no soportada en tu navegador');
      return;
    }

    setCargandoUbicacion(true);
    geocodingRetriesRef.current = 0; // Resetear contador de reintentos
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Ubicación obtenida:', { latitude, longitude });
        setCoord({ lat: latitude, lng: longitude });

        // Intentar obtener dirección desde el backend
        await obtenerDireccionDeCoordenadas(latitude, longitude);
      },
      (error) => {
        console.warn('❌ Error de geolocalización:', error.message);
        setCargandoUbicacion(false);
        if (error.code === 1) {
          setErrorMsg('Permiso de geolocalización denegado. Habilítalo en configuración del navegador.');
        } else if (error.code === 2) {
          setErrorMsg('No se pudo determinar tu ubicación. Intenta más tarde.');
        } else {
          setErrorMsg('Error al obtener la ubicación.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Función auxiliar para obtener dirección desde coordenadas
  const obtenerDireccionDeCoordenadas = async (latitude: number, longitude: number) => {
    try {
      const respuesta = await fetch(
        `http://localhost:5000/api/locations/reverse?lat=${latitude}&lon=${longitude}`
      );
      
      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }
      
      const datos = await respuesta.json();
      console.log('📍 Respuesta del servidor:', datos);
      
      if (datos && datos.display_name) {
        // Usar display_name directo (es la mejor opción de Nominatim)
        let direccionCompleta = datos.display_name;
        
        // Si es muy larga, tomar solo los primeros segmentos útiles
        const partes = direccionCompleta.split(',').slice(0, 4).map((p: string) => p.trim());
        direccionCompleta = partes.join(', ');
        
        setDireccion(direccionCompleta);
        
        // Extraer información de ubicación de address_components
        const address = datos.address || {};
        const dept = address.state || address.province || 'LIMA';
        const prov = address.city || address.town || 'LIMA';
        const dist = address.suburb || address.district || address.neighbourhood || 'VARIOS';
        
        setUbicacionData({
          departamento: dept.toUpperCase(),
          provincia: prov.toUpperCase(),
          distrito: dist.toUpperCase(),
        });

        console.log('✅ Dirección obtenida:', { direccionCompleta, departamento: dept, provincia: prov, distrito: dist });
      } else {
        throw new Error('Sin dirección disponible');
      }
    } catch (err) {
      console.warn('⚠️ Error al obtener dirección:', err instanceof Error ? err.message : String(err));
      // Fallback a coordenadas si falla la geocodificación
      setDireccion(`Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setErrorMsg('No se pudo obtener la dirección exacta. Se mostrará como coordenadas.');
    } finally {
      setCargandoUbicacion(false);
    }
  };

  // Función para manejar la selección del Autocomplete de Google Places
  const handlePlaceChanged = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formattedAddress = place.formatted_address || '';

    setDireccion(formattedAddress);
    setCoord({ lat, lng });

    // Extraer información de ubicación desde los componentes de dirección
    const addressComponents = place.address_components || [];
    let dept = 'LIMA';
    let prov = 'LIMA';
    let dist = 'VARIOS';

    addressComponents.forEach((component: any) => {
      const types = component.types || [];
      if (types.includes('administrative_area_level_1')) {
        dept = component.long_name;
      }
      if (types.includes('locality')) {
        prov = component.long_name;
      }
      if (types.includes('administrative_area_level_2')) {
        dist = component.long_name;
      }
    });

    setUbicacionData({
      departamento: dept.toUpperCase(),
      provincia: prov.toUpperCase(),
      distrito: dist.toUpperCase(),
    });

    console.log('✅ Lugar seleccionado:', {
      direccion: formattedAddress,
      coordenadas: { lat, lng },
      ubicacion: { departamento: dept, provincia: prov, distrito: dist },
    });
  };

  // Función para obtener sugerencias de Nominatim (fallback) - con proxy backend
  const obtenerSugerenciasNominatim = async (busqueda: string, intentoActual: number = 0) => {
    if (!busqueda.trim() || busqueda.length < 3) {
      setSugerenciasNominatim([]);
      return;
    }

    // Si ya hemos reintentado el máximo, cancelar
    if (intentoActual > 0) {
      console.warn(`⚠️ Reintentos agotados para "${busqueda}"`);
      setCargandoSugerencias(false);
      return;
    }

    setCargandoSugerencias(true);
    try {
      // Usar el proxy del backend en lugar de llamar directamente a Nominatim
      const response = await fetch(
        `http://localhost:5000/api/locations/search?q=${encodeURIComponent(busqueda)}&countrycodes=pe&limit=5`
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`⚠️ Rate limit alcanzado para "${busqueda}"`);
          // NO reintentar - el usuario debe esperar o escribir diferente
          setSugerenciasNominatim([]);
          setCargandoSugerencias(false);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const datos = await response.json();
      console.log(`✅ ${datos.length} sugerencias obtenidas para "${busqueda}"`);
      setSugerenciasNominatim(datos);
    } catch (error) {
      console.error(`❌ Error al obtener sugerencias para "${busqueda}":`, error);
      setSugerenciasNominatim([]);
    } finally {
      setCargandoSugerencias(false);
    }
  };

  // Función wrapper con debounce
  const handleDireccionChange = (valor: string) => {
    setDireccion(valor);
    
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Si el valor es muy corto, no buscar
    if (valor.trim().length < 3) {
      setSugerenciasNominatim([]);
      return;
    }
    
    // Ejecutar búsqueda después de 500ms sin escribir
    debounceTimerRef.current = setTimeout(() => {
      obtenerSugerenciasNominatim(valor, 0);
    }, 500);
  };

  // Función para manejar la selección de una sugerencia de Nominatim
  const handleSeleccionarNominatim = (lugar: any) => {
    const direccionCompleta = lugar.display_name || '';
    const lat = parseFloat(lugar.lat);
    const lng = parseFloat(lugar.lon);

    setDireccion(direccionCompleta);
    setCoord({ lat, lng });
    setSugerenciasNominatim([]);

    // Extraer ubicación
    const address = lugar.address || {};
    const dept = address.state || 'LIMA';
    const prov = address.city || address.county || 'LIMA';
    const dist = address.municipality || address.town || address.village || 'VARIOS';

    setUbicacionData({
      departamento: dept.toUpperCase(),
      provincia: prov.toUpperCase(),
      distrito: dist.toUpperCase(),
    });

    console.log('✅ Lugar seleccionado (Nominatim):', {
      direccion: direccionCompleta,
      coordenadas: { lat, lng },
      ubicacion: { departamento: dept, provincia: prov, distrito: dist },
    });
  };

  // Detectar si Google Maps falló y mostrar fallback
  useEffect(() => {
    if (!isLoaded && googleMapsApiKey) {
      console.warn('⚠️ Google Maps no disponible. Usando Nominatim como fallback.');
      setUsarNominatim(true);
    }
  }, [isLoaded, googleMapsApiKey]);

  // Capurar foto de cámara
  const handleFotoCamara = (photoBase64: string) => {
    setImagenBase64(photoBase64);
    setTipoImagen('capturada');
    setMostrarCamara(false);
  };

  // Cargar imagen desde archivo
  const handleCargarImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar tipo de archivo
    if (!archivo.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máx 10MB)
    if (archivo.size > 10 * 1024 * 1024) {
      setErrorMsg('La imagen no debe pesar más de 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        // Comprimir la imagen
        const imagenComprimida = await comprimirImagen(base64);
        setImagenBase64(imagenComprimida);
        setTipoImagen('cargada');
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg('Error al procesar la imagen');
        console.error('Error al comprimir:', err);
      }
    };
    reader.readAsDataURL(archivo);
  };

  // Tomar nueva imagen (reiniciar cámara)
  const handleTomarNuevaImagen = () => {
    setImagenBase64(null);
    setTipoImagen(null);
    setMostrarCamara(false); // Esperar a que el usuario presione "Activar Cámara"
  };

  const onSubmit = async (data: any) => {
    if (!imagenBase64) {
      setErrorMsg('Debes capturar o cargar una fotografía');
      return;
    }

    if (!direccion || !direccion.trim()) {
      setErrorMsg('La dirección no se ha capturado. Intenta de nuevo.');
      return;
    }

    if (coordenadas.lat === 0 && coordenadas.lng === 0) {
      setErrorMsg('Las coordenadas no se han capturado. Selecciona una dirección del autocomplete o usa "Usar mi ubicación".');
      return;
    }

    // Usar información de ubicación extraída del Autocomplete o de ubicación actual
    const departamento = ubicacionData.departamento || usuario?.ubicacion?.split(', ')[0] || 'LIMA';
    const provincia = ubicacionData.provincia || usuario?.ubicacion?.split(', ')[1] || 'LIMA';
    const distrito = ubicacionData.distrito || usuario?.ubicacion?.split(', ')[2] || 'VARIOS';

    const reporteData = {
      usuario: {
        id: usuario?.id,
        nombre: usuario?.nombre,
        email: usuario?.email,
      },
      anonimo: data.anonimo,
      tipoIncidente: data.tipoIncidente === 'quema' ? 'quema_ilegal' : 'acumulacion_residuos',
      descripcion: data.comentario || '',
      imagenes: [
        {
          url: imagenBase64,
          nombre: `imagen-reporte-${Date.now()}.jpg`,
          tipo: tipoImagen || 'capturada',
          fecha: new Date().toISOString(),
        }
      ],
      ubicacion: {
        departamento: departamento.toUpperCase(),
        provincia: provincia.toUpperCase(),
        distrito: distrito.toUpperCase(),
        ubigeo: '',
        direccion: direccion.trim(),
        coordenadas: {
          lat: coordenadas.lat,
          lng: coordenadas.lng,
        },
      },
      nivelPercibido: data.nivelRiesgo,
      nivelFinal: null,
      estado: 'pendiente',
      fechas: {
        creado: new Date().toISOString(),
        resuelto: null,
      },
    };

    console.log('✅ DATOS A ENVIAR - Dirección:', {
      direccionCapturada: direccion,
      coordenadas: coordenadas,
      ubicacionCompleta: reporteData.ubicacion,
    });

    // Guardar datos y mostrar popup de confirmación
    setDatosParaEnviar(reporteData);
    setMostrarConfirmacion(true);
  };

  // Enviar reporte confirmado
  const handleEnviarConfirmado = async () => {
    setMostrarConfirmacion(false);
    setEnviando(true);
    setErrorMsg(null);

    try {
      console.log('📤 ENVIANDO REPORTE FINAL:', {
        direccion: datosParaEnviar?.ubicacion?.direccion,
        ubicacionCompleta: datosParaEnviar?.ubicacion,
        datosCompletos: datosParaEnviar,
      });

      // 🔍 ENVIAR TAMBIÉN A ENDPOINT DE DEBUG
      console.log('🔍 Enviando copia a endpoint de debug...');
      try {
        await fetch('http://localhost:5000/api/debug/recibir-datos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosParaEnviar),
        });
        console.log('✅ Copia guardada en debug');
      } catch (debugErr) {
        console.warn('⚠️ Debug error (no critical):', debugErr);
      }

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosParaEnviar),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = { message: 'Error parsing server response' };
      }

      console.log('📥 RESPUESTA DEL SERVIDOR:', { status: response.status, ...result });

      if (response.ok) {
        console.log('✅ Reporte enviado exitosamente');
        setEnviado(true);
        setImagenBase64(null);
        setTipoImagen(null);
        setDatosParaEnviar(null);
        setTimeout(() => {
          setEnviado(false);
          onReportEnviado?.();
        }, 3000);
      } else {
        const mensajeError = result.message || result.error || result.detalles || 'Error al enviar el reporte';
        console.error('❌ Error del servidor:', mensajeError);
        setErrorMsg(`Error (${response.status}): ${mensajeError}`);
      }
    } catch (err: any) {
      console.error('❌ Error en la solicitud:', err.message);
      setErrorMsg(`Error: ${err.message || 'Error al enviar el reporte'}. Intenta nuevamente.`);
    } finally {
      setEnviando(false);
    }
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
        textAlign: 'center',
      }}>
        Nuevo Reporte
      </h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Sección de Fotografía */}
        <div style={{ marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
          {!imagenBase64 && !mostrarCamara && (
            <div style={{
              backgroundColor: 'rgb(26, 26, 26)',
              borderRadius: '0.75rem',
              padding: 'clamp(1.2rem, 3vw, 1.5rem)',
              marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', color: '#fff' }}>
                <BsCamera size={50} />
              </div>
              <p style={{
                color: 'rgb(204, 204, 204)',
                fontFamily: "'Poppins', sans-serif",
                marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              }}>
                TOMAR FOTOGRAFÍA
              </p>
              <div style={{
                display: 'flex',
                gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                <button
                  type="button"
                  onClick={() => setMostrarCamara(true)}
                  style={{
                    backgroundColor: 'rgb(45, 122, 71)',
                    color: 'rgb(255, 255, 255)',
                    border: 'none',
                    padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: '600',
                    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                    flex: '1',
                    minWidth: '120px',
                  }}
                >
                  Activar Cámara
                </button>
                <label style={{
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  flex: '1',
                  minWidth: '120px',
                  justifyContent: 'center',
                }}>
                  <span style={{ marginRight: '0.3rem', display: 'inline-block', verticalAlign: 'middle' }}>
                    <BsUpload size={16} />
                  </span>
                  Cargar Imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCargarImagen}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Mostrar CameraCapture si está activada */}
          {mostrarCamara && !imagenBase64 && (
            <div style={{ marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
              <CameraCapture onPhotoCaptured={handleFotoCamara} />
              <button
                type="button"
                onClick={() => setMostrarCamara(false)}
                style={{
                  width: '100%',
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: 'clamp(0.6rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '600',
                  marginTop: 'clamp(0.5rem, 2vw, 0.75rem)',
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                }}
              >
                Cancelar Cámara
              </button>
            </div>
          )}

          {/* Vista previa de imagen cargada */}
          {imagenBase64 && tipoImagen === 'cargada' && (
            <div style={{
              backgroundColor: 'rgb(26, 26, 26)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{
                color: 'rgb(204, 204, 204)',
                fontFamily: "'Poppins', sans-serif",
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                Imagen Cargada
              </p>
              <img
                src={imagenBase64}
                alt="Vista previa"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                }}
              />
              <button
                type="button"
                onClick={handleTomarNuevaImagen}
                style={{
                  width: '100%',
                  backgroundColor: 'rgb(45, 122, 71)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '600',
                }}
              >
                Tomar una Nueva Imagen
              </button>
            </div>
          )}

          {/* Vista previa de imagen capturada */}
          {imagenBase64 && tipoImagen === 'capturada' && (
            <div style={{
              backgroundColor: 'rgb(26, 26, 26)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{
                color: 'rgb(204, 204, 204)',
                fontFamily: "'Poppins', sans-serif",
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                Fotografía Capturada
              </p>
              <img
                src={imagenBase64}
                alt="Vista previa"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                }}
              />
              <button
                type="button"
                onClick={handleTomarNuevaImagen}
                style={{
                  width: '100%',
                  backgroundColor: 'rgb(45, 122, 71)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '600',
                }}
              >
                Tomar una Nueva Imagen
              </button>
            </div>
          )}
        </div>

        {/* Tipo de Incidente */}
        <div style={{ marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            color: '#333',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(0.95rem, 2vw, 1rem)',
          }}>
            Tipo de Incidente *
          </label>
          <div style={{
            display: 'flex',
            gap: 'clamp(0.75rem, 2vw, 1rem)',
            flexWrap: 'wrap',
          }}>
            {[
              { value: 'quema', label: 'Quema de residuos' },
              { value: 'acumulacion', label: 'Acumulación de residuos' },
            ].map(option => (
              <label key={option.value} style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.75rem',
                border: tipoIncidente === option.value ? '2px solid #2d7a47' : '2px solid #ddd',
                borderRadius: '0.5rem',
                backgroundColor: tipoIncidente === option.value ? '#e8f5e9' : '#fff',
              }}>
                <input
                  type="radio"
                  value={option.value}
                  {...register('tipoIncidente', { required: 'Selecciona un tipo de incidente' })}
                />
                <span style={{ fontFamily: "'Poppins', sans-serif" }}>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.tipoIncidente && <p style={{ color: '#c33', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {errors.tipoIncidente.message}
          </p>}
        </div>

        {/* Nivel de Riesgo */}
        <div style={{ marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            color: '#333',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(0.95rem, 2vw, 1rem)',
          }}>
            Nivel de Riesgo Percibido *
          </label>
          <div style={{
            display: 'flex',
            gap: 'clamp(0.5rem, 2vw, 0.75rem)',
            justifyContent: 'space-between',
          }}>
            {[
              { value: 'alto', label: 'Alto', color: '#d32f2f' },
              { value: 'medio', label: 'Medio', color: '#f57c00' },
              { value: 'bajo', label: 'Bajo', color: '#388e3c' },
            ].map(option => (
              <label key={option.value} style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
              }}>
                <input
                  type="radio"
                  value={option.value}
                  {...register('nivelRiesgo', { required: 'Selecciona un nivel de riesgo' })}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '100%',
                  padding: 'clamp(0.6rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  backgroundColor: nivelRiesgo === option.value ? option.color : '#f5f5f5',
                  color: nivelRiesgo === option.value ? '#fff' : '#333',
                  textAlign: 'center',
                  fontWeight: nivelRiesgo === option.value ? '600' : '400',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                }}>
                  {option.label}
                </div>
              </label>
            ))}
          </div>
          {errors.nivelRiesgo && <p style={{ color: '#c33', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {errors.nivelRiesgo.message}
          </p>}
        </div>

        {/* Comentario */}
        <div style={{ marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            color: '#333',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(0.95rem, 2vw, 1rem)',
          }}>
            Comentario (Opcional)
          </label>
          <textarea
            {...register('comentario')}
            placeholder="Se visualizó una quema ilegal en la dirección..."
            style={{
              width: '100%',
              padding: 'clamp(0.6rem, 2vw, 0.75rem)',
              borderRadius: '0.5rem',
              border: '1px solid #ddd',
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
              minHeight: '120px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Dirección */}
        <div style={{ marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              color: '#333',
              fontFamily: "'Poppins', sans-serif",
            }}>
              <BsGeoAlt size={18} /> Dirección
            </label>
            <button
              type="button"
              onClick={obtenerUbicacionActual}
              disabled={cargandoUbicacion}
              style={{
                backgroundColor: '#2d7a47',
                color: '#fff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.3rem',
                cursor: cargandoUbicacion ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontFamily: "'Poppins', sans-serif",
                opacity: cargandoUbicacion ? 0.6 : 1,
              }}
            >
              {cargandoUbicacion ? 'Ubicando...' : 'Usar mi ubicación'}
            </button>
          </div>

          {/* Google Places Autocomplete o Fallback Nominatim */}
          {!usarNominatim && isLoaded ? (
            <Autocomplete
              onLoad={onLoad => (autocompleteRef.current = onLoad)}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: 'pe' },
                types: ['address'],
              }}
            >
              <input
                type="text"
                placeholder="Ej: Av. Los Jazmines 398, Independencia, Lima"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(0.6rem, 2vw, 0.75rem)',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#2d7a47';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#ddd';
                }}
              />
            </Autocomplete>
          ) : usarNominatim ? (
            // Fallback a Nominatim
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Ej: Av. Los Jazmines 398, Independencia, Lima"
                value={direccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(0.6rem, 2vw, 0.75rem)',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#2d7a47';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#ddd';
                  // Ocultar sugerencias después de un pequeño delay
                  setTimeout(() => setSugerenciasNominatim([]), 200);
                }}
              />
              {cargandoSugerencias && (
                <p style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}>
                  Buscando direcciones...
                </p>
              )}
              {sugerenciasNominatim.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderTop: 'none',
                  borderRadius: '0 0 0.5rem 0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                  {sugerenciasNominatim.map((lugar, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeleccionarNominatim(lugar)}
                      style={{
                        padding: '0.75rem',
                        borderBottom: idx < sugerenciasNominatim.length - 1 ? '1px solid #eee' : 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'background-color 0.2s',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      {lugar.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              fontFamily: "'Poppins', sans-serif",
              backgroundColor: '#f9f9f9',
              color: '#999',
            }}>
              Cargando Google Places...
            </div>
          )}

          {cargandoUbicacion && (
            <p style={{
              fontSize: '0.85rem',
              color: '#2d7a47',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{animation: 'spin 1s linear infinite', display: 'inline-block'}}>
                <BsArrowRepeat size={14} />
              </span>
              Obteniendo ubicación...
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </p>
          )}
        </div>

        {/* Anónimo */}
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <input
            type="checkbox"
            {...register('anonimo')}
            style={{ cursor: 'pointer' }}
          />
          <label style={{
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            color: '#666',
          }}>
            Enviar como reporte anónimo
          </label>
        </div>

        {/* Errores */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #c33',
            color: '#c33',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontFamily: "'Poppins', sans-serif",
          }}>
            {errorMsg}
          </div>
        )}

        {/* Botón Enviar */}
        <button
          type="submit"
          disabled={enviando || cargandoUbicacion || !direccion}
          style={{
            width: '100%',
            backgroundColor: (enviando || cargandoUbicacion || !direccion) ? '#999' : '#2d7a47',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: (enviando || cargandoUbicacion || !direccion) ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
            opacity: (enviando || cargandoUbicacion || !direccion) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
          title={!direccion ? 'Esperando ubicación...' : ''}
        >
          {enviando ? (
            <>
              <span style={{animation: 'spin 1s linear infinite', display: 'inline-block'}}>
                <BsArrowRepeat size={18} />
              </span>
              {' '}Enviando...
            </>
          ) : cargandoUbicacion ? (
            <>
              <span style={{animation: 'spin 1s linear infinite', display: 'inline-block'}}>
                <BsArrowRepeat size={18} />
              </span>
              {' '}Validando ubicación...
            </>
          ) : (
            <>
              <BsCheck size={18} /> Enviar Reporte
            </>
          )}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </button>
      </form>

      {/* Confirmación */}
      {enviado && (
        <div style={{
          marginTop: '2rem',
          backgroundColor: '#e8f5e9',
          border: '2px solid #2d7a47',
          padding: '2rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2rem',
            margin: '0 0 1rem 0',
            color: '#2d7a47',
          }}>
            <BsCheck size={48} />
          </div>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: '600',
            color: '#2d7a47',
            fontSize: '1.1rem',
            margin: '0.5rem 0',
          }}>
            ¡Reporte enviado correctamente!
          </p>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            color: '#666',
            fontSize: '0.9rem',
          }}>
            Nuestro equipo revisará tu reporte pronto.
          </p>
        </div>
      )}

      {/* Pop-up de Confirmación */}
      {mostrarConfirmacion && datosParaEnviar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              fontFamily: "'Poppins', sans-serif",
              color: '#ff9800',
            }}>
              <BsExclamationTriangle size={40} />
            </div>
            <h3 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.1rem',
              color: '#333',
              marginBottom: '1rem',
            }}>
              ¿Estás seguro?
            </h3>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              color: '#666',
              fontSize: '0.95rem',
              marginBottom: '2rem',
              lineHeight: '1.5',
            }}>
              Los datos ya no podrán editarse una vez enviado el reporte.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
            }}>
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                style={{
                  backgroundColor: '#ddd',
                  color: '#333',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleEnviarConfirmado}
                style={{
                  backgroundColor: '#2d7a47',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
