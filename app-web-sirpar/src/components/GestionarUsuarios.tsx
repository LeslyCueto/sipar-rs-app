import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BsSearch, BsPlus, BsPencil, BsEye, BsEyeSlash, BsChevronLeft, BsChevronRight, BsPersonCircle, BsExclamationCircle } from 'react-icons/bs';
import { obtenerTodosUsuarios, obtenerTodosReportes, obtenerToken, actualizarUsuario, crearUsuarioAdmin } from '../utils/api';

interface Usuario {
  _id?: string;
  nombreCompleto?: string;
  nombre?: string;
  dni: string;
  telefono: string;
  ubicacion?: string;
  zona?: string;
  email: string;
  estado?: string;
  reportes?: number;
  rol?: string;
}

export function GestionarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [reportesPorUsuario, setReportesPorUsuario] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtrarDNI, setFiltrarDNI] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [ubigeos, setUbigeos] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modalReportesAbierto, setModalReportesAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  const USUARIOS_POR_PAGINA = 10;

  // Cargar usuarios y reportes al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener usuarios
        const usuariosData = await obtenerTodosUsuarios();
        
        // Mapear usuarios al formato esperado y filtrar solo ciudadanos
        const usuariosMapeados = usuariosData
          .filter((u: any) => u.rol === 'ciudadano')
          .map((u: any) => ({
            _id: u._id,
            nombreCompleto: u.nombre,
            nombre: u.nombre,
            dni: u.dni || 'N/A',
            telefono: u.telefono,
            ubicacion: u.zona,
            zona: u.zona,
            email: u.email,
            rol: u.rol,
            estado: '0/0 ATENDIDOS', // Se actualiza dinámicamente después de cargar reportes
            reportes: 0, // Se actualiza cuando se cargan los reportes
          }));

        // Obtener reportes
        let reporte: any[] = [];
        const token = obtenerToken();
        if (token) {
          try {
            reporte = await obtenerTodosReportes();
          } catch (_err) {
            console.log('No se pudieron cargar los reportes con token, continuando sin ellos');
          }
        }

        // Agrupar reportes por usuario y contar resueltos
        const reportesPorUser: { [key: string]: any[] } = {};
        const resueltosPorUser: { [key: string]: number } = {};
        
        reporte.forEach((report: any) => {
          // Extraer usuarioId correctamente (puede ser string o objeto después del populate)
          let usuarioId = null;
          if (report.usuario?.id?._id) {
            usuarioId = report.usuario.id._id.toString();
          } else if (report.usuario?.id) {
            usuarioId = report.usuario.id.toString();
          }
          
          if (usuarioId) {
            if (!reportesPorUser[usuarioId]) {
              reportesPorUser[usuarioId] = [];
              resueltosPorUser[usuarioId] = 0;
            }
            
            // Mapear el estado
            const estadoMap: { [key: string]: string } = {
              'pendiente': 'PENDIENTE',
              'en_proceso': 'EN REVISIÓN',
              'resuelto': 'RESUELTO',
            };

            // Mapear severidad
            const severidadMap: { [key: string]: string } = {
              'bajo': 'BAJA',
              'medio': 'MEDIA',
              'alto': 'ALTA',
            };

            const severidad = severidadMap[report.nivelFinal || report.nivelCalculado || 'medio'];
            const estado = estadoMap[report.estado] || 'PENDIENTE';

            // Contar si está resuelto
            if (report.estado === 'resuelto') {
              resueltosPorUser[usuarioId]++;
            }

            // Formatear fecha
            const fecha = new Date(report.fechas?.creado).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            // Generar ID de reporte
            const reportId = `REP-${report._id?.toString().slice(-4).toUpperCase()}` || `REP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            reportesPorUser[usuarioId].push({
              id: reportId,
              titulo: report.tipoIncidente === 'quema_ilegal' ? 'Quema ilegal' : report.tipoIncidente === 'acumulacion_residuos' ? 'Acumulación de residuos' : report.descripcion || 'Reporte Sin Título',
              severidad,
              fecha,
              estado,
              operador: report.operadorAsignado?.id?.nombre || 'Sin asignar',
              descripcion: report.descripcion,
              tipo: report.tipoIncidente,
            });
          }
        });

        // Actualizar el número de reportes y estado dinámico para cada usuario
        usuariosMapeados.forEach((u: Usuario) => {
          const usuarioId = u._id || '';
          const totalReportes = reportesPorUser[usuarioId]?.length || 0;
          const resueltos = resueltosPorUser[usuarioId] || 0;
          
          u.reportes = totalReportes;
          u.estado = `${resueltos}/${totalReportes} ATENDIDOS`;
        });

        setUsuarios(usuariosMapeados);
        setReportesPorUsuario(reportesPorUser);
        setLoading(false);
      } catch (err: any) {
        console.error('Error cargando datos:', err);
        setError(err.message || 'Error al cargar datos');
        setLoading(false);
      }
    };

    cargarDatos();

    // No refrescar automáticamente globalmente - ver más abajo
  }, []);

  // Refrescoo sutil y automático solo cuando el modal de reportes está abierto
  useEffect(() => {
    if (!modalReportesAbierto || !usuarioSeleccionado) return;

    // Función para refrescar solo los reportes del usuario seleccionado
    const refrescarReportesUsuario = async () => {
      try {
        const token = obtenerToken();
        if (!token) return;

        const reportes = await obtenerTodosReportes();
        const reportesPorUser: { [key: string]: any[] } = {};
        const resueltosPorUser: { [key: string]: number } = {};

        reportes.forEach((report: any) => {
          let usuarioId = null;
          if (report.usuario?.id?._id) {
            usuarioId = report.usuario.id._id.toString();
          } else if (report.usuario?.id) {
            usuarioId = report.usuario.id.toString();
          }

          if (usuarioId) {
            if (!reportesPorUser[usuarioId]) {
              reportesPorUser[usuarioId] = [];
            }

            const estadoMap: { [key: string]: string } = {
              'pendiente': 'PENDIENTE',
              'en_proceso': 'EN REVISIÓN',
              'resuelto': 'RESUELTO',
            };

            const severidadMap: { [key: string]: string } = {
              'bajo': 'BAJA',
              'medio': 'MEDIA',
              'alto': 'ALTA',
            };

            const severidad = severidadMap[report.nivelFinal || report.nivelCalculado || 'medio'];
            const estado = estadoMap[report.estado] || 'PENDIENTE';

            if (report.estado === 'resuelto') {
              resueltosPorUser[usuarioId] = (resueltosPorUser[usuarioId] || 0) + 1;
            }

            const fecha = new Date(report.fechas?.creado).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            const reportId = `REP-${report._id?.toString().slice(-4).toUpperCase()}` || `REP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            reportesPorUser[usuarioId].push({
              id: reportId,
              titulo: report.tipoIncidente === 'quema_ilegal' ? 'Quema ilegal' : report.tipoIncidente === 'acumulacion_residuos' ? 'Acumulación de residuos' : report.descripcion || 'Reporte Sin Título',
              severidad,
              fecha,
              estado,
              operador: report.operadorAsignado?.id?.nombre || 'Sin asignar',
              descripcion: report.descripcion,
              tipo: report.tipoIncidente,
            });
          }
        });

        // Actualizar solo los reportes del usuario seleccionado, sin borrar los demás
        setReportesPorUsuario(prev => ({
          ...prev,
          [usuarioSeleccionado._id || '']: reportesPorUser[usuarioSeleccionado._id || ''] || []
        }));
      } catch (err) {
        console.error('Error refrescando reportes:', err);
      }
    };

    // Refrescar cada 15 segundos cuando el modal está abierto
    const intervaloRefresco = setInterval(refrescarReportesUsuario, 15000);

    return () => clearInterval(intervaloRefresco);
  }, [modalReportesAbierto, usuarioSeleccionado]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
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

  const ubicacion = watch('ubicacion');

  // Cargar ubigeos
  useEffect(() => {
    const cargarUbigeos = async () => {
      try {
        const response = await fetch('https://free.e-api.net.pe/ubigeos.json');
        const data = await response.json();
        const arrayUbigeos: any[] = [];

        for (const [departamento, ciudades] of Object.entries(data)) {
          for (const [ciudad, distritos] of Object.entries(ciudades as any)) {
            const distritosArray = Array.isArray(distritos) ? distritos : Object.keys(distritos as any);
            for (const distrito of distritosArray) {
              arrayUbigeos.push({
                departamento: departamento.toUpperCase(),
                ciudad: ciudad,
                distrito: typeof distrito === 'string' ? distrito : distrito,
              });
            }
          }
        }
        setUbigeos(arrayUbigeos);
      } catch (err) {
        console.error('Error cargando ubigeos:', err);
      }
    };
    cargarUbigeos();
  }, []);

  // Sugerir distritos
  useEffect(() => {
    if (!ubicacion || ubigeos.length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = ubigeos
      .filter((ubigeo: any) => {
        const fullText = `${ubigeo.departamento} ${ubigeo.ciudad} ${ubigeo.distrito}`.toLowerCase();
        return fullText.includes(ubicacion.toLowerCase());
      })
      .map((ubigeo: any) => `${ubigeo.departamento}, ${ubigeo.ciudad}, ${ubigeo.distrito}`)
      .slice(0, 5);

    setSuggestions(filtered);
  }, [ubicacion, ubigeos]);

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!filtrarDNI) return true;
    const nombre = (u.nombreCompleto || u.nombre || '').toLowerCase();
    return u.dni.toLowerCase().includes(filtrarDNI.toLowerCase()) || nombre.includes(filtrarDNI.toLowerCase());
  });

  const totalPages = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA);
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaActual - 1) * USUARIOS_POR_PAGINA,
    paginaActual * USUARIOS_POR_PAGINA
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [filtrarDNI]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Limpiar notificación después de 3 segundos
  useEffect(() => {
    if (mensajeNotificacion) {
      const timer = setTimeout(() => {
        setMensajeNotificacion(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensajeNotificacion]);

  const onSubmit = async (data: any) => {
    try {
      setGuardandoUsuario(true);
      
      if (editandoId) {
        // Actualizar usuario en la BD
        const datosActualizacion = {
          nombre: data.nombreCompleto,
          telefono: data.telefono,
          zona: data.ubicacion,
          email: data.email,
        };

        await actualizarUsuario(editandoId, datosActualizacion);

        // Actualizar en el estado local
        setUsuarios(usuarios.map((u) => (u._id === editandoId ? { 
          ...u, 
          nombreCompleto: data.nombreCompleto,
          nombre: data.nombreCompleto,
          dni: data.dni,
          telefono: data.telefono,
          ubicacion: data.ubicacion,
          zona: data.ubicacion,
          email: data.email,
        } : u)));

        // Mostrar mensaje de éxito
        setMensajeNotificacion({
          tipo: 'exito',
          mensaje: '✅ Usuario actualizado correctamente',
        });
      } else {
        // Crear nuevo usuario en la BD
        if (!data.password) {
          throw new Error('La contraseña es requerida para registrar un nuevo ciudadano');
        }

        const nuevoUsuario = {
          nombre: data.nombreCompleto,
          email: data.email,
          password: data.password,
          dni: data.dni,
          telefono: data.telefono,
          zona: data.ubicacion,
          rol: 'ciudadano', // Siempre ciudadano en este componente
        };

        const respuesta = await crearUsuarioAdmin(nuevoUsuario);

        // Agregar el nuevo usuario a la lista
        setUsuarios([...usuarios, { 
          _id: respuesta.usuario.id,
          nombreCompleto: respuesta.usuario.nombre,
          nombre: respuesta.usuario.nombre,
          dni: respuesta.usuario.dni,
          telefono: respuesta.usuario.telefono,
          ubicacion: respuesta.usuario.zona,
          zona: respuesta.usuario.zona,
          email: respuesta.usuario.email,
          rol: 'ciudadano',
          estado: '0 REPORTES',
          reportes: 0,
        }]);

        setMensajeNotificacion({
          tipo: 'exito',
          mensaje: '✅ Ciudadano registrado correctamente en la BD',
        });
      }

      setGuardandoUsuario(false);
      reset();
      setModalAbierto(false);
      setEditandoId(null);
      setSuggestions([]);
    } catch (err: any) {
      setGuardandoUsuario(false);
      console.error('Error guardando usuario:', err);
      setMensajeNotificacion({
        tipo: 'error',
        mensaje: `❌ Error: ${err.message || 'Error desconocido'}`,
      });
    }
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      setUsuarios(usuarios.filter((u) => u._id !== id));
    }
  };

  const handleAgregarClick = () => {
    reset({
      nombreCompleto: '',
      dni: '',
      telefono: '',
      ubicacion: '',
      email: '',
      password: '',
    });
    setEditandoId(null);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setSuggestions([]);
    reset();
  };

  const getPorcentajeAsistencia = (_estado: string) => {
    // Función mantenida para compatibilidad pero no se usa actualmente
    // El porcentaje se calcula directamente en el mapa de usuarios
    return 0;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Indicador de carga */}
      {loading && (
        <div style={{
          backgroundColor: '#e8f5e9',
          border: '1px solid #4caf50',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#2e7d32',
          fontFamily: "'Poppins', sans-serif",
        }}>
          ⏳ Cargando usuarios y reportes desde la base de datos...
        </div>
      )}

      {/* Indicador de error */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#c62828',
          fontFamily: "'Poppins', sans-serif",
        }}>
          ❌ {error}
        </div>
      )}

      {/* Notificación de guardado */}
      {mensajeNotificacion && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 2000,
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          backgroundColor: mensajeNotificacion.tipo === 'exito' ? '#e8f5e9' : '#ffebee',
          border: `2px solid ${mensajeNotificacion.tipo === 'exito' ? '#4caf50' : '#f44336'}`,
          color: mensajeNotificacion.tipo === 'exito' ? '#2e7d32' : '#c62828',
          fontFamily: "'Poppins', sans-serif",
          fontWeight: '600',
          fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {mensajeNotificacion.mensaje}
        </div>
      )}

      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '1rem' : '1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: isMobile ? '1rem' : 0,
      }}>
        <div style={{ textAlign: 'left' }}>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? '1.2rem' : '1.8rem',
              fontWeight: '700',
              color: '#244d3b',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            GESTIÓN DE CIUDADANOS
          </h2>
          <p style={{
            margin: '0.2rem 0 0 0',
            fontSize: isMobile ? '0.7rem' : '0.85rem',
            color: '#999',
            fontFamily: "'Poppins', sans-serif",
            lineHeight: isMobile ? '1.2' : '1.4',
          }}>
            CONTROL DE PERFILES Y TRAZABILIDAD DE REPORTES • {usuarios.length} CIUDADANOS REGISTRADOS
          </p>
        </div>
        <button
          onClick={handleAgregarClick}
          style={{
            backgroundColor: '#244d3b',
            color: '#fff',
            border: 'none',
            padding: isMobile ? '0.7rem 1rem' : '0.8rem 1.5rem',
            borderRadius: '0.8rem',
            cursor: 'pointer',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '0.3rem' : '0.5rem',
            fontSize: isMobile ? '0.7rem' : '0.85rem',
            whiteSpace: isMobile ? 'wrap' : 'nowrap',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <BsPlus size={isMobile ? 16 : 18} /> {isMobile ? 'REGISTRAR' : 'REGISTRAR CIUDADANO'}
        </button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <BsSearch style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none', fontSize: isMobile ? '0.9rem' : '1rem' }} />
          <input
            type="text"
            placeholder={isMobile ? "Buscar..." : "Buscar por DNI o Nombre..."}
            value={filtrarDNI}
            onChange={(e) => setFiltrarDNI(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.6rem 0.8rem 0.6rem 2.5rem' : '0.7rem 1rem 0.7rem 3rem',
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontFamily: "'Poppins', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflow: 'auto',
          marginBottom: isMobile ? '1rem' : '1.5rem',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'Poppins', sans-serif",
            fontSize: isMobile ? '0.8rem' : '1rem',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: isMobile ? '0.7rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{isMobile ? 'NOMBRE' : 'Nombre del Ciudadano'}</th>
              {!isMobile && <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI</th>}
              {!isMobile && <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ubicación</th>}
              <th style={{ padding: isMobile ? '0.7rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{isMobile ? 'REP.' : 'Cant. Reportes'}</th>
              <th style={{ padding: isMobile ? '0.7rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{isMobile ? 'EST.' : 'Estado Revisión'}</th>
              <th style={{ padding: isMobile ? '0.7rem 0.3rem' : '1rem', textAlign: 'center', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>ACC.</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.length > 0 ? (
              usuariosPaginados.map((usuario) => {
                // Calcular porcentaje de reportes resueltos
                const reportesUsuario = reportesPorUsuario[usuario._id || ''] || [];
                const reportesResueltos = reportesUsuario.filter((r) => r.estado === 'RESUELTO').length;
                const totalReportes = reportesUsuario.length || 1;
                const porcentaje = totalReportes === 0 ? 0 : Math.round((reportesResueltos / totalReportes) * 100);
                
                return (
                  <tr
                    key={usuario._id}
                    style={{
                      borderBottom: '1px solid #e0e0e0',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f9f9f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <td style={{ padding: isMobile ? '0.8rem 0.5rem' : '1.2rem 1rem', color: '#0d3a26', fontWeight: '600', fontSize: isMobile ? '0.75rem' : '0.95rem' }}>{isMobile ? (usuario.nombreCompleto || usuario.nombre || '').split(' ')[0] : (usuario.nombreCompleto || usuario.nombre)}</td>
                    {!isMobile && <td style={{ padding: '1.2rem 1rem', color: '#666', fontSize: '0.9rem' }}>{usuario.dni}</td>}
                    {!isMobile && <td style={{ padding: '1.2rem 1rem', color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>{usuario.ubicacion}</td>}
                    <td style={{ padding: isMobile ? '0.8rem 0.5rem' : '1.2rem 1rem', color: '#244d3b', fontWeight: '600', fontSize: isMobile ? '0.75rem' : '0.95rem' }}>{usuario.reportes}</td>
                    <td style={{ padding: isMobile ? '0.8rem 0.5rem' : '1.2rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.6rem', flexWrap: 'wrap' }}>
                        {!isMobile && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f57c00' }}>{reportesResueltos}/{totalReportes} ATENDIDOS</span>}
                        <div style={{ width: isMobile ? '30px' : '50px', height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${porcentaje}%`,
                              backgroundColor: porcentaje === 100 ? '#2d7a47' : '#f57c00',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: '#999', fontWeight: '500' }}>{porcentaje}%</span>
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? '0.8rem 0.3rem' : '1.2rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: isMobile ? '0.2rem' : '0.5rem', justifyContent: 'center', opacity: isMobile ? 1 : 0, transition: 'opacity 0.2s ease' }} className="hover-buttons">
                        {!isMobile && <button
                          onClick={() => {
                            setUsuarioSeleccionado(usuario);
                            setModalReportesAbierto(true);
                          }}
                          style={{
                            backgroundColor: '#244d3b',
                            color: '#fff',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.4rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            fontFamily: "'Poppins', sans-serif",
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <BsEye size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> VER REPORTES
                        </button>}
                        <button
                          onClick={() => {
                            setEditandoId(usuario._id || null);
                            reset(usuario);
                            setSuggestions([]);
                            setModalAbierto(true);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#244d3b',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            padding: isMobile ? '0.3rem' : '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BsPencil size={isMobile ? 16 : 18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                  No hay usuarios que coincidan con el filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.8rem' : 0, marginBottom: '2rem' }}>
        <p style={{ margin: 0, fontSize: isMobile ? '0.65rem' : '0.85rem', color: '#999', fontFamily: "'Poppins', sans-serif", textAlign: isMobile ? 'center' : 'left' }}>
          {isMobile ? 'PÁG' : 'MOSTRANDO'} {(paginaActual - 1) * USUARIOS_POR_PAGINA + 1}-{Math.min(paginaActual * USUARIOS_POR_PAGINA, usuariosFiltrados.length)} {isMobile ? '/' : 'DE'} {usuariosFiltrados.length}
        </p>
        <div style={{ display: 'flex', gap: isMobile ? '0.3rem' : '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
            disabled={paginaActual === 1}
            style={{
              backgroundColor: paginaActual === 1 ? '#f0f0f0' : '#fff',
              color: paginaActual === 1 ? '#999' : '#244d3b',
              border: '1px solid #ddd',
              padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.7rem',
              borderRadius: '0.4rem',
              cursor: paginaActual === 1 ? 'default' : 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.9rem',
              fontFamily: "'Poppins', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: isMobile ? '30px' : 'auto',
              minHeight: isMobile ? '30px' : 'auto',
            }}
          >
            <BsChevronLeft size={isMobile ? 14 : 16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setPaginaActual(page)}
              style={{
                backgroundColor: paginaActual === page ? '#244d3b' : '#fff',
                color: paginaActual === page ? '#fff' : '#666',
                border: paginaActual === page ? 'none' : '1px solid #ddd',
                padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.7rem',
                borderRadius: '0.4rem',
                cursor: 'pointer',
                fontSize: isMobile ? '0.7rem' : '0.85rem',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: paginaActual === page ? '600' : '400',
                minWidth: isMobile ? '28px' : '35px',
                minHeight: isMobile ? '28px' : 'auto',
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setPaginaActual(Math.min(totalPages, paginaActual + 1))}
            disabled={paginaActual === totalPages}
            style={{
              backgroundColor: paginaActual === totalPages ? '#f0f0f0' : '#fff',
              color: paginaActual === totalPages ? '#999' : '#244d3b',
              border: '1px solid #ddd',
              padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.7rem',
              borderRadius: '0.4rem',
              cursor: paginaActual === totalPages ? 'default' : 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.9rem',
              fontFamily: "'Poppins', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: isMobile ? '30px' : 'auto',
              minHeight: isMobile ? '30px' : 'auto',
            }}
          >
            <BsChevronRight size={isMobile ? 14 : 16} />
          </button>
        </div>
      </div>

      {/* Modal Ver Reportes */}
      {modalReportesAbierto && usuarioSeleccionado && (
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
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setModalReportesAbierto(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '0.8rem',
              display: 'flex',
              gap: '2rem',
              maxWidth: '1000px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Izquierdo - Info Usuario */}
            <div
              style={{
                backgroundColor: '#244d3b',
                borderRadius: '0.8rem 0 0 0.8rem',
                padding: '2rem',
                minWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#fff',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  fontSize: '2.5rem',
                }}
              >
                <BsPersonCircle size={60} color="#244d3b" />
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700', textAlign: 'center' }}>
                {usuarioSeleccionado.nombreCompleto || usuarioSeleccionado.nombre}
              </h4>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: '#b3d9cc', textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px' }}>
                CIUDADANO VERIFICADO
              </p>
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.75rem', color: '#b3d9cc', letterSpacing: '0.3px' }}>DNI</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{usuarioSeleccionado.dni}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.75rem', color: '#b3d9cc', letterSpacing: '0.3px' }}>UBICACIÓN</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{usuarioSeleccionado.ubicacion}</p>
                </div>
              </div>
              <button
                onClick={() => setModalReportesAbierto(false)}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '2px solid #fff',
                  padding: '0.8rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  fontFamily: "'Poppins', sans-serif",
                  letterSpacing: '0.3px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                CERRAR DETALLE
              </button>
            </div>

            {/* Panel Derecho - Reportes */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '90vh' }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#999', fontWeight: '600', letterSpacing: '0.3px' }}>HISTORIAL DE REPORTES</p>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', fontWeight: '700', color: '#244d3b' }}>TRAZABILIDAD DE INCIDENCIAS</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontWeight: '600' }}>{usuarioSeleccionado.reportes} ENVIADOS</p>
              </div>

              {/* Lista de Reportes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(reportesPorUsuario[usuarioSeleccionado._id || ''] || []).map((reporte, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '0.6rem',
                      padding: '1rem',
                      backgroundColor: '#f9f9f9',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f9f9f9';
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          minWidth: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: reporte.severidad === 'ALTA' ? '#ff3333' : reporte.severidad === 'MEDIA' ? '#ff9800' : '#4caf50',
                          flexShrink: 0,
                        }}
                      >
                        <BsExclamationCircle size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#244d3b' }}>{reporte.titulo}</h4>
                          <span
                            style={{
                              backgroundColor: reporte.severidad === 'ALTA' ? '#ff3333' : reporte.severidad === 'MEDIA' ? '#ff9800' : '#4caf50',
                              color: '#fff',
                              padding: '0.3rem 0.7rem',
                              borderRadius: '0.3rem',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              letterSpacing: '0.3px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {reporte.severidad}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#999', textAlign: 'left' }}>ID: {reporte.id} • {reporte.fecha}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontWeight: '600', textAlign: 'left' }}>Operador: {reporte.operador}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              backgroundColor: reporte.estado === 'PENDIENTE' ? '#e3f2fd' : reporte.estado === 'EN REVISIÓN' ? '#fff3e0' : '#e8f5e9',
                              color: reporte.estado === 'PENDIENTE' ? '#1565a0' : reporte.estado === 'EN REVISIÓN' ? '#e65100' : '#2d7a47',
                              padding: '0.3rem 0.7rem',
                              borderRadius: '0.3rem',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {reporte.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar/Editar Usuario */}
      {modalAbierto && (
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
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={handleCerrarModal}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '0.8rem',
              padding: isMobile ? '1.5rem 1rem' : '2rem',
              maxWidth: isMobile ? '100%' : '500px',
              width: '100%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 1.5rem 0',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '700',
                color: '#244d3b',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {editandoId ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Nombre Completo */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Juan Pérez García"
                  {...register('nombreCompleto', {
                    required: 'El nombre es requerido',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    marginBottom: errors.nombreCompleto ? '0.3rem' : '0.8rem',
                    borderRadius: '0.5rem',
                    border: errors.nombreCompleto ? '2px solid #ff3333' : '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box',
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
                  {...register('dni', {
                    pattern: { value: /^\d{8}$|^$/, message: 'DNI debe tener 8 dígitos' },
                  })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    marginBottom: errors.dni ? '0.3rem' : '0.8rem',
                    borderRadius: '0.5rem',
                    border: errors.dni ? '2px solid #ff3333' : '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box',
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
                  {...register('telefono', {
                    required: 'El teléfono es requerido',
                    pattern: { value: /^\d{9}$/, message: 'Debe tener 9 dígitos' },
                  })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    marginBottom: errors.telefono ? '0.3rem' : '0.8rem',
                    borderRadius: '0.5rem',
                    border: errors.telefono ? '2px solid #ff3333' : '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
                {errors.telefono && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.telefono.message}</span>}
              </div>

              {/* Ubicación */}
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
                  Distrito / Zona
                </label>
                <input
                  type="text"
                  placeholder="Independencia, Lima"
                  {...register('ubicacion', {
                    required: 'La zona es requerida',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    marginBottom: errors.ubicacion ? '0.3rem' : suggestions.length > 0 ? '0rem' : '0.8rem',
                    borderRadius: '0.5rem',
                    border: errors.ubicacion ? '2px solid #ff3333' : '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box',
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
                        style={{
                          padding: '0.7rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: '#fff',
                          fontSize: '0.9rem',
                        }}
                        onMouseEnter={(e) => ((e.target as HTMLDivElement).style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => ((e.target as HTMLDivElement).style.backgroundColor = '#fff')}
                      >
                        {sug}
                      </div>
                    ))}
                  </div>
                )}
                {errors.ubicacion && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.ubicacion.message}</span>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="usuario@email.com"
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                  })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    marginBottom: errors.email ? '0.3rem' : '0.8rem',
                    borderRadius: '0.5rem',
                    border: errors.email ? '2px solid #ff3333' : '1px solid #ddd',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
                {errors.email && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.email.message}</span>}
              </div>

              {/* Contraseña */}
              {!editandoId && (
                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
                    Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 12 caracteres con números, mayúsculas y símbolos"
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: { value: 12, message: 'Mínimo 12 caracteres' },
                        validate: (value) => {
                          if (!/[A-Z]/.test(value)) return 'Debe contener mayúsculas';
                          if (!/[a-z]/.test(value)) return 'Debe contener minúsculas';
                          if (!/[0-9]/.test(value)) return 'Debe contener números';
                          if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return 'Debe contener símbolos';
                          return true;
                        },
                      })}
                      style={{
                        width: '100%',
                        padding: '0.7rem 2.5rem 0.7rem 0.7rem',
                        marginBottom: errors.password ? '0.3rem' : '0.8rem',
                        borderRadius: '0.5rem',
                        border: errors.password ? '2px solid #ff3333' : '1px solid #ddd',
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontFamily: "'Poppins', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.7rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                      }}
                    >
                      {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                    </button>
                  </div>
                  {errors.password && <span style={{ color: '#ff3333', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>⚠️ {errors.password.message}</span>}
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={handleCerrarModal}
                  style={{
                    flex: 1,
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    padding: '0.8rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  style={{
                    flex: 1,
                    backgroundColor: guardandoUsuario ? '#ccc' : '#244d3b',
                    color: '#fff',
                    border: 'none',
                    padding: '0.8rem',
                    borderRadius: '0.5rem',
                    cursor: guardandoUsuario ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {guardandoUsuario ? '⏳ Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          tr:hover .hover-buttons {
            opacity: 1 !important;
          }
        }
        
        @media (max-width: 767px) {
          .hover-buttons {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
