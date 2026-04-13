import { useState, useEffect } from 'react';
import { BsBell, BsPerson, BsGeo, BsPeople, BsFileText, BsGraphUp, BsSearch, BsPlus, BsDownload, BsInfoCircle, BsList, BsReceipt, BsCheckCircle } from 'react-icons/bs';
import logo from '../assets/img/SIPAR-RS_logo.svg';
import { logoutUsuario, obtenerUsuarioActual } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GestionarUsuarios } from './GestionarUsuarios';
import { GestionarOperadores } from './GestionarOperadores';
import { GestionarZonas } from './GestionarZonas';
import { PerfilTab } from './PerfilTab';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function DashboardAdmin() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioActual();
  const [activeTab, setActiveTab] = useState('inicio');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chartView, setChartView] = useState<'monthly' | 'daily' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<any[]>([]);
  const [tiposIncidente, setTiposIncidente] = useState<string[]>([]);
  const [stats, setStats] = useState({
    ciudadanos: 0,
    operadores: 0,
    reportesPendientes: 0,
    totalReportes: 0,
    resolucion: 0,
  });

  useEffect(() => {
    if (!usuario) {
      navigate('/');
      return;
    }
  }, [usuario, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar estadísticas
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        // Cargar usuarios
        const usuariosRes = await fetch('http://localhost:5000/api/auth/usuarios', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const usuariosData = await usuariosRes.json();
        const usuarios = usuariosData.usuarios || [];
        console.log('Usuarios cargados:', usuarios);

        // Contar ciudadanos y operadores
        const ciudadanos = usuarios.filter((u: any) => u.rol === 'ciudadano').length;
        const operadores = usuarios.filter((u: any) => u.rol === 'operador').length;
        console.log('Ciudadanos:', ciudadanos, 'Operadores:', operadores);

        // Cargar reportes
        const reportesRes = await fetch('http://localhost:5000/api/reports/admin/todos', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const reportesData = await reportesRes.json();
      const reportes = reportesData.reportes || [];

        // Contar reportes por estado
        const reportesPendientes = reportes.filter((r: any) => r.estado === 'pendiente').length;
        const reportesResueltos = reportes.filter((r: any) => r.estado === 'resuelto').length;
        const totalReportes = reportes.length;
        const resolucion = totalReportes > 0 ? Math.round((reportesResueltos / totalReportes) * 100) : 0;
        console.log('Pendientes:', reportesPendientes, 'Resueltos:', reportesResueltos, 'Total:', totalReportes, 'Resolución:', resolucion);

        setStats({
          ciudadanos,
          operadores,
          reportesPendientes,
          totalReportes,
          resolucion,
        });
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      }
    };

    // Cargar estadísticas inmediatamente al montar
    cargarEstadisticas();

    // Configurar intervalo para actualizar cada 10 segundos
    const intervalo = setInterval(cargarEstadisticas, 10000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalo);
  }, []);

  // Cargar datos del gráfico
  useEffect(() => {
    const cargarDatosGrafico = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/reports/admin/todos', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) return;

        const result = await response.json();
        const reportes = result.reportes || [];

        // Obtener tipos de incidente únicos
        const tipos: string[] = [...new Set(reportes.map((r: any) => r.tipoIncidente || 'Sin clasificar'))] as string[];
        setTiposIncidente(tipos);

        // Procesar datos según la vista
        if (chartView === 'monthly') {
          // Agrupar por mes - mostrar todos los meses en orden
          const mesesAbrev = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
          const mesesData: Record<string, Record<string, number>> = {};

          // Inicializar todos los meses
          mesesAbrev.forEach(mes => {
            mesesData[mes] = {};
            tipos.forEach((tipo: string) => {
              mesesData[mes][tipo] = 0;
            });
          });

          // Llenar con datos reales
          reportes.forEach((reporte: any) => {
            const fecha = new Date(reporte.fechas?.creado || reporte.createdAt);
            const mesIndex = fecha.getMonth();
            const mes = mesesAbrev[mesIndex];
            const año = fecha.getFullYear();
            const tipo = reporte.tipoIncidente || 'Sin clasificar';

            // Filtrar por año seleccionado
            if (año === selectedYear) {
              if (!mesesData[mes][tipo]) {
                mesesData[mes][tipo] = 0;
              }
              mesesData[mes][tipo]++;
            }
          });

          const chartDataFormated = mesesAbrev.map(mes => ({
            mes,
            ...mesesData[mes],
          }));

          setChartData(chartDataFormated);
        } else if (chartView === 'daily') {
          // Vista diaria: mostrar días del mes seleccionado
          const diasData: Record<number, Record<string, number>> = {};
          const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

          reportes.forEach((reporte: any) => {
            const fecha = new Date(reporte.fechas?.creado || reporte.createdAt);
            if (fecha.getMonth() === selectedMonth && fecha.getFullYear() === selectedYear) {
              const dia = fecha.getDate();
              const tipo = reporte.tipoIncidente || 'Sin clasificar';

              if (!diasData[dia]) {
                diasData[dia] = {};
              }
              diasData[dia][tipo] = (diasData[dia][tipo] || 0) + 1;
            }
          });

          // Asegurar que todos los días aparezcan
          const chartDataFormated = Array.from({ length: daysInMonth }, (_, i) => ({
            dia: `${String(i + 1).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}`,
            ...(diasData[i + 1] || {}),
          }));

          setChartData(chartDataFormated);
        } else if (chartView === 'annual') {
          // Vista anual: mostrar años
          const añosData: Record<number, Record<string, number>> = {};
          const años = new Set<number>();

          // Recolectar todos los años disponibles
          reportes.forEach((reporte: any) => {
            const fecha = new Date(reporte.fechas?.creado || reporte.createdAt);
            años.add(fecha.getFullYear());
          });

          // Inicializar datos para cada año
          Array.from(años).sort().forEach(año => {
            añosData[año] = {};
            tipos.forEach((tipo: string) => {
              añosData[año][tipo] = 0;
            });
          });

          // Llenar con datos reales
          reportes.forEach((reporte: any) => {
            const fecha = new Date(reporte.fechas?.creado || reporte.createdAt);
            const año = fecha.getFullYear();
            const tipo = reporte.tipoIncidente || 'Sin clasificar';

            if (!añosData[año][tipo]) {
              añosData[año][tipo] = 0;
            }
            añosData[año][tipo]++;
          });

          const chartDataFormated = Array.from(años)
            .sort()
            .map(año => ({
              año: año.toString(),
              ...añosData[año],
            }));

          setChartData(chartDataFormated);
        }
      } catch (err) {
        console.error('Error cargando datos del gráfico:', err);
      }
    };

    cargarDatosGrafico();
  }, [chartView, selectedMonth, selectedYear]);

  const alertas = [
    { id: 1, tipo: 'GPS', titulo: 'Falla de GPS: Unidad 04', hora: '10:44 AM' },
    { id: 2, tipo: 'Saturación', titulo: 'Saturación: Sector 1', hora: '09:45 AM' },
    { id: 3, tipo: 'Retraso', titulo: 'Retraso de Recolección: Ruta B', hora: '09:12 AM' },
  ];

  // Función para descargar reportes en Excel
  const descargarReportesExcel = async () => {
    try {
      // Cargar reportes
      const reportesRes = await fetch('http://localhost:5000/api/reports/admin/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const reportesData = await reportesRes.json();
      const reportes = reportesData.reportes || [];

      if (reportes.length === 0) {
        alert('No hay reportes para descargar');
        return;
      }

      // Importar XLSX dinámicamente
      const XLSX = await import('xlsx');

      // Preparar datos para el Excel
      const datosExcel = reportes.map((reporte: any) => ({
        'ID Reporte': reporte._id || '',
        'Usuario Nombre': reporte.usuario?.nombre || (reporte.anonimo ? 'Anónimo' : ''),
        'Usuario Email': reporte.usuario?.email || '',
        'Es Anónimo': reporte.anonimo ? 'Sí' : 'No',
        'Tipo Incidente': reporte.tipoIncidente || '',
        'Descripción': reporte.descripcion || '',
        'Departamento': reporte.ubicacion?.departamento || '',
        'Provincia': reporte.ubicacion?.provincia || '',
        'Distrito': reporte.ubicacion?.distrito || '',
        'Dirección': reporte.ubicacion?.direccion || '',
        'UBIGEO': reporte.ubicacion?.ubigeo || '',
        'Latitud': reporte.ubicacion?.coordenadas?.lat || '',
        'Longitud': reporte.ubicacion?.coordenadas?.lng || '',
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
        { wch: 25 }, // Usuario Email
        { wch: 12 }, // Es Anónimo
        { wch: 18 }, // Tipo Incidente
        { wch: 30 }, // Descripción
        { wch: 15 }, // Departamento
        { wch: 15 }, // Provincia
        { wch: 15 }, // Distrito
        { wch: 30 }, // Dirección
        { wch: 12 }, // UBIGEO
        { wch: 12 }, // Latitud
        { wch: 12 }, // Longitud
        { wch: 17 }, // Nivel Percibido
        { wch: 17 }, // Nivel Real
        { wch: 15 }, // Estado
        { wch: 20 }, // Fecha Creado
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

      // Descargar archivo
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      XLSX.writeFile(wb, `Reportes_${fecha}.xlsx`);
    } catch (err) {
      console.error('Error descargando reportes:', err);
      alert('Error al descargar reportes');
    }
  };

  // Función para traducir tipos de incidente
  const traducirTipo = (tipo: string): string => {
    const traducciones: Record<string, string> = {
      'acumulacion_residuos': 'Acumulación de Residuos',
      'quema_ilegal': 'Quema Ilegal',
      'Sin clasificar': 'Sin clasificar',
    };
    return traducciones[tipo] || tipo;
  };

  // Títulos de navegación para el breadcrumb
  const tabTitles: Record<string, string> = {
    inicio: 'Panel de Control',
    reportes: 'Gestión de Reportes',
    usuarios: 'Gestión de Usuarios',
    operadores: 'Gestión de Operadores',
    zonas: 'Gestión de Zonas',
    perfil: 'Mi Perfil',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="admin"
        userName={usuario?.nombre || 'Admin'}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '250px', height: '100vh', boxSizing: 'border-box', width: isMobile ? '100%' : 'calc(100% - 250px)', overflow: 'hidden' }}>
        {/* Breadcrumb with Header Info */}
        <div style={{
          backgroundColor: '#fff',
          padding: '0.8rem 1.5rem',
          borderBottom: '1px solid #e0e0e0',
          fontSize: '0.85rem',
          fontFamily: "'Poppins', sans-serif",
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 0,
          position: 'static',
          zIndex: 40,
          width: '100%',
          boxSizing: 'border-box',
          maxWidth: '100%',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {isMobile ? (
            <>
              {/* Mobile - Campana */}
              <button
                style={{
                  backgroundColor: 'rgba(45, 122, 71, 0.1)',
                  color: '#0d3a26',
                  border: 'none',
                  padding: '0.6rem 0.7rem',
                  minHeight: '2.5rem',
                  minWidth: '2.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.1)';
                }}
              >
                <BsBell size={18} />
              </button>

              {/* Mobile - Hamburguesa */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  backgroundColor: 'rgba(45, 122, 71, 0.1)',
                  color: '#0d3a26',
                  border: 'none',
                  padding: '0.6rem 0.7rem',
                  minHeight: '2.5rem',
                  minWidth: '2.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.1)';
                }}
              >
                <BsBell size={16} />
              </button>
            </>
          ) : (
            <>
              {/* Desktop - Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <span style={{ color: '#0d3a26', fontWeight: '600' }}>Inicio</span>
                  <span style={{ margin: '0 0.5rem' }}>/</span>
                  <span style={{ color: '#999' }}>{tabTitles[activeTab] || 'Sistema'}</span>
                </div>
              </div>

              {/* Desktop - Bell & User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  style={{
                    backgroundColor: 'rgba(45, 122, 71, 0.1)',
                    color: '#0d3a26',
                    border: 'none',
                    padding: '0.5rem 0.8rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(45, 122, 71, 0.1)';
                  }}
                >
                  <BsBell size={18} />
                </button>
                <div style={{ fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#0d3a26', fontWeight: '600' }}>{usuario?.nombre || 'Admin'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7, color: '#666' }}>Administrador</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content Area */}
        <main style={{ flex: 1, padding: isMobile ? '0.8rem' : '1.2rem', paddingTop: isMobile ? '0.8rem' : '1.2rem', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          {/* Inicio Tab - Dashboard Principal */}
          {activeTab === 'inicio' && (
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center', 
                marginBottom: '1rem',
                marginTop: isMobile ? '2rem' : 0,
                gap: isMobile ? '0.8rem' : 0,
              }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif", textAlign: 'left' }}>
                    Panel de Control
                  </h1>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#999', fontFamily: "'Poppins', sans-serif", textAlign: 'left' }}>
                    Monitoreo General del Sistema
                  </p>
                </div>
                <button
                  onClick={descargarReportesExcel}
                  style={{
                    backgroundColor: '#2d7a47',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: "'Poppins', sans-serif",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    whiteSpace: 'normal',
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BsDownload size={16} />
                    DESCARGAR REPORTES
                  </div>
                  <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: '500' }}>
                    (Archivo excel)
                  </span>
                </button>
              </div>

              {/* Statistics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '0.6rem' : '0.8rem',
                marginBottom: '1rem',
              }}>
                {[
                  { 
                    label: 'CIUDADANOS', 
                    value: stats.ciudadanos, 
                    icon: BsPerson, 
                    color: '#2d7a47',
                    bgColor: 'rgba(45, 122, 71, 0.1)'
                  },
                  { 
                    label: 'OPERADORES', 
                    value: stats.operadores, 
                    icon: BsPeople, 
                    color: '#ff9800',
                    bgColor: 'rgba(255, 152, 0, 0.1)'
                  },
                  { 
                    label: 'REPORTES PEND.', 
                    value: stats.reportesPendientes, 
                    icon: BsReceipt, 
                    color: '#e74c3c',
                    bgColor: 'rgba(231, 76, 60, 0.1)'
                  },
                  { 
                    label: 'RESOLUCIÓN', 
                    value: `${stats.resolucion}%`, 
                    icon: BsCheckCircle, 
                    color: '#27ae60',
                    bgColor: 'rgba(39, 174, 96, 0.1)'
                  },
                ].map((stat, idx) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#fff',
                        padding: isMobile ? '1rem' : '1.2rem',
                        borderRadius: '0.8rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{
                        width: isMobile ? '50px' : '60px',
                        height: isMobile ? '50px' : '60px',
                        backgroundColor: stat.bgColor,
                        borderRadius: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.8rem',
                      }}>
                        <IconComponent size={isMobile ? 28 : 32} color={stat.color} />
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: isMobile ? '1.8rem' : '2.2rem',
                        fontWeight: '700',
                        color: '#0d3a26',
                        fontFamily: "'Poppins', sans-serif",
                        marginBottom: '0.4rem'
                      }}>
                        {stat.value}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                        color: '#999',
                        fontFamily: "'Poppins', sans-serif",
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        {stat.label}
                      </p>
                      {idx === 2 && (
                        <p style={{
                          margin: '0.6rem 0 0 0',
                          fontSize: '0.8em',
                          color: '#999',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          justifyContent: 'center'
                        }}>
                          <BsReceipt size={20} />
                          Total: {stats.totalReportes} reportes
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: isMobile ? '0.6rem' : '0.8rem',
                marginBottom: '0.5rem',
              }}>
                {/* Bar Chart */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '0.8rem' : '1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif" }}>
                      Flujo de Incidentes
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Botones de vista */}
                      <button
                        onClick={() => setChartView('monthly')}
                        style={{
                          backgroundColor: chartView === 'monthly' ? '#2d7a47' : '#f0f0f0',
                          color: chartView === 'monthly' ? '#fff' : '#333',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.3rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        Mensual
                      </button>
                      <button
                        onClick={() => setChartView('daily')}
                        style={{
                          backgroundColor: chartView === 'daily' ? '#2d7a47' : '#f0f0f0',
                          color: chartView === 'daily' ? '#fff' : '#333',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.3rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        Diario
                      </button>
                      <button
                        onClick={() => setChartView('annual')}
                        style={{
                          backgroundColor: chartView === 'annual' ? '#2d7a47' : '#f0f0f0',
                          color: chartView === 'annual' ? '#fff' : '#333',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.3rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        Anual
                      </button>

                      {/* Selector de año - visible solo en vistas monthly y daily */}
                      {chartView !== 'annual' && (
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '0.3rem',
                            border: '1px solid #ddd',
                            fontSize: '0.75rem',
                            fontFamily: "'Poppins', sans-serif",
                            cursor: 'pointer',
                          }}
                        >
                          <option value={2024}>2024</option>
                          <option value={2025}>2025</option>
                          <option value={2026}>2026</option>
                          <option value={2027}>2027</option>
                        </select>
                      )}

                      {/* Selector de mes si está en vista diaria */}
                      {chartView === 'daily' && (
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: '0.3rem',
                            border: '1px solid #ddd',
                            fontSize: '0.75rem',
                            fontFamily: "'Poppins', sans-serif",
                            cursor: 'pointer',
                          }}
                        >
                          <option value={0}>Enero</option>
                          <option value={1}>Febrero</option>
                          <option value={2}>Marzo</option>
                          <option value={3}>Abril</option>
                          <option value={4}>Mayo</option>
                          <option value={5}>Junio</option>
                          <option value={6}>Julio</option>
                          <option value={7}>Agosto</option>
                          <option value={8}>Septiembre</option>
                          <option value={9}>Octubre</option>
                          <option value={10}>Noviembre</option>
                          <option value={11}>Diciembre</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Leyenda de tipos de incidente */}
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    {tiposIncidente.map((tipo, idx) => {
                      const colores = ['#1565a0', '#7dd3c0', '#ff9800', '#e74c3c', '#27ae60', '#9b59b6'];
                      return (
                        <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                          <div style={{ width: '12px', height: '12px', backgroundColor: colores[idx % colores.length], borderRadius: '2px' }} />
                          {traducirTipo(tipo)}
                        </div>
                      );
                    })}
                  </div>

                  <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey={chartView === 'monthly' ? 'mes' : chartView === 'daily' ? 'dia' : 'año'}
                        stroke="#999"
                        style={{ fontSize: '0.8rem' }}
                      />
                      <YAxis
                        stroke="#999"
                        style={{ fontSize: '0.8rem' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0d3a26',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      />
                      <Legend formatter={(value) => traducirTipo(value)} />
                      {tiposIncidente.map((tipo, idx) => {
                        const colores = ['#1565a0', '#7dd3c0', '#ff9800', '#e74c3c', '#27ae60', '#9b59b6'];
                        return (
                          <Bar 
                            key={tipo}
                            dataKey={tipo} 
                            name={traducirTipo(tipo)}
                            fill={colores[idx % colores.length]} 
                            radius={[4, 4, 0, 0]} 
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Reportes Tab */}
          {activeTab === 'reportes' && (
            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif", marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BsFileText size={20} /> Gestión de Reportes
              </h2>
              <p style={{ color: '#999', fontFamily: "'Poppins', sans-serif", marginBottom: '2rem' }}>
                Vista consolidada de todos los reportes del sistema.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.8rem',
                marginBottom: '1rem', 
              }}>
                {[
                  { label: 'Total Reportes', value: '2,450' },
                  { label: 'Pendientes', value: '342' },
                  { label: 'En Proceso', value: '156' },
                  { label: 'Completados', value: '1,952' },
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#999', fontFamily: "'Poppins', sans-serif'" }}>{stat.label}</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', fontWeight: '700', color: '#0d3a26' }}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <button
                style={{
                  backgroundColor: '#2d7a47',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <BsPlus size={18} /> Nuevo Reporte
              </button>
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === 'usuarios' && (
            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <GestionarUsuarios />
            </div>
          )}

          {/* Operadores Tab */}
          {activeTab === 'operadores' && (
            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <GestionarOperadores />
            </div>
          )}

          {/* Zonas Tab */}
          {activeTab === 'zonas' && (
            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <GestionarZonas />
            </div>
          )}

          {/* Perfil Tab */}
          {activeTab === 'perfil' && (
            <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <PerfilTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
