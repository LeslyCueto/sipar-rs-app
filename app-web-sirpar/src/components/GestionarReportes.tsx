import { useState, useEffect } from 'react';
import { BsDownload, BsEye, BsArrowRight, BsTable, BsCheckCircle } from 'react-icons/bs';
import Swal from 'sweetalert2';
import { obtenerUsuarioActual } from '../utils/api';

interface Reporte {
  _id: string;
  usuario?: {
    nombre: string;
  };
  anonimo?: boolean;
  ubicacion?: {
    distrito: string;
    direccion: string;
  };
  operador?: {
    nombre: string;
  };
  operadorAsignado?: {
    nombre: string;
  };
  nivelPercibido?: string;
  nivelCalculado?: string;
  estado?: string;
  tipoIncidente?: string;
  descripcion?: string;
  fechas?: {
    creado: string;
    resuelto?: string;
  };
  imagenes?: Array<{
    url: string;
    nombre?: string;
    tipo?: string;
    fecha?: string;
  }>;
}

interface GestionarReportesProps {
  isVisible?: boolean;
}

export function GestionarReportes({ isVisible = true }: GestionarReportesProps) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchId, setSearchId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null);
  const [riesgoRealSeleccionado, setRiesgoRealSeleccionado] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'mios'>('todos');
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar reportes cuando el componente es visible (cuando cambias de tab)
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const cargarReportes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/reports/admin/todos', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error cargando reportes');
        }

        const result = await response.json();
        const reportesData = result.reportes || [];
        console.log('✅ Reportes cargados:', reportesData.length);
        console.log('🖼️ Primer reporte:', reportesData[0]);
        console.log('🖼️ Imagenes del primer reporte:', reportesData[0]?.imagenes);
        setReportes(reportesData);
      } catch (err) {
        console.error('Error cargando reportes:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarReportes();
  }, [isVisible]);

  // Cargar operadores
  const cargarOperadores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/usuarios?rol=operador', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error cargando operadores');
      }

      const result = await response.json();
      const operadoresData = result.usuarios || result.data || [];
      setOperadores(operadoresData);
      return operadoresData;
    } catch (err) {
      console.error('Error cargando operadores:', err);
      return [];
    }
  };

  // Función para descargar reportes en Excel
  const descargarReportesExcel = async () => {
    try {
      if (reportesFiltrados.length === 0) {
        alert('No hay reportes para descargar');
        return;
      }

      // Importar XLSX dinámicamente
      const XLSX = await import('xlsx');

      // Preparar datos para el Excel
      const datosExcel = reportesFiltrados.map((reporte) => ({
        'ID Reporte': reporte._id || '',
        'Usuario Nombre': reporte.usuario?.nombre || (reporte.anonimo ? 'Anónimo' : ''),
        'Tipo Incidente': reporte.tipoIncidente || '',
        'Descripción': reporte.descripcion || '',
        'Distrito': reporte.ubicacion?.distrito || '',
        'Dirección': reporte.ubicacion?.direccion || '',
        'Operador': reporte.operador?.nombre || reporte.operadorAsignado?.nombre || 'Sin asignar',
        'Nivel Percibido': reporte.nivelPercibido || '',
        'Nivel Real': reporte.nivelCalculado || '',
        'Estado': reporte.estado || '',
        'Fecha Creado': reporte.fechas?.creado ? new Date(reporte.fechas.creado).toLocaleString('es-ES') : '',
      }));

      // Crear libro de trabajo
      const ws = XLSX.utils.json_to_sheet(datosExcel);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 25 }, // ID Reporte
        { wch: 18 }, // Usuario Nombre
        { wch: 18 }, // Tipo Incidente
        { wch: 30 }, // Descripción
        { wch: 15 }, // Distrito
        { wch: 30 }, // Dirección
        { wch: 20 }, // Operador
        { wch: 16 }, // Nivel Percibido
        { wch: 15 }, // Nivel Real
        { wch: 15 }, // Estado
        { wch: 20 }, // Fecha Creado
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Incidentes');

      // Descargar archivo
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      XLSX.writeFile(wb, `Incidentes_${fecha}.xlsx`);
    } catch (err) {
      console.error('Error descargando reportes:', err);
      alert('Error al descargar reportes');
    }
  };

  // Función para obtener el color del nivel de riesgo
  const getNivelColor = (nivel?: string) => {
    switch (nivel?.toLowerCase()) {
      case 'alto':
        return '#c33';
      case 'medio':
        return '#ffd700';
      case 'bajo':
        return '#2d7a47';
      default:
        return '#999';
    }
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado?: string) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return '#ff9800';
      case 'en_proceso':
      case 'en proceso':
        return '#1565a0';
      case 'resuelto':
        return '#27ae60';
      default:
        return '#999';
    }
  };

  // Función para formatear el ID del reporte
  const formatearIdReporte = (id: string) => {
    return `REP-${id?.toString().slice(-4).toUpperCase()}`;
  };

  // Función para abrir el modal de evaluación
  const abrirModalEvaluacion = (reporte: Reporte) => {
    setReporteSeleccionado(reporte);
    setRiesgoRealSeleccionado('');
    setModalAbierto(true);
  };

  // Función para actualizar el reporte como resuelto
  const marcarComoResuelto = async () => {
    if (!reporteSeleccionado || !riesgoRealSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Por favor selecciona un nivel de riesgo real',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2d7a47',
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: '¿Confirmar resolución?',
      html: `¿Estás seguro de que deseas marcar este incidente como <strong>resuelto</strong> con riesgo <strong>${riesgoRealSeleccionado.toUpperCase()}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2d7a47',
      cancelButtonColor: '#999',
    });

    if (!result.isConfirmed) return;

    try {
      setActualizando(true);

      const response = await fetch(
        `http://localhost:5000/api/reports/${reporteSeleccionado._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            estado: 'resuelto',
            nivelCalculado: riesgoRealSeleccionado,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error actualizando reporte');
      }

      // Actualizar la lista de reportes localmente
      setReportes(
        reportes.map((r) =>
          r._id === reporteSeleccionado._id
            ? {
                ...r,
                estado: 'resuelto',
                nivelCalculado: riesgoRealSeleccionado,
                fechas: {
                  creado: r.fechas?.creado || new Date().toISOString(),
                  resuelto: new Date().toISOString(),
                },
              }
            : r
        )
      );

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Incidente marcado como resuelto exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2d7a47',
      });
      setModalAbierto(false);
      setReporteSeleccionado(null);
      setRiesgoRealSeleccionado('');
    } catch (err) {
      console.error('Error actualizando reporte:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el reporte',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2d7a47',
      });
    } finally {
      setActualizando(false);
    }
  };

  // Función para delegar un reporte
  const abrirModalDelegar = async (reporte: Reporte) => {
    try {
      const operadoresData = operadores.length > 0 ? operadores : await cargarOperadores();
      
      if (operadoresData.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin operadores',
          text: 'No hay operadores disponibles para asignar',
          confirmButtonColor: '#2d7a47',
        });
        return;
      }

      const { value: operadorSeleccionado } = await Swal.fire({
        title: 'DELEGAR REPORTE',
        html: `
          <div style="text-align: left; margin: 1rem 0;">
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
              Selecciona un operador para asignar este incidente:
            </p>
            <select id="operadorSelect" style="width: 100%; padding: 0.6rem; border: 1px solid #e0e0e0; border-radius: 0.3rem; font-family: 'Poppins', sans-serif; font-size: 0.9rem;">
              <option value="">-- Selecciona un operador --</option>
              ${operadoresData.map((op: any) => `<option value="${op._id}">${op.nombre}</option>`).join('')}
            </select>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2d7a47',
        cancelButtonColor: '#e0e0e0',
        confirmButtonText: 'Asignar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const select = document.getElementById('operadorSelect') as HTMLSelectElement;
          if (select) {
            select.value = '';
          }
        },
        preConfirm: () => {
          const select = document.getElementById('operadorSelect') as HTMLSelectElement;
          if (!select.value) {
            Swal.showValidationMessage('Por favor selecciona un operador');
            return null;
          }
          return select.value;
        },
      });

      if (operadorSeleccionado) {
        const operador = operadoresData.find((op: any) => op._id === operadorSeleccionado);
        const nombreOperador = operador?.nombre || 'Desconocido';

        const { isConfirmed } = await Swal.fire({
          title: '¿Confirmar asignación?',
          text: `¿Deseas asignar este incidente a ${nombreOperador}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#2d7a47',
          cancelButtonColor: '#e0e0e0',
          confirmButtonText: 'Confirmar',
          cancelButtonText: 'Cancelar',
        });

        if (isConfirmed) {
          await delegarReporte(reporte._id, operadorSeleccionado, nombreOperador);
        }
      }
    } catch (err) {
      console.error('Error en delegar:', err);
    }
  };

  // Función para actualizar el reporte con el nuevo operador
  const delegarReporte = async (reporteId: string, operadorId: string, nombreOperador: string) => {
    try {
      setActualizando(true);

      const response = await fetch(
        `http://localhost:5000/api/reports/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            operadorId: operadorId,
            reportIds: [reporteId],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error delegando reporte');
      }

      const result = await response.json();
      console.log('✅ Respuesta del servidor:', result);

      // Actualizar la lista de reportes localmente
      setReportes(
        reportes.map((r) =>
          r._id === reporteId
            ? {
                ...r,
                operador: { nombre: nombreOperador },
                operadorAsignado: { nombre: nombreOperador },
              }
            : r
        )
      );

      Swal.fire({
        icon: 'success',
        title: '¡Asignación exitosa!',
        text: `Reporte asignado a ${nombreOperador}`,
        confirmButtonColor: '#2d7a47',
      });
    } catch (err) {
      console.error('Error delegando reporte:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'No se pudo asignar el reporte',
        confirmButtonColor: '#2d7a47',
      });
    } finally {
      setActualizando(false);
    }
  };

  // Filtrar reportes por ID y por tab
  const reportesFiltrados = reportes.filter((reporte) => {
    // Filtro por búsqueda ID
    const cumpleFiltroId = reporte._id.toLowerCase().includes(searchId.toLowerCase()) ||
      formatearIdReporte(reporte._id).toLowerCase().includes(searchId.toLowerCase());
    
    // Filtro por tab
    if (activeTab === 'mios') {
      const usuarioActual = obtenerUsuarioActual();
      const operadorAsignado = reporte.operador?.nombre || reporte.operadorAsignado?.nombre;
      const esAsignadoAlUsuario = usuarioActual?.nombre === operadorAsignado;
      return cumpleFiltroId && esAsignadoAlUsuario;
    }
    
    // Tab 'todos' - mostrar todos los que pasen el filtro de ID
    return cumpleFiltroId;
  });

  // Calcular paginación
  const totalPages = Math.ceil(reportesFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const reportesPaginados = reportesFiltrados.slice(startIndex, endIndex);

  // Resetear a página 1 cuando se busca
  const handleSearch = (value: string) => {
    setSearchId(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
        Cargando reportes...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        gap: isMobile ? '1rem' : 0,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <div style={{ margin: 0 }}>
          <h2 style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '700',
            color: '#0d3a26',
            fontFamily: "'Poppins', sans-serif",
            margin: 0,
          }}>
            INCIDENTES REGISTRADOS
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: '#b0b0b0',
            margin: '0.3rem 0 0 0',
            fontFamily: "'Poppins', sans-serif",
            textAlign: 'left',
          }}>
            Total: {reportesFiltrados.length} incidente{reportesFiltrados.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={descargarReportesExcel}
          style={{
            backgroundColor: '#2d7a47',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
          }}
        >
          <BsDownload size={16} />
          EXPORTAR
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e0e0e0',
      }}>
        <button
          onClick={() => {
            setActiveTab('todos');
            setCurrentPage(1);
          }}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'todos' ? '3px solid #2d7a47' : '3px solid transparent',
            color: activeTab === 'todos' ? '#2d7a47' : '#999',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: activeTab === 'todos' ? '700' : '600',
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            marginBottom: '-2px',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'todos') {
              (e.currentTarget as HTMLButtonElement).style.color = '#2d7a47';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'todos') {
              (e.currentTarget as HTMLButtonElement).style.color = '#999';
            }
          }}
        >
          <BsTable size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          TODOS LOS REPORTES
        </button>

        <button
          onClick={() => {
            setActiveTab('mios');
            setCurrentPage(1);
          }}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'mios' ? '3px solid #2d7a47' : '3px solid transparent',
            color: activeTab === 'mios' ? '#2d7a47' : '#999',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: activeTab === 'mios' ? '700' : '600',
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            marginBottom: '-2px',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'mios') {
              (e.currentTarget as HTMLButtonElement).style.color = '#2d7a47';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'mios') {
              (e.currentTarget as HTMLButtonElement).style.color = '#999';
            }
          }}
        >
          <BsCheckCircle size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          MIS REPORTES ASIGNADOS
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.5rem',
      }}>
        <input
          type="text"
          placeholder="Buscar por ID de reporte..."
          value={searchId}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            fontFamily: "'Poppins', sans-serif",
            outline: 'none',
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = '#2d7a47';
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = '#e0e0e0';
          }}
        />
      </div>

      {/* Table */}
      {isMobile ? (
        // Mobile view - Cards
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reportesPaginados.map((reporte) => (
            <div
              key={reporte._id}
              style={{
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: '0.5rem',
                padding: '1rem',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.75rem',
                color: '#2d7a47',
                fontWeight: '700',
                marginBottom: '0.8rem',
                backgroundColor: '#e8f5e9',
                border: '1px solid #a5d6a7',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.3rem',
                width: 'fit-content',
              }}>
                {formatearIdReporte(reporte._id)}
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: '#999', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', fontWeight: '600' }}>
                  INFORMACIÓN BÁSICA
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#0d3a26', fontFamily: "'Poppins', sans-serif" }}>
                  {reporte.usuario?.nombre || (reporte.anonimo ? 'Anónimo' : 'Sin nombre')}
                </p>
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: '#999', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', fontWeight: '600' }}>
                  UBICACIÓN
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#0d3a26', fontFamily: "'Poppins', sans-serif" }}>
                  {reporte.ubicacion?.distrito || 'Sin ubicación'}
                </p>
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: '#999', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', fontWeight: '600' }}>
                  OPERADOR
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#2d7a47', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>
                  {reporte.operador?.nombre || reporte.operadorAsignado?.nombre || 'SIN ASIGNAR'}
                </p>
              </div>

              <div style={{ marginBottom: '0.8rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: '#999', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', fontWeight: '600' }}>
                    RIESGO
                  </p>
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: getNivelColor(reporte.nivelCalculado),
                    color: '#fff',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '0.3rem',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {reporte.nivelCalculado?.toUpperCase() || 'SIN INFO'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: '#999', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', fontWeight: '600' }}>
                    ESTADO
                  </p>
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: '#fff',
                    color: getEstadoColor(reporte.estado),
                    border: `1px solid ${getEstadoColor(reporte.estado)}`,
                    padding: '0.3rem 0.8rem',
                    borderRadius: '0.3rem',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {reporte.estado?.toUpperCase() || 'SIN ESTADO'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => abrirModalEvaluacion(reporte)}
                  style={{
                  flex: 1,
                  backgroundColor: 'rgba(13, 58, 38, 0.1)',
                  color: '#0d3a26',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}>
                  <BsEye size={14} /> DETALLES
                </button>
                <button
                  onClick={() => abrirModalDelegar(reporte)}
                  style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  color: '#ff9800',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}>
                  <BsArrowRight size={14} /> DELEGAR
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop view - Table
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'Poppins', sans-serif",
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  ID REPORTE
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  INFORMACIÓN BÁSICA
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  UBICACIÓN
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  OPERADOR
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  RIESGO PERCIBIDO
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  ESTADO
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                }}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {reportesPaginados.map((reporte) => (
                <tr
                  key={reporte._id}
                  style={{
                    borderBottom: '1px solid #e0e0e0',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fff';
                  }}
                >
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#0d3a26',
                    fontFamily: "'Courier New', monospace",
                    fontWeight: '600',
                  }}>
                    {formatearIdReporte(reporte._id)}
                  </td>
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#0d3a26',
                  }}>
                    <p style={{ margin: 0, fontWeight: '600', marginBottom: '0.2rem' }}>
                      {reporte.usuario?.nombre || (reporte.anonimo ? 'Anónimo' : 'Sin nombre')}
                    </p>
                  </td>
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                    color: '#0d3a26',
                  }}>
                    <p style={{ margin: 0, marginBottom: '0.2rem' }}>
                      📍 {reporte.ubicacion?.distrito}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>
                      {reporte.ubicacion?.direccion?.substring(0, 30)}
                    </p>
                  </td>
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', backgroundColor: '#2d7a47', borderRadius: '50%' }} />
                      <span style={{ color: '#2d7a47', fontWeight: '600' }}>
                        {reporte.operador?.nombre || reporte.operadorAsignado?.nombre || 'SIN ASIGNAR'}
                      </span>
                    </div>
                  </td>
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                  }}>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: getNivelColor(reporte.nivelCalculado),
                      color: '#fff',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}>
                      {reporte.nivelCalculado?.toUpperCase() || 'SIN INFO'}
                    </div>
                  </td>
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                  }}>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: '#fff',
                      color: getEstadoColor(reporte.estado),
                      border: `1px solid ${getEstadoColor(reporte.estado)}`,
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}>
                      {reporte.estado?.replace('_', ' ').toUpperCase() || 'SIN ESTADO'}
                    </div>
                  </td>
                  <td style={{
                    padding: '1rem',
                    fontSize: '0.9rem',
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => abrirModalEvaluacion(reporte)}
                        style={{
                        backgroundColor: 'rgba(13, 58, 38, 0.1)',
                        color: '#0d3a26',
                        border: 'none',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '0.3rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fontFamily: "'Poppins', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s ease',
                      }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13, 58, 38, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13, 58, 38, 0.1)';
                        }}
                      >
                        <BsEye size={14} /> DETALLES
                      </button>
                      <button
                        onClick={() => abrirModalDelegar(reporte)}
                        style={{
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        color: '#ff9800',
                        border: 'none',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '0.3rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fontFamily: "'Poppins', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s ease',
                      }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 152, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
                        }}
                      >
                        <BsArrowRight size={14} /> DELEGAR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportesFiltrados.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#999',
          fontFamily: "'Poppins', sans-serif",
        }}>
          No hay reportes disponibles
        </div>
      )}

      {/* Pagination */}
      {reportesFiltrados.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              backgroundColor: currentPage === 1 ? '#e0e0e0' : '#2d7a47',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.3rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            ← Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                backgroundColor: currentPage === page ? '#2d7a47' : '#f5f5f5',
                color: currentPage === page ? '#fff' : '#0d3a26',
                border: currentPage === page ? 'none' : '1px solid #e0e0e0',
                padding: '0.5rem 0.8rem',
                borderRadius: '0.3rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              backgroundColor: currentPage === totalPages ? '#e0e0e0' : '#2d7a47',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.3rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Siguiente →
          </button>

          <span style={{
            fontSize: '0.85rem',
            color: '#999',
            fontFamily: "'Poppins', sans-serif",
            marginLeft: '1rem',
          }}>
            Página {currentPage} de {totalPages}
          </span>
        </div>
      )}

      {/* Modal de Evaluación */}
      {modalAbierto && reporteSeleccionado && (() => {
        const usuarioActual = obtenerUsuarioActual();
        const operadorAsignado = reporteSeleccionado.operador?.nombre || reporteSeleccionado.operadorAsignado?.nombre;
        const esAssignedToMe = usuarioActual?.nombre === operadorAsignado;

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
            padding: '1rem',
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}>
              {/* Header del Modal */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: '#2d7a47',
                    fontWeight: '700',
                    fontFamily: "'Poppins', sans-serif",
                    letterSpacing: '1px',
                    textAlign: 'left',
                  }}>
                    {formatearIdReporte(reporteSeleccionado._id)}
                  </p>
                  <h3 style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: '#0d3a26',
                    fontFamily: "'Poppins', sans-serif",
                    textAlign: 'left',
                  }}>
                    EVALUACIÓN DE INCIDENTE
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setModalAbierto(false);
                    setReporteSeleccionado(null);
                    setRiesgoRealSeleccionado('');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#999',
                    padding: 0,
                    marginLeft: '1rem',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Imagen del Incidente */}
              <div style={{
                marginBottom: '1.5rem',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                backgroundColor: '#e0e0e0',
                height: '200px',
                position: 'relative',
              }}>
                {reporteSeleccionado.imagenes && reporteSeleccionado.imagenes[0] ? (
                  <img
                    src={reporteSeleccionado.imagenes[0].url}
                    alt={reporteSeleccionado.tipoIncidente}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: '#999',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.9rem',
                  }}>
                    Sin imagen disponible
                  </div>
                )}
              </div>

              {/* Operador Asignado */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.75rem',
                  color: '#999',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  textTransform: 'uppercase',
                }}>
                  Operador Asignado
                </p>
                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e0e0e0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#2d7a47', borderRadius: '50%' }} />
                    <span style={{ color: '#2d7a47', fontWeight: '600', fontFamily: "'Poppins', sans-serif" }}>
                      {operadorAsignado || 'SIN ASIGNAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge si el reporte está resuelto */}
              {reporteSeleccionado.estado?.toLowerCase() === 'resuelto' && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#e8f5e9',
                  border: '1px solid #4caf50',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.8rem',
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    color: '#27ae60',
                  }}>
                    ✓
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#1b5e20',
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      Incidente Resuelto
                    </p>
                    <p style={{
                      margin: '0.3rem 0 0 0',
                      fontSize: '0.85rem',
                      color: '#2e7d32',
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      Resuelto por: <strong>{operadorAsignado || 'Sistema'}</strong>
                      {reporteSeleccionado.fechas?.resuelto && (
                        <>
                          <br />
                          Fecha: {new Date(reporteSeleccionado.fechas.resuelto).toLocaleString('es-ES')}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Badge si no es el operador asignado */}
              {!esAssignedToMe && operadorAsignado && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    color: '#ff9800',
                  }}>
                    ⚠️
                  </div>
                  <div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#856404',
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      Reporte Asignado a Otro Operador
                    </p>
                    <p style={{
                      margin: '0.3rem 0 0 0',
                      fontSize: '0.85rem',
                      color: '#856404',
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      Este incidente está siendo atendido por {operadorAsignado}. Por favor, espera a que lo resuelva o contacta al administrador.
                    </p>
                  </div>
                </div>
              )}

            {/* Riesgo Percibido */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.75rem',
                color: '#999',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase',
              }}>
                Riesgo Percibido
              </p>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e0e0e0',
              }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: getNivelColor(reporteSeleccionado.nivelCalculado),
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.3rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {reporteSeleccionado.nivelCalculado?.toUpperCase() || 'SIN INFO'}
                </div>
              </div>
            </div>

              {/* Riesgo Real (Operador) - Solo para el operador asignado */}
              {esAssignedToMe && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    margin: '0 0 0.8rem 0',
                    fontSize: '0.75rem',
                    color: '#999',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                    textTransform: 'uppercase',
                  }}>
                    Riesgo Real (Operador)
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '0.8rem',
                    backgroundColor: '#f9f9f9',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e0e0e0',
                  }}>
                    {['bajo', 'medio', 'alto'].map((riesgo) => (
                      <button
                        key={riesgo}
                        onClick={() => setRiesgoRealSeleccionado(riesgo)}
                        style={{
                          flex: 1,
                          padding: '0.6rem 1rem',
                          border: riesgoRealSeleccionado === riesgo ? 'none' : '1px solid #e0e0e0',
                          borderRadius: '0.3rem',
                          backgroundColor:
                            riesgoRealSeleccionado === riesgo
                              ? getNivelColor(riesgo)
                              : '#fff',
                          color:
                            riesgoRealSeleccionado === riesgo ? '#fff' : '#0d3a26',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                          fontFamily: "'Poppins', sans-serif",
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {riesgo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Ubicación Registrada */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.75rem',
                color: '#999',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase',
              }}>
                Ubicación Registrada
              </p>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e0e0e0',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#0d3a26',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {reporteSeleccionado.ubicacion?.distrito || 'Sin ubicación'}
                </p>
                <p style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.8rem',
                  color: '#999',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {reporteSeleccionado.ubicacion?.direccion || 'Sin dirección'}
                </p>
              </div>
            </div>

            {/* Descripción del Incidente */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.75rem',
                color: '#999',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase',
              }}>
                Descripción del Incidente
              </p>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e0e0e0',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#666',
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: 'italic',
                  lineHeight: '1.5',
                }}>
                  {reporteSeleccionado.descripcion || 'Sin descripción disponible'}
                </p>
              </div>
            </div>

              {/* Botón Marcar como Resuelto - Solo para el operador asignado */}
              {esAssignedToMe && (
                <button
                  onClick={marcarComoResuelto}
                  disabled={!riesgoRealSeleccionado || actualizando}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1.5rem',
                    backgroundColor:
                      !riesgoRealSeleccionado || actualizando ? '#ccc' : '#2d7a47',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    fontFamily: "'Poppins', sans-serif",
                    cursor:
                      !riesgoRealSeleccionado || actualizando
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ✓ {actualizando ? 'Actualizando...' : 'MARCAR COMO RESUELTO'}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
