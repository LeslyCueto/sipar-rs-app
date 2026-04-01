const API_BASE_URL = 'http://localhost:5000/api';

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
