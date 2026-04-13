import { useState, useEffect } from 'react';
import { obtenerUsuarioActual, logoutUsuario, actualizarUsuario } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BsLock, BsPerson, BsBoxArrowRight, BsPencil, BsCheck, BsXCircle, BsEye, BsEyeSlash, BsPersonCircle, BsHourglassBottom } from 'react-icons/bs';
import { ChangePasswordModal } from './ChangePasswordModal';

export function PerfilTab() {
  const usuario = obtenerUsuarioActual();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [ubigeos, setUbigeos] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nombre: usuario?.nombre || '',
      email: usuario?.email || '',
      telefono: usuario?.telefono || '',
    }
  });

  const onSubmit = async (data: any) => {
    setActualizando(true);
    setMensaje(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/actualizar-perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al actualizar');
      }

      const result = await response.json();

      if (response.ok) {
        // Actualizar usuario en localStorage
        localStorage.setItem('usuario', JSON.stringify(result.usuario));
        setMensaje({ tipo: 'success', texto: '✓ Perfil actualizado correctamente' });
        setIsEditing(false);
        
        // Recargar para mostrar datos nuevos
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMensaje({ tipo: 'error', texto: result.message || 'Error al actualizar' });
      }
    } catch (err: any) {
      console.error('Error:', err);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el perfil' });
    } finally {
      setActualizando(false);
    }
  };

  const handleLogout = () => {
    logoutUsuario();
    navigate('/');
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        Mi Perfil
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setMensaje(null);
            if (isEditing) reset();
          }}
          style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            backgroundColor: isEditing ? '#666' : '#2d7a47',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          {isEditing ? <>Cancelar</> : <><BsPencil size={16} style={{ marginRight: '0.3rem' }} /> Editar</>}
        </button>
      </h2>

      {/* Avatar */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
      }}>
        <div style={{
          width: 'clamp(60px, 15vw, 80px)',
          height: 'clamp(60px, 15vw, 80px)',
          backgroundColor: '#2d7a47',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          fontSize: '2.5rem',
        }}>
          <BsPerson size={40} color="#fff" />
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          backgroundColor: mensaje.tipo === 'success' ? '#e8f5e9' : '#ffebee',
          border: `1px solid ${mensaje.tipo === 'success' ? '#2d7a47' : '#c33'}`,
          color: mensaje.tipo === 'success' ? '#2d7a47' : '#c33',
          padding: 'clamp(0.75rem, 2vw, 1rem)',
          borderRadius: '0.5rem',
          marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
          fontFamily: "'Poppins', sans-serif",
          textAlign: 'center',
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario o Vista */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} style={{
          display: 'grid',
          gap: 'clamp(1rem, 2.5vw, 1.5rem)',
        }}>
          <div>
            <label style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.5rem',
            }}>
              Nombre Completo *
            </label>
            <input
              {...register('nombre', { required: 'Nombre requerido' })}
              type="text"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.nombre ? '2px solid #c33' : '1px solid #ddd',
                borderRadius: '0.5rem',
                fontFamily: "'Poppins', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            {errors.nombre && <p style={{ color: '#c33', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{typeof errors.nombre?.message === 'string' ? errors.nombre.message : ''}</p>}
          </div>

          <div>
            <label style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.5rem',
            }}>
              Email *
            </label>
            <input
              {...register('email', { required: 'Email requerido' })}
              type="email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.email ? '2px solid #c33' : '1px solid #ddd',
                borderRadius: '0.5rem',
                fontFamily: "'Poppins', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            {errors.email && <p style={{ color: '#c33', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{typeof errors.email?.message === 'string' ? errors.email.message : ''}</p>}
          </div>

          <div>
            <label style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.5rem',
            }}>
              Teléfono *
            </label>
            <input
              {...register('telefono', { required: 'Teléfono requerido' })}
              type="tel"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.telefono ? '2px solid #c33' : '1px solid #ddd',
                borderRadius: '0.5rem',
                fontFamily: "'Poppins', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            {errors.telefono && <p style={{ color: '#c33', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{typeof errors.telefono?.message === 'string' ? errors.telefono.message : ''}</p>}
          </div>

          <button
            type="submit"
            disabled={actualizando}
            style={{
              backgroundColor: '#2d7a47',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: actualizando ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: "'Poppins', sans-serif",
              opacity: actualizando ? 0.6 : 1,
              marginTop: '1rem',
            }}
          >
            {actualizando ? <><BsHourglassBottom size={16} style={{ marginRight: '0.3rem', animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><BsCheck size={16} style={{ marginRight: '0.3rem' }} /> Guardar Cambios</>}
          </button>
        </form>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1.5rem',
        }}>
          <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem' }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              margin: '0 0 0.5rem 0',
            }}>
              Nombre Completo
            </p>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#333',
              margin: '0',
            }}>
              {usuario?.nombre || 'No disponible'}
            </p>
          </div>

          <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem' }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              margin: '0 0 0.5rem 0',
            }}>
              Email
            </p>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#333',
              margin: '0',
            }}>
              {usuario?.email || 'No disponible'}
            </p>
          </div>

          <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem' }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              margin: '0 0 0.5rem 0',
            }}>
              Teléfono
            </p>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#333',
              margin: '0',
            }}>
              {usuario?.telefono || 'No disponible'}
            </p>
          </div>

          <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem' }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              color: '#999',
              margin: '0 0 0.5rem 0',
            }}>
              Distrito
            </p>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#333',
              margin: '0',
            }}>
              {usuario?.ubicacion || 'No disponible'}
            </p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginTop: '2rem',
      }}>
        <button
          onClick={() => setShowPasswordModal(true)}
          style={{
            backgroundColor: '#ff9800',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <BsLock size={18} style={{ marginRight: '0.5rem' }} /> Cambiar Contraseña
        </button>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#c33',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <BsBoxArrowRight size={18} style={{ marginRight: '0.5rem' }} /> Cerrar Sesión
        </button>
      </div>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          email={usuario?.email}
        />
      )}
    </div>
  );
}
