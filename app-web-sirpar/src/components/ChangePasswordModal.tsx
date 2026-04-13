import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BsHourglassBottom, BsEnvelope, BsCheck, BsLock, BsXCircle } from 'react-icons/bs';

interface ChangePasswordModalProps {
  onClose: () => void;
  email?: string;
}

export function ChangePasswordModal({ onClose, email }: ChangePasswordModalProps) {
  const [step, setStep] = useState<'inicial' | 'codigo' | 'exitoso'>('inicial');
  const [enviando, setEnviando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState<string | null>(null);
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
      const response = await fetch('http://localhost:5000/api/auth/enviar-codigo-recuperacion', {
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
          setCodigoVerificacion(result.debug);
          console.log('🔐 Código de verificación:', result.debug);
          // Copiar al portapapeles
          navigator.clipboard.writeText(result.debug).catch(err => console.error('No se pudo copiar:', err));
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
      const codigoLimpio = data.codigo.trim();
      
      console.log('📝 Enviando cambio de contraseña:');
      console.log('Código frontend:', codigoLimpio, 'Tipo:', typeof codigoLimpio, 'Longitud:', codigoLimpio.length);
      console.log('Contraseña longitud:', data.nuevaPassword.length);
      console.log('Nueva contraseña tiene mayúsculas:', /[A-Z]/.test(data.nuevaPassword));
      console.log('Nueva contraseña tiene minúsculas:', /[a-z]/.test(data.nuevaPassword));
      console.log('Nueva contraseña tiene números:', /[0-9]/.test(data.nuevaPassword));
      console.log('Nueva contraseña tiene símbolos:', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(data.nuevaPassword));
      
      const response = await fetch('http://localhost:5000/api/auth/cambiar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: codigoLimpio,
          nuevaPassword: data.nuevaPassword,
        }),
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
        setStep('exitoso');
        setTimeout(() => onClose(), 2000);
      } else {
        setIntentosRestantes(prev => prev - 1);
        const errorMsg = result.mensaje || result.message || 'Código inválido. Intenta de nuevo.';
        setMensajeError(errorMsg);
        console.error('Error del servidor:', errorMsg);
        
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <BsLock size={22} /> Cambiar Contraseña
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
            <BsXCircle size={20} />
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
              {enviando ? <><BsHourglassBottom size={16} style={{ marginRight: '0.3rem' }} /> Enviando código...</> : <><BsEnvelope size={16} style={{ marginRight: '0.3rem' }} /> Enviar Código</>
              }
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

            {/* Mostrar código para desarrollo */}
            {codigoVerificacion && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #2d7a47',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.8rem',
                  color: '#666',
                  margin: '0 0 0.5rem 0',
                }}>Código de verificación:</p>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#2d7a47',
                  letterSpacing: '0.3rem',
                  margin: '0',
                }}>{codigoVerificacion}</div>
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.75rem',
                  color: '#999',
                  margin: '0.5rem 0 0 0',
                }}>✓ Copiado al portapapeles</p>
              </div>
            )}

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
                autoComplete="one-time-code"
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
                autoComplete="new-password"
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
              
              {/* Requisitos de contraseña */}
              {nuevaPassword && (
                <div style={{
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '0.75rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.85rem',
                }}>
                  <p style={{
                    fontWeight: '600',
                    color: '#333',
                    margin: '0 0 0.5rem 0',
                  }}>Requisitos de contraseña:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: nuevaPassword.length >= 12 ? '#2d7a47' : '#999',
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                      }}>
                        {nuevaPassword.length >= 12 ? '✓' : '○'}
                      </span>
                      Mínimo 12 caracteres ({nuevaPassword.length}/12)
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: /[A-Z]/.test(nuevaPassword) ? '#2d7a47' : '#999',
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                      }}>
                        {/[A-Z]/.test(nuevaPassword) ? '✓' : '○'}
                      </span>
                      Mayúsculas (A-Z)
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: /[a-z]/.test(nuevaPassword) ? '#2d7a47' : '#999',
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                      }}>
                        {/[a-z]/.test(nuevaPassword) ? '✓' : '○'}
                      </span>
                      Minúsculas (a-z)
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: /[0-9]/.test(nuevaPassword) ? '#2d7a47' : '#999',
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                      }}>
                        {/[0-9]/.test(nuevaPassword) ? '✓' : '○'}
                      </span>
                      Números (0-9)
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(nuevaPassword) ? '#2d7a47' : '#999',
                    }}>
                      <span style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                      }}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(nuevaPassword) ? '✓' : '○'}
                      </span>
                      Símbolos (!@#$%^&...)
                    </div>
                  </div>
                </div>
              )}
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
                autoComplete="new-password"
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
              {enviando ? <><BsHourglassBottom size={16} style={{ marginRight: '0.3rem' }} /> Verificando...</> : <><BsCheck size={16} style={{ marginRight: '0.3rem' }} /> Cambiar Contraseña</>
              }
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
              <BsCheck size={40} color="#2d7a47" />
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
