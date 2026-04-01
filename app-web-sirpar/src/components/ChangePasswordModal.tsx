import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ChangePasswordModalProps {
  onClose: () => void;
  email?: string;
}

export function ChangePasswordModal({ onClose, email }: ChangePasswordModalProps) {
  const [step, setStep] = useState<'inicial' | 'codigo' | 'exitoso'>('inicial');
  const [enviando, setEnviando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState(3);

  // Verificar que hay email y token antes de hacer nada
  if (!email) {
    return (
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
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
        }}>
          <p style={{ color: '#c33', fontFamily: "'Poppins', sans-serif" }}>Error: Email no disponible</p>
          <button onClick={onClose} style={{
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
            marginTop: '1rem',
          }}>Cerrar</button>
        </div>
      </div>
    );
  }

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      codigo: '',
      nuevaPassword: '',
      confirmarPassword: '',
    }
  });

  const nuevaPassword = watch('nuevaPassword');

  const enviarCodigo = async () => {
    // Verificar que hay token
    const token = localStorage.getItem('token');
    if (!token) {
      setMensajeError('Sesión expirada. Por favor cierra sesión y vuelve a ingresar.');
      return;
    }

    setEnviando(true);
    setMensajeError(null);

    try {
      console.log('Enviando código para:', email);
      const response = await fetch('/api/auth/enviar-codigo-recuperacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      console.log('Respuesta status:', response.status);

      // Intentar parsear el JSON con mejor manejo de errores
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON:', text);
        throw new Error('Error del servidor: respuesta inválida');
      }

      console.log('Resultado:', result);

      if (response.ok) {
        setCodigoEnviado(true);
        setStep('codigo');
        setMensajeError(null);
        // Mostrar código en desarrollo
        if (result.debug) {
          console.log('🔐 Código de verificación:', result.debug);
        }
      } else {
        setMensajeError(result.mensaje || result.message || 'Error al enviar el código');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setMensajeError(err.message || 'Error al enviar el código');
    } finally {
      setEnviando(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (data.nuevaPassword !== data.confirmarPassword) {
      setMensajeError('Las contraseñas no coinciden');
      return;
    }

    // Verificar que hay token
    const token = localStorage.getItem('token');
    if (!token) {
      setMensajeError('Sesión expirada. Por favor cierra sesión y vuelve a ingresar.');
      return;
    }

    setEnviando(true);
    setMensajeError(null);

    try {
      const response = await fetch('/api/auth/cambiar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: data.codigo,
          nuevaPassword: data.nuevaPassword,
        }),
      });

      // Intentar parsear el JSON con mejor manejo de errores
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON:', text);
        throw new Error('Error del servidor: respuesta inválida');
      }

      if (response.ok) {
        setStep('exitoso');
        setTimeout(() => onClose(), 2000);
      } else {
        setIntentosRestantes(prev => prev - 1);
        setMensajeError(result.mensaje || result.message || 'Código inválido. Intenta de nuevo.');
        
        if (intentosRestantes <= 1) {
          setMensajeError('Demasiados intentos fallidos. Por favor intenta de nuevo más tarde.');
          setTimeout(() => onClose(), 3000);
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      setMensajeError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setEnviando(false);
    }
  };

  const validarPassword = (pwd: string) => {
    if (!pwd) return 'La contraseña es requerida';
    if (pwd.length < 12) return 'Mínimo 12 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Debe contener mayúsculas';
    if (!/[a-z]/.test(pwd)) return 'Debe contener minúsculas';
    if (!/[0-9]/.test(pwd)) return 'Debe contener números';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)) return 'Debe contener símbolos (!@#$%...)';
    return true;
  };

  return (
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
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2d7a47',
            fontFamily: "'Poppins', sans-serif",
          }}>
            🔐 Cambiar Contraseña
          </h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {step === 'inicial' && (
          <div>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              color: '#666',
              marginBottom: '1.5rem',
              lineHeight: '1.6',
            }}>
              Te enviaremos un código de verificación de 4 dígitos al correo <strong>{email}</strong> para confirmar que eres tú.
            </p>

            <button
              onClick={enviarCodigo}
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
              {enviando ? '⏳ Enviando código...' : '📧 Enviar Código'}
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                marginTop: '0.75rem',
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {step === 'codigo' && codigoEnviado && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              color: '#666',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}>
              Revisa tu correo e ingresa el código de 4 dígitos
            </p>

            {/* Código */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                color: '#333',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.5rem',
              }}>
                Código de Verificación *
              </label>
              <input
                {...register('codigo', {
                  required: 'Código requerido',
                  pattern: {
                    value: /^\d{4}$/,
                    message: 'Debe ser un código de 4 dígitos',
                  }
                })}
                type="text"
                placeholder="0000"
                maxLength={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.codigo ? '2px solid #c33' : '1px solid #ddd',
                  borderRadius: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '1rem',
                  letterSpacing: '0.2rem',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              />
              {errors.codigo && <p style={{ color: '#c33', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{errors.codigo.message}</p>}
            </div>

            {/* Nueva Contraseña */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                color: '#333',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.5rem',
              }}>
                Nueva Contraseña *
              </label>
              <input
                {...register('nuevaPassword', {
                  required: 'Contraseña requerida',
                  validate: validarPassword,
                })}
                type="password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.nuevaPassword ? '2px solid #c33' : '1px solid #ddd',
                  borderRadius: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
              {errors.nuevaPassword && <p style={{ color: '#c33', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{errors.nuevaPassword.message}</p>}
            </div>

            {/* Confirmar Contraseña */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                color: '#333',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.5rem',
              }}>
                Confirmar Contraseña *
              </label>
              <input
                {...register('confirmarPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (value) => value === nuevaPassword || 'Las contraseñas deben coincidir',
                })}
                type="password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.confirmarPassword ? '2px solid #c33' : '1px solid #ddd',
                  borderRadius: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
              {errors.confirmarPassword && <p style={{ color: '#c33', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{errors.confirmarPassword.message}</p>}
            </div>

            {mensajeError && (
              <div style={{
                backgroundColor: '#ffebee',
                border: '1px solid #c33',
                color: '#c33',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
              }}>
                ⚠️ {mensajeError} {intentosRestantes > 0 && `(${intentosRestantes} intentos restantes)`}
              </div>
            )}

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
              {enviando ? '⏳ Verificando...' : '✓ Cambiar Contraseña'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('inicial');
                setCodigoEnviado(false);
              }}
              style={{
                width: '100%',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                marginTop: '0.75rem',
              }}
            >
              Volver
            </button>
          </form>
        )}

        {step === 'exitoso' && (
          <div style={{
            textAlign: 'center',
            padding: '1rem 0',
          }}>
            <p style={{
              fontSize: '2.5rem',
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
              ¡Contraseña cambiada!
            </p>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              color: '#666',
              fontSize: '0.9rem',
              margin: '0.5rem 0 0 0',
            }}>
              Tu contraseña ha sido actualizada correctamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
