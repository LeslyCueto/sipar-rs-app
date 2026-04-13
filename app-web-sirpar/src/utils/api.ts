// Usar variable de entorno en producción, localhost en desarrollo
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Registro
export const registroUsuario = async (datosRegistro: any) => {
  try {
    // Mapear campos del formulario a los campos de la API
    const datos = {
      nombreCompleto: datosRegistro.nombreCompleto,
      email: datosRegistro.email,
      password: datosRegistro.password,
      dni: datosRegistro.dni || null,
      telefono: datosRegistro.telefono,
      ubicacion: datosRegistro.ubicacion,
    };

    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error en registro');
    }

    // Guardar token en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    return data;
  } catch (error) {
    console.error('❌ Error registro:', error);
    throw error;
  }
};

// Login
export const loginUsuario = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error en login');
    }

    // Guardar token en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    return data;
  } catch (error) {
    console.error('❌ Error login:', error);
    throw error;
  }
};

// Logout
export const logoutUsuario = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

// Obtener token
export const obtenerToken = () => {
  return localStorage.getItem('token');
};

// Obtener usuario actual
export const obtenerUsuarioActual = () => {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
};

// Obtener todos los usuarios (para administrador)
export const obtenerTodosUsuarios = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/usuarios`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error obteniendo usuarios');
    }

    return data.usuarios || [];
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    throw error;
  }
};

// Obtener todos los reportes (para administrador)
export const obtenerTodosReportes = async () => {
  try {
    const token = obtenerToken();
    if (!token) {
      throw new Error('No hay token disponible');
    }

    const response = await fetch(`${API_BASE_URL}/reports/admin/todos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo reportes');
    }

    return data.reportes || [];
  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
    throw error;
  }
};

// Actualizar usuario por ID
export const actualizarUsuario = async (usuarioId: string, datosActualizacion: any) => {
  try {
    const token = obtenerToken();
    if (!token) {
      throw new Error('No hay token disponible');
    }

    const response = await fetch(`${API_BASE_URL}/auth/usuarios/${usuarioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(datosActualizacion),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || data.message || 'Error actualizando usuario');
    }

    return data;
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    throw error;
  }
};

// Crear nuevo usuario/operador desde admin
export const crearUsuarioAdmin = async (datosNuevoUsuario: any) => {
  try {
    const token = obtenerToken();
    if (!token) {
      throw new Error('No hay token disponible');
    }

    const response = await fetch(`${API_BASE_URL}/auth/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(datosNuevoUsuario),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || data.message || 'Error creando usuario');
    }

    return data;
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw error;
  }
};

// Desasignar un reporte de un operador
export const desasignarReporte = async (reportId: string) => {
  try {
    const token = obtenerToken();
    if (!token) {
      throw new Error('No hay token disponible');
    }

    const response = await fetch(`${API_BASE_URL}/reports/assign/${reportId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error desasignando reporte');
    }

    return data;
  } catch (error) {
    console.error('❌ Error desasignando reporte:', error);
    throw error;
  }
};
