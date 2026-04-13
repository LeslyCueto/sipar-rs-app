import { useState, useEffect } from 'react';
import { BsBell, BsListTask, BsClock, BsGear, BsCheckCircle } from 'react-icons/bs';
import { obtenerUsuarioActual } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { PerfilTab } from './PerfilTab';
import { MapaDistritosOperador } from './MapaDistritosOperador';
import { GestionarReportes } from './GestionarReportes';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardOperador() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioActual();
  const [activeTab, setActiveTab] = useState('inicio');
  const [activeDashTab, setActiveDashTab] = useState<'todos' | 'mios'>('todos');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalOperador: 0,
    totalGlobal: 0,
    reportesPendientes: 0,
    reportesEnProceso: 0,
    reportesResueltos: 0,
    resolucion: 0,
    zonasOperador: [] as string[],
  });
  const [pieData, setPieData] = useState<any[]>([]);
  const [reportesPorDistrito, setReportesPorDistrito] = useState<any[]>([]);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      // Cargar todos los reportes
      const reportesRes = await fetch('http://localhost:5000/api/reports/admin/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const reportesData = await reportesRes.json();
      const todosLosReportes = reportesData.reportes || [];

      // Total global
      const totalGlobal = todosLosReportes.length;

      // Obtener operador actual
      const operadorActual = obtenerUsuarioActual();
      console.log('👤 OPERADOR ACTUAL:', {
        id: operadorActual?.id,
        nombre: operadorActual?.nombre,
        email: operadorActual?.email,
        rol: operadorActual?.rol,
      });

      // Función para hacer match de operador (más flexible y estricta)
      const esOperadorActual = (reportOperador: any): boolean => {
        if (!reportOperador || !operadorActual) return false;
        
        // Extraer valores
        const opId = reportOperador?._id || reportOperador;
        const opEmail = reportOperador?.email || '';
        const opNombre = reportOperador?.nombre || '';
        
        const actualId = operadorActual?.id;
        const actualEmail = operadorActual?.email;
        const actualNombre = operadorActual?.nombre;
        
        // Comparar por ID (más estricto)
        if (opId && actualId && String(opId).trim() === String(actualId).trim()) {
          console.log(`✅ MATCH por ID: ${opId} === ${actualId}`);
          return true;
        }
        
        // Comparar por Email (muy confiable)
        if (opEmail && actualEmail && String(opEmail).trim().toLowerCase() === String(actualEmail).trim().toLowerCase()) {
          console.log(`✅ MATCH por EMAIL: ${opEmail} === ${actualEmail}`);
          return true;
        }
        
        // Comparar por Nombre (último recurso)
        if (opNombre && actualNombre && String(opNombre).trim().toLowerCase() === String(actualNombre).trim().toLowerCase()) {
          console.log(`✅ MATCH por NOMBRE: ${opNombre} === ${actualNombre}`);
          return true;
        }
        
        return false;
      };

      // Filtrar reportes por el operador actual - intentar tanto operador como operadorAsignado
      const reportesOperador = todosLosReportes.filter((r: any) => {
        const matchOperador = esOperadorActual(r.operador);
        const matchOperadorAsignado = esOperadorActual(r.operadorAsignado);
        return matchOperador || matchOperadorAsignado;
      });

      console.log(`🎯 REPORTES ENCONTRADOS PARA OPERADOR: ${reportesOperador.length}`);

      // Contar reportes por estado del operador
      const totalOperador = reportesOperador.length;
      const reportesPendientes = reportesOperador.filter((r: any) => 
        r.estado && (r.estado.toLowerCase() === 'pendiente')
      ).length;
      
      const reportesEnProceso = reportesOperador.filter((r: any) => 
        r.estado && (r.estado.toLowerCase() === 'en_proceso' || r.estado.toLowerCase() === 'en proceso')
      ).length;
      
      const reportesResueltos = reportesOperador.filter((r: any) => 
        r.estado && (r.estado.toLowerCase() === 'resuelto')
      ).length;

      // Obtener zonas del usuario actual (solo si es operador)
      let zonasOperador: string[] = [];

      if (operadorActual?.rol?.toLowerCase() === 'operador' && operadorActual?.zona) {
        // Procesar zona: dividir por comas y tomar los últimos 2 valores
        const zonaString = String(operadorActual.zona).trim();
        const zonaParts = zonaString
          .split(',')
          .map((z: string) => z.trim())
          .filter((z: string) => z.length > 0);
        
        // Tomar los últimos 2 valores
        zonasOperador = zonaParts.slice(-2);
      }

      console.log('📊 ESTADÍSTICAS DEL OPERADOR - ACTUALIZADAS:', { 
        totalOperador, 
        totalGlobal, 
        reportesPendientes, 
        reportesEnProceso, 
        reportesResueltos,
        zonasOperador,
        resolucion: totalOperador > 0 ? Math.round((reportesResueltos / totalOperador) * 100) : 0,
      });

      setStats({
        totalOperador,
        totalGlobal,
        reportesPendientes,
        reportesEnProceso,
        reportesResueltos,
        zonasOperador,
        resolucion: totalOperador > 0 ? Math.round((reportesResueltos / totalOperador) * 100) : 0,
      });
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  // Cargar estadísticas al montar y cuando cambias de tab
  useEffect(() => {
    cargarEstadisticas();
  }, [activeTab]);

  // Auto-actualizar estadísticas cada 30 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarEstadisticas();
    }, 30000); // 30 segundos
    
    return () => clearInterval(intervalo);
  }, []);

  // Función para cargar datos del gráfico y mapa
  const cargarDatosGrafico = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/admin/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Error en la respuesta del API:', response.status);
        return;
      }

      const result = await response.json();
      const todosLosReportes = result.reportes || [];

      console.log('✅ API RESPONSE - GRÁFICO ACTUALIZADO:', {
        total: result.total,
        reportesRecibidos: todosLosReportes.length,
      });

      // ===== DATOS PARA EL GRÁFICO DE PASTEL - TODOS LOS REPORTES =====
      const tiposCount: Record<string, number> = {};
      todosLosReportes.forEach((r: any) => {
        const tipo = r.tipoIncidente || 'Sin clasificar';
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
      });

      const COLORES_TIPOS = {
        'acumulacion_residuos': '#ff9800',
        'quema_ilegal': '#e74c3c',
        'Sin clasificar': '#999999'
      };

      const pieChartData = Object.entries(tiposCount).map(([tipo, count]) => ({
        name: tipo === 'acumulacion_residuos' ? 'Acumulación de Residuos' : 
               tipo === 'quema_ilegal' ? 'Quema Ilegal' : tipo,
        value: count,
        color: COLORES_TIPOS[tipo as keyof typeof COLORES_TIPOS] || '#999999'
      }));

      setPieData(pieChartData);

      // ===== DATOS PARA EL MAPA POR DISTRITO - TODOS LOS REPORTES =====
      const normalizarDistrito = (nombre: string) => {
        if (!nombre) return 'SIN DISTRITO';
        return nombre.trim().toUpperCase().replace(/\s+/g, ' ');
      };

      const reportesPorDistritoTemp: Record<string, any> = {};
      
      console.log('🔍 PROCESANDO REPORTES PARA MAPA:');
      console.log(`   Total de reportes a procesar: ${todosLosReportes.length}`);
      
      // PROCESAR CADA REPORTE - SIN LÍMITES
      todosLosReportes.forEach((r: any) => {
        // Validar que el reporte tenga ubicación con distrito y coordenadas válidas
        const distritoRaw = r.ubicacion?.distrito?.trim();
        const lat = r.ubicacion?.coordenadas?.lat;
        const lng = r.ubicacion?.coordenadas?.lng;
        
        // Si no tiene distrito válido o coordenadas válidas, saltar este reporte
        if (!distritoRaw || typeof lat !== 'number' || typeof lng !== 'number') {
          return; // Skip this report
        }
        
        const distritoClave = normalizarDistrito(distritoRaw);
        const tipo = r.tipoIncidente || 'Sin clasificar';
        // Leer riesgo desde riesgoCalculado o nivelCalculado
        const riesgoCalculado = r.riesgoCalculado || r.nivelCalculado || 'bajo';
        
        if (!reportesPorDistritoTemp[distritoClave]) {
          reportesPorDistritoTemp[distritoClave] = {
            distrito: distritoRaw,
            total: 0,
            tiposCount: {},
            nivelRiesgo: 'bajo',
            riesgosEncontrados: [],
            todosCoordenadas: [],  // Array para guardar TODAS las coordenadas
            coordenadas: { lat: 0, lng: 0 },  // Se recalculará como centroide
            direccion: r.ubicacion?.direccion || '',
          };
        }
        
        reportesPorDistritoTemp[distritoClave].total++;
        reportesPorDistritoTemp[distritoClave].tiposCount[tipo] = 
          (reportesPorDistritoTemp[distritoClave].tiposCount[tipo] || 0) + 1;
        reportesPorDistritoTemp[distritoClave].riesgosEncontrados.push(riesgoCalculado);
        
        // Guardar coordenadas (ya validadas arriba)
        reportesPorDistritoTemp[distritoClave].todosCoordenadas.push({ lat, lng });

        const riesgos = reportesPorDistritoTemp[distritoClave].riesgosEncontrados;
        if (riesgos.includes('alto')) {
          reportesPorDistritoTemp[distritoClave].nivelRiesgo = 'alto';
        } else if (riesgos.includes('medio')) {
          reportesPorDistritoTemp[distritoClave].nivelRiesgo = 'medio';
        } else {
          reportesPorDistritoTemp[distritoClave].nivelRiesgo = 'bajo';
        }
      });

      // Calcular centroide (promedio de coordenadas) para cada distrito
      Object.values(reportesPorDistritoTemp).forEach((distrito: any) => {
        if (distrito.todosCoordenadas.length > 0) {
          const sumLat = distrito.todosCoordenadas.reduce((sum: number, coord: any) => sum + coord.lat, 0);
          const sumLng = distrito.todosCoordenadas.reduce((sum: number, coord: any) => sum + coord.lng, 0);
          const count = distrito.todosCoordenadas.length;
          
          // Calcular centroide (punto medio)
          distrito.coordenadas = {
            lat: sumLat / count,
            lng: sumLng / count,
          };
        }
      });

      const distritos = Object.values(reportesPorDistritoTemp);
      
      console.log('📊 MAPA ACTUALIZADO:');
      console.log(`   Reportes procesados: ${todosLosReportes.length}`);
      console.log(`   Distritos únicos encontrados: ${distritos.length}`);
      
      setReportesPorDistrito(distritos);

    } catch (err) {
      console.error('❌ Error cargando datos del gráfico:', err);
    }
  };

  // Cargar datos del gráfico al montar y cuando cambias de tab
  useEffect(() => {
    cargarDatosGrafico();
  }, [activeTab]);

  // Auto-actualizar gráfico cada 30 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarDatosGrafico();
    }, 30000); // 30 segundos
    
    return () => clearInterval(intervalo);
  }, []);

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
      const todosLosReportes = reportesData.reportes || [];

      // Filtrar reportes del operador actual
      const operadorActual = obtenerUsuarioActual();
      const reportes = todosLosReportes.filter((r: any) => 
        r.operador?._id === operadorActual?.id || r.operadorAsignado?._id === operadorActual?.id
      );

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
        'Nivel Calculado': reporte.nivelCalculado || '',
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
        { wch: 17 }, // Nivel Calculado
        { wch: 15 }, // Estado
        { wch: 20 }, // Fecha Creado
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mis Reportes');

      // Descargar archivo
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      XLSX.writeFile(wb, `Mis_Reportes_${fecha}.xlsx`);
    } catch (err) {
      console.error('Error descargando reportes:', err);
      alert('Error al descargar reportes');
    }
  };


  // Títulos de navegación para el breadcrumb
  const tabTitles: Record<string, string> = {
    inicio: 'Panel de Control',
    reportes: 'Gestión de Reportes',
    perfil: 'Mi Perfil',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="operador"
        userName={usuario?.nombre || 'Operador'}
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
                  <p style={{ margin: 0, color: '#0d3a26', fontWeight: '600' }}>{usuario?.nombre || 'Operador'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7, color: '#666' }}>Operador</p>
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
                gap: isMobile ? '0.8rem' : '1rem',
              }}>
                {/* Left: Title + Zonas */}
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif", textAlign: 'left' }}>
                    Panel de Control
                  </h1>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#999', fontFamily: "'Poppins', sans-serif", textAlign: 'left' }}>
                    Monitoreo General del Sistema
                  </p>
                  
                  {/* Zonas Asignadas - Inside Title Section */}
                  {!isMobile && stats.zonasOperador && stats.zonasOperador.length > 0 && (
                    <div style={{
                      backgroundColor: 'rgba(45, 122, 71, 0.08)',
                      border: '1px solid rgba(45, 122, 71, 0.2)',
                      padding: '0.8rem 1rem',
                      borderRadius: '0.6rem',
                      marginTop: '0.8rem',
                    }}>
                      <p style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#0d3a26',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        Zonas Asignadas
                      </p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}>
                        {stats.zonasOperador.slice(0, 4).map((zona, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#2d7a47',
                              color: '#fff',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '0.3rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              fontFamily: "'Poppins', sans-serif",
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {zona}
                          </span>
                        ))}
                        {stats.zonasOperador.length > 4 && (
                          <span
                            style={{
                              backgroundColor: '#f0f0f0',
                              color: '#666',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '0.3rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            +{stats.zonasOperador.length - 4}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.7rem',
                        color: '#666',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        {stats.zonasOperador.length} zona{stats.zonasOperador.length !== 1 ? 's' : ''} activa{stats.zonasOperador.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
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
                    label: 'ASIGNADOS A MÍ', 
                    value: stats.totalOperador, 
                    icon: BsListTask, 
                    color: '#2d7a47',
                    bgColor: 'rgba(45, 122, 71, 0.1)'
                  },
                  { 
                    label: 'PENDIENTES', 
                    value: stats.reportesPendientes, 
                    icon: BsClock, 
                    color: '#ff9800',
                    bgColor: 'rgba(255, 152, 0, 0.1)'
                  },
                  { 
                    label: 'EN PROCESO', 
                    value: stats.reportesEnProceso, 
                    icon: BsGear, 
                    color: '#1565a0',
                    bgColor: 'rgba(21, 101, 160, 0.1)'
                  },
                  { 
                    label: 'RESUELTOS', 
                    value: stats.reportesResueltos, 
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
                        margin: '0 0 0.3rem 0',
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                        color: '#999',
                        fontFamily: "'Poppins', sans-serif",
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        {stat.label}
                      </p>
                      {stat.label === 'ASIGNADOS A MÍ' && (
                        <p style={{
                          margin: 0,
                          fontSize: isMobile ? '0.65rem' : '0.75rem',
                          color: '#666',
                          fontFamily: "'Poppins', sans-serif"
                        }}>
                          de {stats.totalGlobal} total
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Charts Row - Two Columns: Pie Chart + Map */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr',
                gap: isMobile ? '0.6rem' : '0.8rem',
                marginBottom: '0.5rem',
              }}>
                {/* Pie Chart Column */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '0.8rem' : '1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  {/* Gráfico de Pastel */}
                  <div>
                    <h3 style={{ margin: '0 0 0.8rem 0', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif" }}>
                      Distribución de Incidentes
                    </h3>
                    
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ value }) => {
                              const total = pieData.reduce((sum, item) => sum + item.value, 0);
                              const percent = ((value / total) * 100).toFixed(0);
                              return `${percent}%`;
                            }}
                            outerRadius={isMobile ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => `${value} reportes`}
                            labelFormatter={(label: any) => label}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '0.5rem',
                              color: '#0d3a26',
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.9rem',
                              padding: '0.5rem 0.8rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                            labelStyle={{
                              color: '#0d3a26',
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.9rem',
                              fontWeight: '600',
                            }}
                            wrapperStyle={{
                              color: '#0d3a26',
                              fontFamily: "'Poppins', sans-serif",
                              outline: 'none',
                            }}
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                        Sin datos disponibles
                      </div>
                    )}

                    {/* Leyenda del gráfico de pastel */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {pieData.map((item) => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                          <div style={{ width: '12px', height: '12px', backgroundColor: item.color, borderRadius: '2px' }} />
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de Registros por Distrito */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.8rem 0', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif" }}>
                      Cantidad de Registros por Distrito
                    </h3>
                    
                    {reportesPorDistrito.length > 0 ? (
                      <div style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                        border: '1px solid #eee',
                        borderRadius: '0.4rem',
                        backgroundColor: '#fafafa',
                      }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '0.8rem',
                          fontFamily: "'Poppins', sans-serif",
                        }}>
                          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f0f0f0' }}>
                            <tr>
                              <th style={{
                                padding: '0.5rem',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#0d3a26',
                                borderBottom: '1px solid #ddd',
                              }}>
                                Distrito
                              </th>
                              <th style={{
                                padding: '0.5rem',
                                textAlign: 'center',
                                fontWeight: '600',
                                color: '#0d3a26',
                                borderBottom: '1px solid #ddd',
                                width: '60px',
                              }}>
                                Avance
                              </th>
                              <th style={{
                                padding: '0.5rem',
                                textAlign: 'right',
                                fontWeight: '600',
                                color: '#0d3a26',
                                borderBottom: '1px solid #ddd',
                                width: '50px',
                              }}>
                                Cantidad
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const totalReportes = reportesPorDistrito.reduce((sum: number, d: any) => sum + d.total, 0);
                              const sorted = [...reportesPorDistrito].sort((a: any, b: any) => b.total - a.total);
                              
                              return sorted.map((distrito: any, idx: number) => {
                                const percentage = totalReportes > 0 ? (distrito.total / totalReportes) * 100 : 0;
                                
                                return (
                                  <tr key={idx} style={{
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                                    transition: 'background-color 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f0f8f5';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#fff' : '#f9f9f9';
                                  }}
                                  >
                                    <td style={{
                                      padding: '0.5rem',
                                      color: '#0d3a26',
                                      fontWeight: '500',
                                    }}>
                                      {distrito.distrito}
                                    </td>
                                    <td style={{
                                      padding: '0.5rem',
                                      width: '60px',
                                    }}>
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '20px',
                                        backgroundColor: '#e8e8e8',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                      }}>
                                        <div style={{
                                          height: '100%',
                                          width: `${percentage}%`,
                                          backgroundColor: percentage > 50 ? '#2d7a47' : percentage > 25 ? '#ffc107' : '#ff9800',
                                          transition: 'width 0.3s ease',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: '#fff',
                                          fontSize: '0.65rem',
                                          fontWeight: 'bold',
                                        }}>
                                          {percentage > 10 ? `${percentage.toFixed(0)}%` : ''}
                                        </div>
                                        {percentage <= 10 && (
                                          <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            color: '#666',
                                            position: 'absolute',
                                            left: '2px',
                                          }}>
                                            {percentage.toFixed(0)}%
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{
                                      padding: '0.5rem',
                                      textAlign: 'right',
                                      color: '#0d3a26',
                                      fontWeight: '600',
                                      width: '50px',
                                    }}>
                                      {distrito.total}
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                        Sin registros disponibles
                      </div>
                    )}
                  </div>
                </div>

                {/* Map Column */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: isMobile ? '0.8rem' : '1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <h3 style={{ margin: '0 0 0.8rem 0', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '700', color: '#0d3a26', fontFamily: "'Poppins', sans-serif" }}>
                    Riesgos por Distrito
                  </h3>
                  
                  <MapaDistritosOperador 
                    reportesPorDistrito={reportesPorDistrito}
                    googleMapsApiKey={googleMapsApiKey}
                    isMobile={isMobile}
                  />

                  {/* Legend */}
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #eee', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
                    {(() => {
                      // Calcular total de reportes por nivel de riesgo
                      let totalAlto = 0, totalMedio = 0, totalBajo = 0;
                      reportesPorDistrito.forEach((d: any) => {
                        if (d.nivelRiesgo === 'alto') totalAlto += d.total;
                        else if (d.nivelRiesgo === 'medio') totalMedio += d.total;
                        else totalBajo += d.total;
                      });
                      const totalReportes = totalAlto + totalMedio + totalBajo;
                      
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#c33', borderRadius: '2px' }} />
                            Alto ({totalAlto}/{totalReportes})
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#ffd700', borderRadius: '2px' }} />
                            Medio ({totalMedio}/{totalReportes})
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#2d7a47', borderRadius: '2px' }} />
                            Bajo ({totalBajo}/{totalReportes})
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Info */}
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '0.7rem', color: '#666', fontFamily: "'Poppins', sans-serif" }}>
                    {reportesPorDistrito.length} distritos | {reportesPorDistrito.reduce((sum: number, d: any) => sum + d.total, 0)} reportes totales
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Reportes Tab */}
          {activeTab === 'reportes' && (
            <GestionarReportes key={activeTab} isVisible={activeTab === 'reportes'} />
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
