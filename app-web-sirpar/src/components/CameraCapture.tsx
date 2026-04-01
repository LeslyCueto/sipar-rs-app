import { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onPhotoCaptured: (photoBase64: string) => void;
}

export function CameraCapture({ onPhotoCaptured }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const iniciarCamara = async () => {
    setCargando(true);
    setCameraError(null);
    
    try {
      // Intentar con cámara trasera primero
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 }
        },
        audio: false,
      };

      let mediaStream: MediaStream | null = null;

      // Usar timeout para evitar que se quede esperando indefinidamente
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al acceder a la cámara')), 10000)
      );

      try {
        mediaStream = await Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          timeoutPromise,
        ]);
      } catch (err: any) {
        // Si falla con constraints específicos, intentar con configuración mínima
        console.log('Reintentando con configuración simplificada...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!mediaStream) {
        throw new Error('No se pudo obtener el stream de la cámara');
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Error al reproducir video:', err);
          });
        };
        
        setIsCameraActive(true);
        setPhotoTaken(null);
        setCameraError(null);
      }
    } catch (err: any) {
      console.error('❌ Error al acceder a la cámara:', err.message);
      
      // Darle mensajes más específicos según el error
      if (err.name === 'NotAllowedError') {
        setCameraError('Permiso denegado. Por favor permite el acceso a la cámara en la configuración del navegador.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No se encontró ninguna cámara disponible en el dispositivo.');
      } else if (err.message?.includes('Timeout')) {
        setCameraError('La cámara tardó demasiado en iniciar. Intenta de nuevo.');
      } else {
        setCameraError(`Error: ${err.message || 'No se pudo acceder a la cámara'}`);
      }
      setIsCameraActive(false);
    } finally {
      setCargando(false);
    }
  };

  const tomarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.videoWidth && video.videoHeight) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoTaken(photoBase64);
        onPhotoCaptured(photoBase64);

        // Detener la cámara inmediatamente
        detenerCamara();
      }
    }
  };

  const detenerCamara = () => {
    if (stream) {
      // Detener todos los tracks de audio y video
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    // Limpiar el video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  };

  const reintentar = () => {
    detenerCamara();
    setPhotoTaken(null);
    iniciarCamara();
  };

  // Limpiar la cámara cuando se desmonta el componente
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando cámara...');
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log(`Deteniendo track: ${track.kind}`);
          track.stop();
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      {!isCameraActive && !photoTaken && !cargando && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}>
            📷
          </div>
          <p style={{
            color: '#ccc',
            fontFamily: "'Poppins', sans-serif",
            marginBottom: '1rem',
          }}>
            TOMAR FOTOGRAFÍA
          </p>
          <button
            onClick={iniciarCamara}
            disabled={cargando}
            style={{
              backgroundColor: '#2d7a47',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: '600',
              opacity: cargando ? 0.6 : 1,
            }}
          >
            {cargando ? '⏳ Iniciando cámara...' : 'Activar Cámara'}
          </button>
          
          {cameraError && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#ffebee',
              border: '1px solid #c33',
              borderRadius: '0.5rem',
              color: '#c33',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              lineHeight: '1.5',
            }}>
              ⚠️ {cameraError}
            </div>
          )}
        </div>
      )}

      {cargando && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            animation: 'spin 1s linear infinite',
          }}>
            ⏳
          </div>
          <p style={{
            color: '#ccc',
            fontFamily: "'Poppins', sans-serif",
          }}>
            Iniciando cámara...
          </p>
          <p style={{
            color: '#999',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.9rem',
            marginTop: '0.5rem',
          }}>
            Por favor espera mientras accedemos a tu cámara
          </p>
        </div>
      )}

      {isCameraActive && !photoTaken && (
        <div style={{ position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '0.5rem',
              backgroundColor: '#000',
              display: 'block',
              maxHeight: '400px',
              objectFit: 'contain',
            }}
          />
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={tomarFoto}
              style={{
                backgroundColor: '#2d7a47',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '600',
                flex: '1',
                minWidth: '120px',
              }}
            >
              ✓ Capturar
            </button>
            <button
              onClick={detenerCamara}
              style={{
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '600',
                flex: '1',
                minWidth: '120px',
              }}
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {photoTaken && (
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src={photoTaken}
            alt="Foto capturada"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '0.5rem',
              display: 'block',
              maxHeight: '400px',
              objectFit: 'contain',
            }}
          />
          <p style={{
            color: '#2d7a47',
            textAlign: 'center',
            fontFamily: "'Poppins', sans-serif",
            marginTop: '0.5rem',
            fontWeight: '600',
          }}>
            ✓ Foto capturada correctamente
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={reintentar}
              style={{
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '600',
                flex: '1',
                minWidth: '120px',
              }}
            >
              🔄 Reintentar
            </button>
            <button
              disabled
              style={{
                backgroundColor: '#2d7a47',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'default',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '600',
                flex: '1',
                minWidth: '120px',
                opacity: 0.6,
              }}
            >
              ✓ Cargado
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}
