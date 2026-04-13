import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BsArrowLeft, BsEye, BsEyeSlash, BsCheck } from 'react-icons/bs';
import robot from '../assets/img/robot_register.svg';
import siparLogoNegro from '../assets/img/SIPAR-RS_negro.svg';
import { registroUsuario } from '../utils/api';

export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      nombreCompleto: '',
      dni: '',
      telefono: '',
      ubicacion: '',
      email: '',
      password: '',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ubigeos, setUbigeos] = useState<any[]>([]);

  const password = watch('password');
  const ubicacion = watch('ubicacion');

  // Autocompletado de distritos peruanos - Definir primero antes de usarla
  const sugerirDistritos = (valor: string) => {
    if (!valor || ubigeos.length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = ubigeos
      .filter((ubigeo: any) => {
        const fullText = `${ubigeo.departamento} ${ubigeo.ciudad} ${ubigeo.distrito}`.toLowerCase();
        return fullText.includes(valor.toLowerCase());
      })
      .map((ubigeo: any) => `${ubigeo.departamento}, ${ubigeo.ciudad}, ${ubigeo.distrito}`)
      .slice(0, 8);

    setSuggestions(filtered);
  };

  // Cargar ubigeos al montar el componente
  useEffect(() => {
    const cargarUbigeos = async () => {
      try {
        const response = await fetch('https://free.e-api.net.pe/ubigeos.json');
        const data = await response.json();
        console.log('📊 Estructura bruta (primero):', Object.keys(data)[0], data[Object.keys(data)[0]]);
        
        // Convertir objeto jerárquico a array plano
        const arrayUbigeos: any[] = [];
        
        for (const [departamento, ciudades] of Object.entries(data)) {
          // ciudades puede ser un objeto con ciudades como propiedades
          for (const [ciudad, distritos] of Object.entries(ciudades as any)) {
            // distritos puede ser un array o un objeto
            const distritosArray = Array.isArray(distritos) ? distritos : Object.keys(distritos as any);
            
            for (const distrito of distritosArray) {
              arrayUbigeos.push({
                departamento: departamento.toUpperCase(),
                ciudad: ciudad,
                distrito: typeof distrito === 'string' ? distrito : distrito
              });
            }
          }
        }
        
        console.log('📋 Array convertido:', arrayUbigeos.length, 'registros');
        console.log('📝 Ejemplo:', arrayUbigeos.slice(0, 3));
        setUbigeos(arrayUbigeos);
      } catch (err) {
        console.error('❌ Error cargando ubigeos:', err);
      }
    };
    cargarUbigeos();
  }, []);

  // Observar cambios en la ubicación y sugerir distritos
  useEffect(() => {
    sugerirDistritos(ubicacion);
  }, [ubicacion, ubigeos]);

  if (!isOpen) return null;

  // Validar fortaleza de password
  const validarPassword = (pwd: string) => {
    if (!pwd) return 'La contraseña es requerida';
    if (pwd.length < 12) return 'Mínimo 12 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Debe contener mayúsculas';
    if (!/[a-z]/.test(pwd)) return 'Debe contener minúsculas';
    if (!/[0-9]/.test(pwd)) return 'Debe contener números';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Debe contener símbolos (!@#$%...)';
    return true;
  };

  const handleBack = () => {
    reset();
    setAgreeTerms(false);
    setError('');
    setExito(false);
    setSuggestions([]);
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!agreeTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const resultado = await registroUsuario(data);
      setExito(true);

      setTimeout(() => {
        handleBack();
        onSwitchToLogin();
      }, 1500);

      console.log('✅ Registro exitoso:', resultado);
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
      console.error('❌ Error registro:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        overflowY: 'auto',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      }}
      onClick={handleBack}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: '#fff',
          borderRadius: 'clamp(1rem, 3vw, 1.5rem)',
          overflow: 'hidden',
          position: 'relative',
          animation: 'fadeIn 0.3s ease',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de retroceso */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: '1.5rem',
            color: '#1a1a1a',
          }}
        >
          <BsArrowLeft size={24} />
        </button>

        {/* Header */}
        <div
          style={{
            height: 'clamp(150px, 25vw, 200px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '1rem',
          }}
        >
          <img
            src={robot}
            alt="robot"
            style={{
              width: 'clamp(80px, 15vw, 120px)',
              height: 'auto',
              marginBottom: '0.5rem',
            }}
          />
          <img src={siparLogoNegro} alt="SIPAR-RS" style={{ width: '8em', height: 'auto' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '0em 2em 2em 2em' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600', fontFamily: "'Poppins', sans-serif", color: '#1a1a1a', margin: 0 }}>
            Regístrate
          </h3>

          {error && (
            <div style={{ backgroundColor: '#fee', color: '#c33', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontFamily: "'Poppins', sans-serif", border: '1px solid #fcc' }}>
              ⚠️ {error}
            </div>
          )}

          {exito && (
            <div style={{ backgroundColor: '#efe', color: '#3c3', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontFamily: "'Poppins', sans-serif", border: '1px solid #cfc' }}>
              ✅ ¡Registro exitoso! Redirigiendo...
            </div>
          )}

          {/* Nombre */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Juan Pérez García"
              disabled={cargando}
              {...register('nombreCompleto', {
                required: 'El nombre es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              style={{
                width: '100%',
                padding: 'clamp(0.7rem, 2vw, 0.9rem)',
                marginBottom: errors.nombreCompleto ? '0.3rem' : '0.8rem',
                borderRadius: '0.5rem',
                border: errors.nombreCompleto ? '2px solid #ff3333' : '1px solid #ddd',
                outline: 'none',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontFamily: "'Poppins', sans-serif",
              }}
            />
            {errors.nombreCompleto && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.nombreCompleto.message}</span>}
          </div>

          {/* DNI */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
              DNI (Opcional)
            </label>
            <input
              type="text"
              placeholder="12345678"
              disabled={cargando}
              {...register('dni', {
                pattern: { value: /^\d{8}$|^$/, message: 'DNI debe tener 8 dígitos' },
              })}
              style={{
                width: '100%',
                padding: 'clamp(0.7rem, 2vw, 0.9rem)',
                marginBottom: errors.dni ? '0.3rem' : '0.8rem',
                borderRadius: '0.5rem',
                border: errors.dni ? '2px solid #ff3333' : '1px solid #ddd',
                outline: 'none',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontFamily: "'Poppins', sans-serif",
              }}
            />
            {errors.dni && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.dni.message}</span>}
          </div>

          {/* Teléfono */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
              Celular (9 dígitos)
            </label>
            <input
              type="tel"
              placeholder="987654321"
              disabled={cargando}
              {...register('telefono', {
                required: 'El teléfono es requerido',
                pattern: { value: /^\d{9}$/, message: 'Debe tener 9 dígitos sin código de país' },
              })}
              style={{
                width: '100%',
                padding: 'clamp(0.7rem, 2vw, 0.9rem)',
                marginBottom: errors.telefono ? '0.3rem' : '0.8rem',
                borderRadius: '0.5rem',
                border: errors.telefono ? '2px solid #ff3333' : '1px solid #ddd',
                outline: 'none',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontFamily: "'Poppins', sans-serif",
              }}
            />
            {errors.telefono && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.telefono.message}</span>}
          </div>

          {/* Ubicación con autocompletado */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
              Distrito / Zona
            </label>
            <input
              type="text"
              placeholder="Independencia, Lima"
              disabled={cargando}
              {...register('ubicacion', {
                required: 'La zona es requerida',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              style={{
                width: '100%',
                padding: 'clamp(0.7rem, 2vw, 0.9rem)',
                marginBottom: errors.ubicacion ? '0.3rem' : suggestions.length > 0 ? '0rem' : '0.8rem',
                borderRadius: '0.5rem',
                border: errors.ubicacion ? '2px solid #ff3333' : '1px solid #ddd',
                outline: 'none',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontFamily: "'Poppins', sans-serif",
              }}
            />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem', zIndex: 100, maxHeight: '150px', overflowY: 'auto' }}>
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setValue('ubicacion', sug);
                      setSuggestions([]);
                    }}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'Poppins', sans-serif", borderBottom: '1px solid #eee' }}
                  >
                    {sug}
                  </div>
                ))}
              </div>
            )}
            {errors.ubicacion && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", display: 'block', marginTop: '0.3rem' }}>⚠️ {errors.ubicacion.message}</span>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="john@gmail.com"
              disabled={cargando}
              {...register('email', {
                required: 'El email es requerido',
                pattern: { value: /^[\w\.-]+@[\w\.-]+\.\w+$/, message: 'Email inválido' },
              })}
              style={{
                width: '100%',
                padding: 'clamp(0.7rem, 2vw, 0.9rem)',
                marginBottom: errors.email ? '0.3rem' : '0.8rem',
                borderRadius: '0.5rem',
                border: errors.email ? '2px solid #ff3333' : '1px solid #ddd',
                outline: 'none',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                fontFamily: "'Poppins', sans-serif",
              }}
            />
            {errors.email && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.email.message}</span>}
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={cargando}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  validate: validarPassword,
                })}
                style={{
                  width: '100%',
                  padding: 'clamp(0.7rem, 2vw, 0.9rem)',
                  paddingRight: '3rem',
                  marginBottom: 0,
                  borderRadius: '0.5rem',
                  border: errors.password ? '2px solid #ff3333' : '1px solid #ddd',
                  outline: 'none',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontFamily: "'Poppins', sans-serif",
                  opacity: cargando ? 0.6 : 1,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={cargando}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  color: '#9ca3af',
                  fontSize: '1.2rem',
                  opacity: cargando ? 0.5 : 1,
                }}
              >
                {showPassword ? <BsEyeSlash /> : <BsEye />}
              </button>
            </div>
            {errors.password && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", display: 'block', marginTop: '0.3rem' }}>⚠️ {errors.password.message}</span>}

            {/* Indicador de fortaleza */}
            {password && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}>
                  <div style={{ flex: 1, height: '4px', backgroundColor: password.length >= 12 ? '#2d7a47' : '#ccc', borderRadius: '2px' }}></div>
                  <div style={{ flex: 1, height: '4px', backgroundColor: /[A-Z]/.test(password) ? '#2d7a47' : '#ccc', borderRadius: '2px' }}></div>
                  <div style={{ flex: 1, height: '4px', backgroundColor: /[a-z]/.test(password) ? '#2d7a47' : '#ccc', borderRadius: '2px' }}></div>
                  <div style={{ flex: 1, height: '4px', backgroundColor: /[0-9]/.test(password) ? '#2d7a47' : '#ccc', borderRadius: '2px' }}></div>
                  <div style={{ flex: 1, height: '4px', backgroundColor: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '#2d7a47' : '#ccc', borderRadius: '2px' }}></div>
                </div>
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {password.length < 12 ? '◯' : <BsCheck size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />} 12+ | {/[A-Z]/.test(password) ? <BsCheck size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> : '◯'} Mayús | {/[a-z]/.test(password) ? <BsCheck size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> : '◯'} Minús | {/[0-9]/.test(password) ? <BsCheck size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> : '◯'} Números | {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? <BsCheck size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> : '◯'} Símbolos
                </small>
              </div>
            )}
          </div>

          {/* Términos */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={cargando}
              style={{ marginTop: '0.3rem', cursor: cargando ? 'not-allowed' : 'pointer', width: '1rem', height: '1rem', opacity: cargando ? 0.5 : 1 }}
            />
            <label style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: "'Poppins', sans-serif", cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.5 : 1 }}>
              Acepto los términos y condiciones y la política de privacidad
            </label>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={!agreeTerms || cargando}
            style={{
              width: '100%',
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              backgroundColor: (!agreeTerms || cargando) ? '#a0a0a0' : '#2d7a47',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: (!agreeTerms || cargando) ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontFamily: "'Poppins', sans-serif",
              transition: 'background-color 0.3s',
              marginBottom: '1.5rem',
              opacity: (!agreeTerms || cargando) ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (agreeTerms && !cargando) (e.target as HTMLButtonElement).style.backgroundColor = '#1a472a';
            }}
            onMouseLeave={(e) => {
              if (agreeTerms && !cargando) (e.target as HTMLButtonElement).style.backgroundColor = '#2d7a47';
            }}
          >
            {cargando ? 'Registrando...' : 'Registrarse'}
          </button>

          {/* Link */}
          <p style={{ textAlign: 'center', marginBottom: 0, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: '#6b7280', fontFamily: "'Poppins', sans-serif" }}>
            ¿Ya tienes una cuenta?{' '}
            <span
              onClick={() => {
                if (!cargando) onSwitchToLogin();
              }}
              style={{ color: '#2d7a47', fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer', transition: 'color 0.3s', opacity: cargando ? 0.5 : 1 }}
              onMouseEnter={(e) => {
                if (!cargando) (e.currentTarget as HTMLElement).style.color = '#1a472a';
              }}
              onMouseLeave={(e) => {
                if (!cargando) (e.currentTarget as HTMLElement).style.color = '#2d7a47';
              }}
            >
              Iniciar Sesión
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}