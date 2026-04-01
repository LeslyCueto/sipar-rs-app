import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CameraCapture } from './CameraCapture';
import { obtenerUsuarioActual } from '../utils/api';

interface ReportarTabProps {
  onReportEnviado?: () => void;
}

export function ReportarTab({ onReportEnviado }: ReportarTabProps) {
  const usuario = obtenerUsuarioActual();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      tipoIncidente: '',
      nivelRiesgo: '',
      comentario: '',
      anonimo: false,
    }
  });

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tipoIncidente = watch('tipoIncidente');
  const nivelRiesgo = watch('nivelRiesgo');
  const anonimo = watch('anonimo');

  const onSubmit = async (data: any) => {
    if (!photoBase64) {
      setErrorMsg('Debes capturar una fotografía');
      return;
    }

    setEnviando(true);
    setErrorMsg(null);

    try {
      // Parsear ubicación
      const ubicacionParts = usuario?.ubicacion?.split(', ') || [];
      const departamento = ubicacionParts[0] || '';
      const ciudad = ubicacionParts[1] || '';
      const distrito = ubicacionParts[2] || '';

      const reporteData = {
        usuario: {
          id: usuario?._id,
          nombre: anonimo ? 'Anónimo' : usuario?.nombre,
          email: anonimo ? 'anonimo@sirpar.pe' : usuario?.email,
        },
        anonimo,
        tipoIncidente: data.tipoIncidente === 'quema' ? 'quema_ilegal' : 'acumulacion_residuos',
        descripcion: data.comentario || '',
        imagen: {
          url: photoBase64, // Base64 guardado directamente
          fechaCaptura: new Date().toISOString(),
        },
        ubicacion: {
          departamento: departamento.toUpperCase(),
          provincia: ciudad.toUpperCase(),
          distrito: distrito.toUpperCase(),
          coordenadas: {
            lat: 0, // TODO: Implementar geolocalización
            lng: 0,
          },
          ubigeo: '', // TODO: Obtener del API ubigeos
        },
        nivelPercibido: data.nivelRiesgo,
        estado: 'pendiente',
        fechas: {
          creado: new Date().toISOString(),
        },
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(reporteData),
      });

      const result = await response.json();

      if (response.ok) {
        setEnviado(true);
        setPhotoBase64(null);
        setTimeout(() => {
          setEnviado(false);
          onReportEnviado?.();
        }, 3000);
      } else {
        setErrorMsg(result.message || 'Error al enviar el reporte');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setErrorMsg('Error al enviar el reporte. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#2d7a47',
        fontFamily: "'Poppins', sans-serif",
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        Nuevo Reporte
      </h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Cámara */}
        <div style={{ marginBottom: '2rem' }}>
          <CameraCapture onPhotoCaptured={setPhotoBase64} />
        </div>

        {/* Tipo de Incidente */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: '#333',
            fontFamily: "'Poppins', sans-serif",
          }}>
            Tipo de Incidente *
          </label>
          <div style={{
            display: 'flex',
            gap: '1rem',
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
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: '#333',
            fontFamily: "'Poppins', sans-serif",
          }}>
            Nivel de Riesgo Percibido *
          </label>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
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
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: nivelRiesgo === option.value ? option.color : '#f5f5f5',
                  color: nivelRiesgo === option.value ? '#fff' : '#333',
                  textAlign: 'center',
                  fontWeight: nivelRiesgo === option.value ? '600' : '400',
                  fontFamily: "'Poppins', sans-serif",
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
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: '#333',
            fontFamily: "'Poppins', sans-serif",
          }}>
            Comentario (Opcional)
          </label>
          <textarea
            {...register('comentario')}
            placeholder="Se visualizó una quema ilegal en la dirección..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #ddd',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.95rem',
              minHeight: '120px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
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
          disabled={enviando}
          style={{
            width: '100%',
            backgroundColor: '#2d7a47',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: enviando ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? '⏳ Enviando...' : '✓ Enviar Reporte'}
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
          <p style={{
            fontSize: '2rem',
            margin: '0 0 1rem 0',
          }}>
            ✓
          </p>
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
    </div>
  );
}
