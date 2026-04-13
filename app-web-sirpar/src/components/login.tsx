import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsArrowLeft, BsEye, BsEyeSlash } from 'react-icons/bs';
import robot from '../assets/img/robot_register.svg';
import siparLogoNegro from '../assets/img/SIPAR-RS_negro.svg';
import { loginUsuario, obtenerUsuarioActual } from '../utils/api';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  if (!isOpen) return null;

  const handleBack = () => {
    setEmail('');
    setPassword('');
    setError('');
    setExito(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const resultado = await loginUsuario(email, password);
      setExito(true);
      
      // Esperar 1 segundo y redirigir al dashboard según el rol
      setTimeout(() => {
        const usuario = obtenerUsuarioActual();
        console.log('✅ Login exitoso:', resultado);
        console.log('👤 Usuario actual:', usuario);

        if (usuario?.rol === 'ciudadano') {
          navigate('/dashboard/ciudadano');
        } else if (usuario?.rol === 'operador') {
          navigate('/dashboard/operador');
        } else if (usuario?.rol === 'admin') {
          navigate('/dashboard/admin');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      console.error('❌ Error login:', err);
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

        {/* Header con robot y logo */}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '0em 2em 2em 2em' }}>
          <h3
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
              fontWeight: '600',
              fontFamily: "'Poppins', sans-serif",
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Iniciar Sesión
          </h3>

          {/* Mensaje de Error */}
          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              fontFamily: "'Poppins', sans-serif",
              border: '1px solid #fcc',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Mensaje de Éxito */}
          {exito && (
            <div style={{
              backgroundColor: '#efe',
              color: '#3c3',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              fontFamily: "'Poppins', sans-serif",
              border: '1px solid #cfc',
            }}>
              ✅ ¡Login exitoso! Redirigiendo...
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#464251',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="john@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cargando}
              required
              style={inputStyle}
            />
          </div>

          {/* Password Input con ojo */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#464251',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
                required
                minLength={6}
                style={{
                  ...inputStyle,
                  paddingRight: '3rem',
                  marginBottom: 0,
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
          </div>

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={cargando || !email || !password}
            style={{
              width: '100%',
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              backgroundColor: cargando || !email || !password ? '#a0a0a0' : '#2d7a47',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: cargando || !email || !password ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontFamily: "'Poppins', sans-serif",
              transition: 'background-color 0.3s',
              marginBottom: '1.5rem',
              opacity: cargando || !email || !password ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!cargando && email && password) {
                e.currentTarget.style.backgroundColor = '#1a472a';
              }
            }}
            onMouseLeave={(e) => {
              if (!cargando && email && password) {
                e.currentTarget.style.backgroundColor = '#2d7a47';
              }
            }}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          {/* Link a Register */}
          <p
            style={{
              textAlign: 'center',
              marginBottom: 0,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              color: '#6b7280',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            ¿No tienes una cuenta?{' '}
            <span
              onClick={() => {
                if (!cargando) onSwitchToRegister();
              }}
              style={{
                color: '#2d7a47',
                fontWeight: 600,
                cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'color 0.3s',
                opacity: cargando ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!cargando) e.currentTarget.style.color = '#1a472a';
              }}
              onMouseLeave={(e) => {
                if (!cargando) e.currentTarget.style.color = '#2d7a47';
              }}
            >
              Regístrate
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(0.7rem, 2vw, 0.9rem)',
  marginBottom: '1.2rem',
  borderRadius: '0.5rem',
  border: '1px solid #ddd',
  outline: 'none',
  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
  fontFamily: "'Poppins', sans-serif",
  transition: 'border-color 0.3s',
  boxSizing: 'border-box',
};
