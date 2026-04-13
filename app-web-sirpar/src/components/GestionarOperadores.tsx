import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BsSearch, BsPlus, BsPencil, BsEye, BsEyeSlash, BsChevronLeft, BsChevronRight, BsPersonCircle, BsExclamationCircle, BsTrash } from 'react-icons/bs';
import { obtenerTodosUsuarios, obtenerTodosReportes, obtenerToken, actualizarUsuario, crearUsuarioAdmin, desasignarReporte } from '../utils/api';

interface Operador {
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

export function GestionarOperadores() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [reportesPorOperador, setReportesPorOperador] = useState<{ [key: string]: any[] }>({});
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
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<Operador | null>(null);
  const [guardandoOperador, setGuardandoOperador] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  const [modoAsignar, setModoAsignar] = useState(false);
  const [reportesDisponibles, setReportesDisponibles] = useState<any[]>([]);
  const [reportesSeleccionados, setReportesSeleccionados] = useState<Set<string>>(new Set());
  const [todosLosReportes, setTodosLosReportes] = useState<any[]>([]);
  const [eliminandoReporte, setEliminandoReporte] = useState<string | null>(null);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);
  const [reporteAConfirmar, setReporteAConfirmar] = useState<string | null>(null);
  const OPERADORES_POR_PAGINA = 10;

  // Cargar operadores y reportes al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener operadores
        const operadoresData = await obtenerTodosUsuarios();
        
        // Mapear operadores al formato esperado y filtrar solo operadores
        const operadoresMapeados = operadoresData
          .filter((o: any) => o.rol === 'operador')
          .map((o: any) => ({
            _id: o._id,
            nombreCompleto: o.nombre,
            nombre: o.nombre,
            dni: o.dni || 'N/A',
            telefono: o.telefono,
            ubicacion: o.zona,
            zona: o.zona,
            email: o.email,
            rol: o.rol,
            estado: '0/0 ATENDIDOS', // Se actualiza dinámicamente después de cargar reportes
            reportes: 0, // Se actualiza cuando se cargan los reportes
          }));

        // Obtener todos los reportes
        let reportesTodos: any[] = [];
        const token = obtenerToken();
        if (token) {
          try {
            reportesTodos = await obtenerTodosReportes();
          } catch (_err) {
            console.log('No se pudieron cargar los reportes con token, continuando sin ellos');
          }
        }

        // Guardar todos los reportes para luego filtrar por zona
        setTodosLosReportes(reportesTodos);

        // Agrupar reportes por operador asignado recorriendo cada operador
        const reportesPorOp: { [key: string]: any[] } = {};
        const resueltosPorOp: { [key: string]: number } = {};
        
        console.log('📋 Cargando reportes para cada operador');
        
        // Para cada operador, obtener sus reportes asignados usando el nuevo endpoint
        for (const operador of operadoresMapeados) {
          try {
            // Obtener reportes asignados a este operador desde el backend
            const response = await fetch(`http://localhost:5000/api/reports/admin/asignados/${operador._id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const reportesAsignados = data.reportes || [];
              
              console.log(`📊 Operador ${operador.nombreCompleto}: ${reportesAsignados.length} reportes asignados`);

              reportesPorOp[operador._id || ''] = [];
              resueltosPorOp[operador._id || ''] = 0;

              reportesAsignados.forEach((report: any) => {
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
                  resueltosPorOp[operador._id || '']++;
                }

                // Formatear fecha
                const fecha = new Date(report.fechas?.creado).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                // Generar ID de reporte
                const reportId = `REP-${report._id?.toString().slice(-4).toUpperCase()}` || `REP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                reportesPorOp[operador._id || ''].push({
                  _id: report._id,
                  id: reportId,
                  titulo: report.tipoIncidente === 'quema_ilegal' ? 'Quema ilegal' : report.tipoIncidente === 'acumulacion_residuos' ? 'Acumulación de residuos' : report.descripcion || 'Reporte Sin Título',
                  severidad,
                  fecha,
                  estado,
                  ciudadano: report.usuario?.nombre || 'Sin asignar',
                  descripcion: report.descripcion,
                  tipo: report.tipoIncidente,
                });
              });
            } else {
              console.log(`⚠️ No se pudo obtener reportes para operador ${operador.nombreCompleto}`);
              reportesPorOp[operador._id || ''] = [];
              resueltosPorOp[operador._id || ''] = 0;
            }
          } catch (err) {
            console.error(`❌ Error obteniendo reportes para ${operador.nombreCompleto}:`, err);
            reportesPorOp[operador._id || ''] = [];
            resueltosPorOp[operador._id || ''] = 0;
          }
        }

        // Actualizar el número de reportes y estado dinámico para cada operador
        operadoresMapeados.forEach((o: Operador) => {
          const operadorId = o._id || '';
          const totalReportes = reportesPorOp[operadorId]?.length || 0;
          const resueltos = resueltosPorOp[operadorId] || 0;
          
          o.reportes = totalReportes;
          o.estado = `${resueltos}/${totalReportes} ATENDIDOS`;
        });

        setOperadores(operadoresMapeados);
        setReportesPorOperador(reportesPorOp);
        setLoading(false);
      } catch (err: any) {
        console.error('Error cargando datos:', err);
        setError(err.message || 'Error al cargar datos');
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

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

  const operadoresFiltrados = operadores.filter((o) => {
    if (!filtrarDNI) return true;
    const nombre = (o.nombreCompleto || o.nombre || '').toLowerCase();
    return o.dni.toLowerCase().includes(filtrarDNI.toLowerCase()) || nombre.includes(filtrarDNI.toLowerCase());
  });

  const totalPages = Math.ceil(operadoresFiltrados.length / OPERADORES_POR_PAGINA);
  const operadoresPaginados = operadoresFiltrados.slice(
    (paginaActual - 1) * OPERADORES_POR_PAGINA,
    paginaActual * OPERADORES_POR_PAGINA
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
      setGuardandoOperador(true);
      
      if (editandoId) {
        // Actualizar operador en la BD
        const datosActualizacion = {
          nombre: data.nombreCompleto,
          telefono: data.telefono,
          zona: data.ubicacion,
          email: data.email,
        };

        await actualizarUsuario(editandoId, datosActualizacion);

        // Actualizar en el estado local
        setOperadores(operadores.map((o) => (o._id === editandoId ? { 
          ...o, 
          nombreCompleto: data.nombreCompleto,
          nombre: data.nombreCompleto,
          dni: data.dni,
          telefono: data.telefono,
          ubicacion: data.ubicacion,
          zona: data.ubicacion,
          email: data.email,
        } : o)));

        // Mostrar mensaje de éxito
        setMensajeNotificacion({
          tipo: 'exito',
          mensaje: '✅ Operador actualizado correctamente',
        });
      } else {
        // Crear nuevo operador en la BD
        if (!data.password) {
          throw new Error('La contraseña es requerida para registrar un nuevo operador');
        }

        const nuevoOperador = {
          nombre: data.nombreCompleto,
          email: data.email,
          password: data.password,
          dni: data.dni,
          telefono: data.telefono,
          zona: data.ubicacion,
          rol: 'operador', // Siempre operador en este componente
        };

        const respuesta = await crearUsuarioAdmin(nuevoOperador);

        // Agregar el nuevo operador a la lista
        setOperadores([...operadores, { 
          _id: respuesta.usuario.id,
          nombreCompleto: respuesta.usuario.nombre,
          nombre: respuesta.usuario.nombre,
          dni: respuesta.usuario.dni,
          telefono: respuesta.usuario.telefono,
          ubicacion: respuesta.usuario.zona,
          zona: respuesta.usuario.zona,
          email: respuesta.usuario.email,
          rol: 'operador',
          estado: '0 REPORTES',
          reportes: 0,
        }]);

        setMensajeNotificacion({
          tipo: 'exito',
          mensaje: '✅ Operador registrado correctamente en la BD',
        });
      }

      setGuardandoOperador(false);
      reset();
      setModalAbierto(false);
      setEditandoId(null);
      setSuggestions([]);
    } catch (err: any) {
      setGuardandoOperador(false);
      console.error('Error guardando operador:', err);
      setMensajeNotificacion({
        tipo: 'error',
        mensaje: `❌ Error: ${err.message || 'Error desconocido'}`,
      });
    }
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este operador?')) {
      setOperadores(operadores.filter((o) => o._id !== id));
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

  const handleEliminarReporte = (reportId: string) => {
    // Mostrar modal de confirmación
    setReporteAConfirmar(reportId);
    setModalConfirmacionAbierto(true);
  };

  const confirmarDesasignacion = async (reportId: string) => {
    try {
      setEliminandoReporte(reportId);
      await desasignarReporte(reportId);

      // Calcular los nuevos reportes ANTES de los setStates
      const nuevoReportesPorOperador = { ...reportesPorOperador };
      for (const operadorId in nuevoReportesPorOperador) {
        nuevoReportesPorOperador[operadorId] = nuevoReportesPorOperador[operadorId].filter((r: any) => r._id !== reportId);
      }

      // Actualizar estado del operador seleccionado y la tabla CON LOS REPORTES CALCULADOS
      if (operadorSeleccionado?._id) {
        const reportesActuales = nuevoReportesPorOperador[operadorSeleccionado._id] || [];
        const nuevoTotal = reportesActuales.length;
        const resueltos = reportesActuales.filter((r: any) => r.estado === 'RESUELTO').length || 0;
        
        setOperadorSeleccionado({
          ...operadorSeleccionado,
          reportes: nuevoTotal,
          estado: `${resueltos}/${nuevoTotal} ATENDIDOS`,
        });

        setOperadores(
          operadores.map((o) =>
            o._id === operadorSeleccionado._id
              ? { ...o, reportes: nuevoTotal, estado: `${resueltos}/${nuevoTotal} ATENDIDOS` }
              : o
          )
        );
      }

      // Actualizar la lista local de reportes
      setReportesPorOperador(nuevoReportesPorOperador);

      // Actualizar todosLosReportes para marcar como no asignado
      setTodosLosReportes((prevReportes) =>
        prevReportes.map((r: any) =>
          r._id.toString() === reportId ? { ...r, estaAsignado: false, operadorAsignado: null } : r
        )
      );

      setMensajeNotificacion({
        tipo: 'exito',
        mensaje: '✅ Reporte desasignado correctamente',
      });

      setEliminandoReporte(null);
      setModalConfirmacionAbierto(false);
      setReporteAConfirmar(null);
    } catch (err: any) {
      console.error('Error eliminando reporte:', err);
      setMensajeNotificacion({
        tipo: 'error',
        mensaje: `❌ Error: ${err.message || 'Error desconocido'}`,
      });
      setEliminandoReporte(null);
      setModalConfirmacionAbierto(false);
      setReporteAConfirmar(null);
    }
  };

  const getPorcentajeAsistencia = (_estado: string) => {
    // Función mantenida para compatibilidad pero no se usa actualmente
    // El porcentaje se calcula directamente en el mapa de operadores
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
          ⏳ Cargando operadores y reportes desde la base de datos...
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
            GESTIÓN DE OPERADORES
          </h2>
          <p style={{
            margin: '0.2rem 0 0 0',
            fontSize: isMobile ? '0.7rem' : '0.85rem',
            color: '#999',
            fontFamily: "'Poppins', sans-serif",
            lineHeight: isMobile ? '1.2' : '1.4',
          }}>
            CONTROL DE PERFILES Y TRAZABILIDAD DE REPORTES • {operadores.length} OPERADORES REGISTRADOS
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
          <BsPlus size={isMobile ? 16 : 18} /> {isMobile ? 'REGISTRAR' : 'REGISTRAR OPERADOR'}
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
              <th style={{ padding: isMobile ? '0.7rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{isMobile ? 'NOMBRE' : 'Nombre del Operador'}</th>
              {!isMobile && <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNI</th>}
              {!isMobile && <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zona Asignada</th>}
              <th style={{ padding: isMobile ? '0.7rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{isMobile ? 'REP.' : 'Cant. Reportes Asignados'}</th>
              <th style={{ padding: isMobile ? '0.7rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{isMobile ? 'AV.' : 'Avance'}</th>
              <th style={{ padding: isMobile ? '0.7rem 0.3rem' : '1rem', textAlign: 'center', fontWeight: '600', color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>ACC.</th>
            </tr>
          </thead>
          <tbody>
            {operadoresPaginados.length > 0 ? (
              operadoresPaginados.map((operador) => {
                // Calcular porcentaje de reportes resueltos
                const reportesOperador = reportesPorOperador[operador._id || ''] || [];
                const reportesResueltos = reportesOperador.filter((r) => r.estado === 'RESUELTO').length;
                const totalReportes = reportesOperador.length || 1;
                const porcentaje = totalReportes === 0 ? 0 : Math.round((reportesResueltos / totalReportes) * 100);
                
                return (
                  <tr
                    key={operador._id}
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
                    <td style={{ padding: isMobile ? '0.8rem 0.5rem' : '1.2rem 1rem', color: '#0d3a26', fontWeight: '600', fontSize: isMobile ? '0.75rem' : '0.95rem' }}>{isMobile ? (operador.nombreCompleto || operador.nombre || '').split(' ')[0] : (operador.nombreCompleto || operador.nombre)}</td>
                    {!isMobile && <td style={{ padding: '1.2rem 1rem', color: '#666', fontSize: '0.9rem' }}>{operador.dni}</td>}
                    {!isMobile && <td style={{ padding: '1.2rem 1rem', color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>{operador.ubicacion || operador.zona}</td>}
                    <td style={{ padding: isMobile ? '0.8rem 0.5rem' : '1.2rem 1rem', color: '#244d3b', fontWeight: '600', fontSize: isMobile ? '0.75rem' : '0.95rem' }}>{operador.reportes}</td>
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
                            setOperadorSeleccionado(operador);
                            setModoAsignar(false);
                            setReportesSeleccionados(new Set());
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
                          <BsEye size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> VER ASIGNADOS
                        </button>}
                        <button
                          onClick={() => {
                            setEditandoId(operador._id || null);
                            reset(operador);
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
                  No hay operadores que coincidan con el filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.8rem' : 0, marginBottom: '2rem' }}>
        <p style={{ margin: 0, fontSize: isMobile ? '0.65rem' : '0.85rem', color: '#999', fontFamily: "'Poppins', sans-serif", textAlign: isMobile ? 'center' : 'left' }}>
          {isMobile ? 'PÁG' : 'MOSTRANDO'} {(paginaActual - 1) * OPERADORES_POR_PAGINA + 1}-{Math.min(paginaActual * OPERADORES_POR_PAGINA, operadoresFiltrados.length)} {isMobile ? '/' : 'DE'} {operadoresFiltrados.length}
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

      {/* Modal Confirmación Desasignar Reporte */}
      {modalConfirmacionAbierto && (
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
            zIndex: 2000,
            padding: '1rem',
          }}
          onClick={() => {
            setModalConfirmacionAbierto(false);
            setReporteAConfirmar(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '0.8rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <BsExclamationCircle size={32} color='#ff9800' style={{ flexShrink: 0, marginTop: '0.2rem' }} />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#244d3b' }}>
                  Desasignar Reporte
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                  ¿Estás seguro de que deseas desasignar este reporte? Podrá ser asignado a otro operador.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setModalConfirmacionAbierto(false);
                  setReporteAConfirmar(null);
                }}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.9rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (reporteAConfirmar) {
                    confirmarDesasignacion(reporteAConfirmar);
                  }
                }}
                disabled={eliminandoReporte !== null}
                style={{
                  backgroundColor: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: eliminandoReporte !== null ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.9rem',
                  opacity: eliminandoReporte !== null ? 0.6 : 1,
                }}
              >
                {eliminandoReporte ? '⏳ Desasignando...' : 'Desasignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Reportes */}
      {modalReportesAbierto && operadorSeleccionado && (
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
          onClick={() => {
            setModalReportesAbierto(false);
            setModoAsignar(false);
            setReportesSeleccionados(new Set());
          }}
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
            {/* Panel Izquierdo - Info Operador */}
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
                {operadorSeleccionado.nombreCompleto || operadorSeleccionado.nombre}
              </h4>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: '#b3d9cc', textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px' }}>
                OPERADOR VERIFICADO
              </p>
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.75rem', color: '#b3d9cc', letterSpacing: '0.3px' }}>DNI</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{operadorSeleccionado.dni}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.75rem', color: '#b3d9cc', letterSpacing: '0.3px' }}>ZONA ASIGNADA</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{operadorSeleccionado.ubicacion}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModoAsignar(!modoAsignar);
                  if (!modoAsignar) {
                    // Cargar reportes disponibles para esta zona desde el backend
                    const cargarReportesDisponibles = async () => {
                      try {
                        const token = obtenerToken();
                        const zonaCompleta = operadorSeleccionado?.ubicacion || '';
                        
                        if (!zonaCompleta) {
                          console.error('❌ Error: El operador no tiene zona asignada');
                          setMensajeNotificacion({
                            tipo: 'error',
                            mensaje: '⚠️ El operador no tiene zona asignada',
                          });
                          return;
                        }

                        // Extraer el distrito: tomar el último valor después de la última coma
                        // Ejemplo: "Lima, Lima, Independencia" -> "Independencia"
                        const partesZona = zonaCompleta.split(',').map(parte => parte.trim());
                        const distritoOperador = partesZona[partesZona.length - 1];

                        console.log('🔍 Datos de zona del operador:', {
                          zonaCompleta,
                          partes: partesZona,
                          distritoExtraído: distritoOperador,
                        });

                        console.log(`📍 Consultando reportes de usuarios con zona: ${distritoOperador}`);
                        
                        const response = await fetch(
                          `http://localhost:5000/api/reports/admin/disponibles?zona=${encodeURIComponent(zonaCompleta)}`,
                          {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Error obteniendo reportes disponibles');
                        }

                        const data = await response.json();
                        const reportesDisponibles = data.reportes || [];

                        console.log('📊 Reportes encontrados de usuarios en zona:', {
                          distritoOperador,
                          cantidad: reportesDisponibles.length,
                          detalles: reportesDisponibles.map((r: any) => ({
                            id: r._id,
                            titulo: r.descripcion || 'Sin título',
                            usuarioNombre: r.usuario?.nombre,
                            incidenciUbicacion: r.ubicacion?.distrito,
                            estado: r.estado,
                          })),
                        });

                        // Mapear reportes disponibles al formato esperado
                        const reportesMapeados = reportesDisponibles.map((r: any) => {
                          const severidadMap: { [key: string]: string } = {
                            'bajo': 'BAJA',
                            'medio': 'MEDIA',
                            'alto': 'ALTA',
                          };

                          const estadoMap: { [key: string]: string } = {
                            'pendiente': 'PENDIENTE',
                            'en_proceso': 'EN REVISIÓN',
                            'resuelto': 'RESUELTO',
                          };

                          const severidad = severidadMap[r.nivelFinal || r.nivelCalculado || 'medio'];
                          const estado = estadoMap[r.estado] || 'PENDIENTE';
                          const fecha = new Date(r.fechas?.creado).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          });
                          const reportId = `REP-${r._id?.toString().slice(-4).toUpperCase()}` || `REP-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                          return {
                            _id: r._id,
                            id: reportId,
                            titulo: r.tipoIncidente === 'quema_ilegal' ? 'Quema ilegal' : r.tipoIncidente === 'acumulacion_residuos' ? 'Acumulación de residuos' : r.descripcion || 'Reporte Sin Título',
                            severidad,
                            fecha,
                            estado,
                            ciudadano: r.usuario?.nombre || 'Sin asignar',
                            descripcion: r.descripcion,
                            tipo: r.tipoIncidente,
                          };
                        });

                        setReportesDisponibles(reportesMapeados);
                        setReportesSeleccionados(new Set());

                        if (reportesMapeados.length === 0) {
                          console.warn(`⚠️ No hay reportes de usuarios dentro de la zona: ${distritoOperador}`);
                          setMensajeNotificacion({
                            tipo: 'error',
                            mensaje: `⚠️ No hay reportes de usuarios en: ${distritoOperador}`,
                          });
                        } else {
                          setMensajeNotificacion({
                            tipo: 'exito',
                            mensaje: `✅ ${reportesMapeados.length} reporte(s) disponible(s) en ${distritoOperador}`,
                          });
                        }
                      } catch (err) {
                        console.error('❌ Error cargando reportes disponibles:', err);
                        setMensajeNotificacion({
                          tipo: 'error',
                          mensaje: `❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
                        });
                      }
                    };

                    cargarReportesDisponibles();
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: modoAsignar ? '#4caf50' : 'transparent',
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
                  marginBottom: '0.8rem',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = modoAsignar ? '#45a049' : 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = modoAsignar ? '#4caf50' : 'transparent';
                }}
              >
                {modoAsignar ? '✓ CANCELAR' : 'ASIGNAR REPORTES'}
              </button>

              <button
                onClick={() => {
                  setModalReportesAbierto(false);
                  setModoAsignar(false);
                  setReportesSeleccionados(new Set());
                }}
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
              {!modoAsignar ? (
                <>
                  {/* Vista: Reportes Asignados */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#999', fontWeight: '600', letterSpacing: '0.3px' }}>REPORTES DEL OPERADOR</p>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', fontWeight: '700', color: '#244d3b' }}>REPORTES ASIGNADOS</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontWeight: '600' }}>{operadorSeleccionado.reportes} REPORTES ASIGNADOS</p>
                  </div>

                  {/* Lista de Reportes Asignados */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(reportesPorOperador[operadorSeleccionado._id || ''] || []).length === 0 ? (
                      <div
                        style={{
                          border: '2px dashed #ccc',
                          borderRadius: '0.6rem',
                          padding: '2rem',
                          textAlign: 'center',
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontWeight: '600' }}>
                          Sin reportes asignados aún. ¡Asigna algunos usando el botón "ASIGNAR REPORTES"!
                        </p>
                      </div>
                    ) : (
                      (reportesPorOperador[operadorSeleccionado._id || ''] || []).map((reporte, idx) => (
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
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.5rem',
                                backgroundColor: '#e8f5e9',
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
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontWeight: '600', textAlign: 'left' }}>Ciudadano: {reporte.ciudadano}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
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
                                <button
                                  onClick={() => handleEliminarReporte(reporte._id)}
                                  disabled={eliminandoReporte === reporte._id}
                                  style={{
                                    backgroundColor: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.3rem 0.7rem',
                                    borderRadius: '0.3rem',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    cursor: eliminandoReporte === reporte._id ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    whiteSpace: 'nowrap',
                                    opacity: eliminandoReporte === reporte._id ? 0.7 : 1,
                                  }}
                                >
                                  <BsTrash size={12} /> DESASIGNAR
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Vista: Asignar Reportes */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#999', fontWeight: '600', letterSpacing: '0.3px' }}>ZONA: {operadorSeleccionado.ubicacion}</p>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', fontWeight: '700', color: '#244d3b' }}>REPORTES DISPONIBLES</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontWeight: '600' }}>
                      {reportesDisponibles.length} reportes en tu zona
                    </p>
                  </div>

                  {/* Lista de Reportes con Checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {reportesDisponibles.length === 0 ? (
                      <div
                        style={{
                          border: '2px dashed #ccc',
                          borderRadius: '0.6rem',
                          padding: '2rem',
                          textAlign: 'center',
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontWeight: '600' }}>
                          No hay reportes disponibles en tu zona para asignar.
                        </p>
                      </div>
                    ) : (
                      reportesDisponibles.map((reporte, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: reportesSeleccionados.has(reporte._id) ? '2px solid #4caf50' : '1px solid #e0e0e0',
                            borderRadius: '0.6rem',
                            padding: '1rem',
                            backgroundColor: reportesSeleccionados.has(reporte._id) ? '#f1f8f4' : '#f9f9f9',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'flex-start',
                          }}
                          onClick={() => {
                            const newSet = new Set(reportesSeleccionados);
                            if (newSet.has(reporte._id)) {
                              newSet.delete(reporte._id);
                            } else {
                              newSet.add(reporte._id);
                            }
                            setReportesSeleccionados(newSet);
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={reportesSeleccionados.has(reporte._id)}
                            onChange={() => {
                              const newSet = new Set(reportesSeleccionados);
                              if (newSet.has(reporte._id)) {
                                newSet.delete(reporte._id);
                              } else {
                                newSet.add(reporte._id);
                              }
                              setReportesSeleccionados(newSet);
                            }}
                            style={{
                              cursor: 'pointer',
                              width: '20px',
                              height: '20px',
                              marginTop: '0.5rem',
                              flexShrink: 0,
                            }}
                          />
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
                              <span
                                style={{
                                  display: 'inline-block',
                                  backgroundColor: reporte.estado === 'RESUELTO' ? '#4caf50' : reporte.estado === 'EN REVISIÓN' ? '#ff9800' : '#e3f2fd',
                                  color: reporte.estado === 'RESUELTO' ? '#fff' : reporte.estado === 'EN REVISIÓN' ? '#fff' : '#1976d2',
                                  padding: '0.3rem 0.7rem',
                                  borderRadius: '0.3rem',
                                  fontSize: '0.65rem',
                                  fontWeight: '700',
                                  letterSpacing: '0.3px',
                                  width: 'fit-content',
                                }}
                              >
                                {reporte.estado}
                              </span>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontWeight: '600', textAlign: 'left' }}>Ciudadano: {reporte.ciudadano}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Botón Confirmar Asignación */}
                  {reportesDisponibles.length > 0 && (
                    <button
                      onClick={async () => {
                        if (reportesSeleccionados.size === 0) {
                          setMensajeNotificacion({
                            tipo: 'error',
                            mensaje: '❌ Debes seleccionar al menos un reporte',
                          });
                          return;
                        }

                        try {
                          setGuardandoOperador(true);
                          const token = obtenerToken();
                          
                          // Llamar API para asignar los reportes
                          const response = await fetch('http://localhost:5000/api/reports/assign', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              operadorId: operadorSeleccionado._id,
                              reportIds: Array.from(reportesSeleccionados),
                            }),
                          });

                          if (!response.ok) {
                            throw new Error('Error al asignar reportes');
                          }

                          // Recargar datos
                          setModoAsignar(false);
                          setReportesSeleccionados(new Set());

                          // Mostrar notificación de éxito
                          setMensajeNotificacion({
                            tipo: 'exito',
                            mensaje: `✅ ${reportesSeleccionados.size} reportes asignados correctamente`,
                          });

                          // Recargar operadores y reportes
                          try {
                            const usersResponse = await fetch('http://localhost:5000/api/auth/usuarios', {
                              headers: { 'Authorization': `Bearer ${token}` },
                            });
                            const usersData = await usersResponse.json();
                            // Extraer el array de usuarios del objeto de respuesta
                            const usuarios = usersData.usuarios || usersData;
                            const operadoresFiltrados = (Array.isArray(usuarios) ? usuarios : [])
                              .filter((o: any) => o.rol === 'operador')
                              .map((o: any) => ({
                                _id: o._id,
                                nombreCompleto: o.nombre,
                                nombre: o.nombre,
                                dni: o.dni || 'N/A',
                                telefono: o.telefono,
                                ubicacion: o.zona,
                                zona: o.zona,
                                email: o.email,
                                rol: o.rol,
                                estado: '0/0 ATENDIDOS',
                                reportes: 0,
                              }));

                            const reportesResponse = await fetch('http://localhost:5000/api/reports/admin/todos', {
                              headers: { 'Authorization': `Bearer ${token}` },
                            });
                            const reportesDataResponse = await reportesResponse.json();
                            const reportesData = reportesDataResponse.reportes || [];
                            setTodosLosReportes(reportesData);

                            // Reagrupar reportes - solo incluir asignados (verificado en backend contra colección Assign)
                            const nuevoGrupo: { [key: string]: any[] } = {};
                            const resueltosPorOp: { [key: string]: number } = {};
                            
                            reportesData.forEach((report: any) => {
                              // Verificar que esté asignado usando el flag del backend
                              if (!report.estaAsignado) {
                                return; // No está asignado, no incluir
                              }

                              const operadorId = report.operadorAsignado?.id?._id || report.operadorAsignado?._id;
                              if (operadorId) {
                                if (!nuevoGrupo[operadorId]) {
                                  nuevoGrupo[operadorId] = [];
                                  resueltosPorOp[operadorId] = 0;
                                }
                                
                                // Contar si está resuelto
                                if (report.estado === 'resuelto') {
                                  resueltosPorOp[operadorId]++;
                                }
                                
                                nuevoGrupo[operadorId].push({
                                  _id: report._id,
                                  id: `REP-${report._id?.toString().slice(-4).toUpperCase()}`,
                                  titulo: report.tipoIncidente === 'quema_ilegal' ? 'Quema ilegal' : report.tipoIncidente === 'acumulacion_residuos' ? 'Acumulación de residuos' : report.descripcion || 'Reporte Sin Título',
                                  severidad: (report.nivelFinal || report.nivelCalculado) === 'bajo' ? 'BAJA' : (report.nivelFinal || report.nivelCalculado) === 'medio' ? 'MEDIA' : 'ALTA',
                                  estado: report.estado === 'pendiente' ? 'PENDIENTE' : report.estado === 'en_proceso' ? 'EN REVISIÓN' : 'RESUELTO',
                                  fecha: new Date(report.fechas?.creado).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                                  ciudadano: report.usuario?.nombre || 'Desconocido',
                                  descripcion: report.descripcion,
                                  tipo: report.tipoIncidente,
                                });
                              }
                            });
                            
                            // Actualizar estado de operadores con conteos reales
                            const operadoresActualizados = operadoresFiltrados.map((o: any) => {
                              const totalReportes = nuevoGrupo[o._id]?.length || 0;
                              const resueltos = resueltosPorOp[o._id] || 0;
                              return {
                                ...o,
                                reportes: totalReportes,
                                estado: `${resueltos}/${totalReportes} ATENDIDOS`,
                              };
                            });
                            
                            setOperadores(operadoresActualizados);
                            setReportesPorOperador(nuevoGrupo);
                            
                            // Actualizar el operador seleccionado en el modal
                            if (operadorSeleccionado?._id) {
                              const operadorActualizado = operadoresActualizados.find(op => op._id === operadorSeleccionado._id);
                              if (operadorActualizado) {
                                setOperadorSeleccionado(operadorActualizado);
                              }
                            }
                          } catch (_err) {
                            console.log('Error al recargar datos');
                          }
                        } catch (err) {
                          console.error('Error:', err);
                          setMensajeNotificacion({
                            tipo: 'error',
                            mensaje: '❌ Error al asignar reportes',
                          });
                        } finally {
                          setGuardandoOperador(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        cursor: guardandoOperador ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        fontFamily: "'Poppins', sans-serif",
                        letterSpacing: '0.3px',
                        transition: 'all 0.2s ease',
                        opacity: guardandoOperador ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!guardandoOperador) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#45a049';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!guardandoOperador) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#4caf50';
                        }
                      }}
                      disabled={guardandoOperador}
                    >
                      {guardandoOperador ? '⏳ ASIGNANDO...' : `✓ CONFIRMAR ${reportesSeleccionados.size} TAREA${reportesSeleccionados.size !== 1 ? 'S' : ''}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar/Editar Operador */}
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
              {editandoId ? 'Editar Operador' : 'Agregar Nuevo Operador'}
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
                  DNI (Requerido)
                </label>
                <input
                  type="text"
                  placeholder="12345678"
                  {...register('dni', {
                    required: 'El DNI es requerido',
                    pattern: { value: /^\d{8}$/, message: 'DNI debe tener exactamente 8 dígitos' },
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

              {/* Zona Asignada */}
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#464251', fontFamily: "'Poppins', sans-serif" }}>
                  Zona Asignada
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
                  placeholder="operador@email.com"
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
                  disabled={guardandoOperador}
                  style={{
                    flex: 1,
                    backgroundColor: guardandoOperador ? '#ccc' : '#244d3b',
                    color: '#fff',
                    border: 'none',
                    padding: '0.8rem',
                    borderRadius: '0.5rem',
                    cursor: guardandoOperador ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {guardandoOperador ? '⏳ Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Operador')}
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
