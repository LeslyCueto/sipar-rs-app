const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Generar JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Registrar usuario
// @route   POST /api/auth/registro
// @access  Public
exports.registro = async (req, res) => {
  try {
    const { nombreCompleto, email, password, dni, telefono, ubicacion } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombreCompleto || !email || !password || !telefono || !ubicacion) {
      return res.status(400).json({
        success: false,
        mensaje: 'Por favor proporciona nombre, email, contraseña, teléfono y zona',
      });
    }

    // Normalizar email
    const emailNormalizado = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    let usuario = await Usuario.findOne({ email: emailNormalizado });
    if (usuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya está registrado',
      });
    }

    // Crear nuevo usuario con estructura correcta
    usuario = await Usuario.create({
      nombre: nombreCompleto,
      email: emailNormalizado,
      password,
      dni: dni || null,
      telefono,
      zona: ubicacion,
      rol: 'ciudadano',
      estado: 'activo',
    });

    // Generar token
    const token = generarToken(usuario._id);

    res.status(201).json({
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        ubicacion: usuario.zona,
        rol: usuario.rol,
        estado: usuario.estado,
        createdAt: usuario.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error en registro',
    });
  }
};

// @desc    Login usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Por favor proporciona email y contraseña',
      });
    }

    // Normalizar email a minúsculas
    const emailNormalizado = email.toLowerCase().trim();

    // Buscar usuario (incluir password)
    const usuario = await Usuario.findOne({ email: emailNormalizado }).select('+password');

    console.log('🔍 LOGIN:', { email, hasPassword: !!password });
    console.log('👤 USUARIO:', usuario ? `${usuario.email} rol:${usuario.rol}` : 'NO EXISTE');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales inválidas',
      });
    }

    // Verificar si el usuario es operador o admin (no pueden registrarse)
    if (usuario.rol === 'operador' || usuario.rol === 'admin') {
      if (usuario.estado !== 'activo') {
        return res.status(403).json({
          success: false,
          mensaje: 'Este usuario ha sido suspendido',
        });
      }
    }

    // Verificar password
    const esValida = await usuario.compararContraseña(password);

    console.log('🔐 PASSWORD CHECK:', { esValida });

    if (!esValida) {
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = generarToken(usuario._id);

    res.status(200).json({
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        ubicacion: usuario.zona,
        rol: usuario.rol,
        estado: usuario.estado,
        createdAt: usuario.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error en login',
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.obtenerMi = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuarioId).select('-password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      usuario,
    });
  } catch (error) {
    console.error('❌ Error en obtenerMi:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al obtener usuario',
    });
  }
};

// @desc    Obtener todos los usuarios (DEBUG)
// @route   GET /api/auth/usuarios
// @access  Public (solo para desarrollo)
exports.obtenerTodos = async (req, res) => {
  try {
    const usuarios = await Usuario.find({}).select('-password');

    res.status(200).json({
      success: true,
      total: usuarios.length,
      usuarios,
    });
  } catch (error) {
    console.error('❌ Error en obtenerTodos:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al obtener usuarios',
    });
  }
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/auth/actualizar-perfil
// @access  Private
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    // Validar que el usuario esté autenticado
    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado',
      });
    }

    // Validar campos requeridos
    if (!nombre || !email || !telefono) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre, email y teléfono son requeridos',
      });
    }

    // Validar que el email tenga formato correcto
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email inválido',
      });
    }

    // Normalizar email
    const emailNormalizado = email.toLowerCase().trim();

    // Verificar si otro usuario ya tiene ese email
    const usuarioExistente = await Usuario.findOne({ 
      email: emailNormalizado,
      _id: { $ne: req.usuarioId }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        mensaje: 'Este email ya está siendo usado por otro usuario',
      });
    }

    // Preparar datos para actualizar
    const datosActualizar = {
      nombre,
      email: emailNormalizado,
      telefono,
    };

    // Buscar y actualizar usuario
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuarioId,
      datosActualizar,
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Perfil actualizado correctamente',
      usuario,
    });
  } catch (error) {
    console.error('❌ Error en actualizar perfil:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al actualizar perfil',
    });
  }
};

// @desc    Enviar código de verificación para recuperación de contraseña
// @route   POST /api/auth/enviar-codigo-recuperacion
// @access  Private
exports.enviarCodigoRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📧 Solicitud de código para email:', email);
    console.log('👤 Usuario ID:', req.usuarioId);

    // Validar que el usuario esté autenticado
    if (!req.usuarioId) {
      console.log('❌ Sin usuario ID');
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado',
      });
    }

    // Buscar usuario (incluir campos de recuperación)
    const usuario = await Usuario.findById(req.usuarioId).select('+codigoRecuperacion +expiracionCodigo');
    if (!usuario) {
      console.log('❌ Usuario no encontrado con ID:', req.usuarioId);
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    console.log('✅ Usuario encontrado:', usuario.email);

    // Verificar que el email pertenezca al usuario
    if (usuario.email !== email.toLowerCase().trim()) {
      console.log('❌ Email no coincide. Usuario:', usuario.email, 'Solicitado:', email);
      return res.status(400).json({
        success: false,
        mensaje: 'El email no coincide con tu cuenta',
      });
    }

    // Generar código aleatorio de 4 dígitos
    const codigoVerificacion = Math.floor(1000 + Math.random() * 9000).toString();

    // Guardar código y expiración en usuario (5 minutos)
    usuario.codigoRecuperacion = codigoVerificacion;
    usuario.expiracionCodigo = new Date(Date.now() + 5 * 60 * 1000);
    await usuario.save();

    console.log(`📧 CODIGO DE VERIFICACIÓN para ${email}: ${codigoVerificacion}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Código enviado a tu correo',
      debug: process.env.NODE_ENV === 'development' ? codigoVerificacion : undefined,
    });
  } catch (error) {
    console.error('❌ Error al enviar código:', error);
    return res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al enviar código',
    });
  }
};

// @desc    Cambiar contraseña con código de verificación
// @route   POST /api/auth/cambiar-contrasena
// @access  Private
exports.cambiarContrasena = async (req, res) => {
  try {
    const { codigo, nuevaPassword } = req.body;

    console.log('📝 Intentando cambiar contraseña:');
    console.log('Código recibido:', codigo, 'Tipo:', typeof codigo);
    console.log('Usuario ID:', req.usuarioId);

    // Validar que el usuario esté autenticado
    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado',
      });
    }

    // Validar inputs
    if (!codigo || !nuevaPassword) {
      return res.status(400).json({
        success: false,
        mensaje: 'Código y nueva contraseña son requeridos',
      });
    }

    // Validar nueva contraseña (al menos requirements básicos)
    if (nuevaPassword.length < 12) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 12 caracteres',
      });
    }

    if (!/[A-Z]/.test(nuevaPassword) || !/[a-z]/.test(nuevaPassword) || 
        !/[0-9]/.test(nuevaPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(nuevaPassword)) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos',
      });
    }

    // Buscar usuario (incluir campos de recuperación)
    const usuario = await Usuario.findById(req.usuarioId).select('+codigoRecuperacion +expiracionCodigo');
    if (!usuario) {
      console.log('❌ Usuario no encontrado con ID:', req.usuarioId);
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    console.log('✅ Usuario encontrado:', usuario.email);
    console.log('Código guardado en BD:', usuario.codigoRecuperacion, 'Tipo:', typeof usuario.codigoRecuperacion);
    console.log('Código recibido:', codigo, 'Tipo:', typeof codigo);
    console.log('¿Códigos iguales?', usuario.codigoRecuperacion === codigo);
    console.log('¿Expiración pasada?', new Date() > usuario.expiracionCodigo);

    // Verificar código
    if (!usuario.codigoRecuperacion) {
      console.log('❌ No hay código de recuperación guardado');
      return res.status(400).json({
        success: false,
        mensaje: 'No hay código solicitado. Solicita uno nuevo',
      });
    }

    const codigoLimpio = String(usuario.codigoRecuperacion).trim();
    const codigoRecibido = String(codigo).trim();

    if (codigoLimpio !== codigoRecibido) {
      console.log(`❌ Código NO coincide. BD: "${codigoLimpio}" vs Recibido: "${codigoRecibido}"`);
      return res.status(400).json({
        success: false,
        mensaje: 'Código inválido',
      });
    }

    // Verificar expiración
    if (new Date() > usuario.expiracionCodigo) {
      console.log('❌ Código expirado');
      return res.status(400).json({
        success: false,
        mensaje: 'El código ha expirado. Solicita uno nuevo',
      });
    }

    console.log('✅ Código válido. Cambiando contraseña...');

    // Actualizar contraseña
    usuario.password = nuevaPassword;
    usuario.codigoRecuperacion = null;
    usuario.expiracionCodigo = null;
    await usuario.save();

    console.log('✅ Contraseña actualizada correctamente');

    res.status(200).json({
      success: true,
      mensaje: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al cambiar contraseña',
    });
  }
};

// @desc    Actualizar usuario (Admin)
// @route   PUT /api/auth/usuarios/:id
// @access  Private
exports.actualizarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, zona } = req.body;

    // Validar que el usuario esté autenticado
    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado',
      });
    }

    // Validar que el ID sea válido
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de usuario inválido',
      });
    }

    // Preparar datos para actualizar
    const datosActualizar = {};
    if (nombre) datosActualizar.nombre = nombre;
    if (email) datosActualizar.email = email.toLowerCase().trim();
    if (telefono) datosActualizar.telefono = telefono;
    if (zona) datosActualizar.zona = zona;

    // Si se intenta actualizar el email, verificar que no exista otro usuario con ese email
    if (email) {
      const emailNormalizado = email.toLowerCase().trim();
      const usuarioExistente = await Usuario.findOne({ 
        email: emailNormalizado,
        _id: { $ne: id }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          mensaje: 'Este email ya está siendo usado por otro usuario',
        });
      }
    }

    // Buscar y actualizar usuario
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      datosActualizar,
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Usuario actualizado correctamente',
      usuario,
    });
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al actualizar usuario',
    });
  }
};

// @desc    Crear usuario desde admin (ciudadano u operador)
// @route   POST /api/auth/usuarios
// @access  Private (solo admin)
exports.crearUsuarioAdmin = async (req, res) => {
  try {
    const { nombre, email, password, dni, telefono, zona, rol } = req.body;

    // Validar que el usuario esté autenticado
    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado',
      });
    }

    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !email || !password || !dni || !telefono || !zona || !rol) {
      return res.status(400).json({
        success: false,
        mensaje: 'Por favor proporciona todos los campos: nombre, email, contraseña, DNI, teléfono, zona y rol',
      });
    }

    // Validar que el rol sea válido
    if (rol !== 'ciudadano' && rol !== 'operador') {
      return res.status(400).json({
        success: false,
        mensaje: 'El rol debe ser "ciudadano" u "operador"',
      });
    }

    // Normalizar email
    const emailNormalizado = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    let usuario = await Usuario.findOne({ email: emailNormalizado });
    if (usuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'El email ya está registrado',
      });
    }

    // Verificar si el DNI ya existe
    const usuarioDNI = await Usuario.findOne({ dni });
    if (usuarioDNI) {
      return res.status(400).json({
        success: false,
        mensaje: 'El DNI ya está registrado',
      });
    }

    // Crear nuevo usuario con el rol especificado
    usuario = await Usuario.create({
      nombre,
      email: emailNormalizado,
      password,
      dni,
      telefono,
      zona,
      rol,
      estado: 'activo',
    });

    console.log(`✅ Nuevo ${rol} creado:`, usuario.nombre);

    res.status(201).json({
      success: true,
      mensaje: `${rol.charAt(0).toUpperCase() + rol.slice(1)} creado correctamente`,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        zona: usuario.zona,
        rol: usuario.rol,
        estado: usuario.estado,
        createdAt: usuario.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error creando usuario desde admin:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al crear usuario',
    });
  }
};
