/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   Datos ficticios y "base de datos" del navegador (localStorage).
   Todo es inventado: personas, teléfonos, CURP, correos y folios.
   Las fechas se generan alrededor del día de hoy para que la demo
   siempre se vea al día.
   ============================================================ */
(function () {
  'use strict';

  const CLAVE = 'constructor-demo.datos.v4';
  const CLAVE_SESION = 'constructor-demo.sesion.v1';

  /* ---------- Utilidades de generación ---------- */
  function aleatorio(semilla) {
    let s = semilla >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const CARACTERES_CURP = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  function curpValida(base17) {
    let suma = 0;
    for (let i = 0; i < 17; i++) suma += CARACTERES_CURP.indexOf(base17[i]) * (18 - i);
    return base17 + ((10 - suma % 10) % 10);
  }

  /* ---------- Catálogos de opciones ---------- */
  const MOTIVOS_VALIDACION = ['Cliente no reconoce la venta', 'Datos incorrectos', 'Cliente no recibe NIP', 'Fuera de cobertura', 'Ya tiene el servicio'];
  const MOTIVOS_BACKOFFICE = ['Sin pago inicial', 'Tarjeta rechazada', 'Cliente cancela', 'No se localiza al cliente'];
  const BANCOS = ['BBVA', 'Banorte', 'Santander', 'Banamex', 'HSBC', 'Banco Azteca'];
  const opciones = (lista) => lista.map((t) => ({ valor: t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), etiqueta: t }));

  /* ---------- Formulario de venta (Telefonía, con BackOffice) ---------- */
  function definicionVenta() {
    return {
      secciones: [
        {
          clave: 'cliente', titulo: 'Datos del cliente', descripcion: 'Tal como aparecen en su identificación oficial.', color: '#0d9488',
          filas: [
            [{ clave: 'nombre', etiqueta: 'Nombre(s)', tipo: 'TextoCorto', ancho: 6, obligatorio: 'Siempre' },
             { clave: 'apellidos', etiqueta: 'Apellidos', tipo: 'TextoCorto', ancho: 6, obligatorio: 'Siempre' }],
            [{ clave: 'curp', etiqueta: 'CURP', tipo: 'TextoCorto', ancho: 4, obligatorio: 'Siempre', validador: 'Curp', corregible: true },
             { clave: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'Fecha', ancho: 4, obligatorio: 'Siempre' },
             { clave: 'edad', etiqueta: 'Edad', tipo: 'Calculado', ancho: 4, formula: 'EDAD({fecha_nacimiento})' }],
            [{ clave: 'id_lead', etiqueta: 'Teléfono celular', tipo: 'TextoCorto', ancho: 4, obligatorio: 'Siempre', validador: 'Telefono', ayuda: 'A este número llega el NIP.', editableBackOffice: true, corregible: true },
             { clave: 'correo', etiqueta: 'Correo electrónico', tipo: 'Correo', ancho: 4 },
             { clave: 'estado', etiqueta: 'Estado', tipo: 'Estado', ancho: 4, obligatorio: 'Siempre' }],
            [{ clave: 'codigo_postal', etiqueta: 'Código postal', tipo: 'TextoCorto', ancho: 3, obligatorio: 'Siempre', validador: 'CodigoPostal' },
             { clave: 'domicilio', etiqueta: 'Calle, número y colonia', tipo: 'TextoCorto', ancho: 9, obligatorio: 'Siempre', corregible: true, editableBackOffice: true }],
          ],
        },
        {
          clave: 'plan', titulo: 'Plan contratado', color: '#0891b2',
          filas: [
            [{ clave: 'plan', etiqueta: 'Plan', tipo: 'Catalogo', ancho: 6, obligatorio: 'Siempre', catalogo: 'planes', corregible: true },
             { clave: 'precio', etiqueta: 'Precio mensual', tipo: 'DatoCatalogo', ancho: 3, campoCatalogo: 'plan', columna: 'precio', tipoColumna: 'Moneda' },
             { clave: 'velocidad', etiqueta: 'Velocidad (Mbps)', tipo: 'DatoCatalogo', ancho: 3, campoCatalogo: 'plan', columna: 'velocidad', tipoColumna: 'Entero' }],
            [{ clave: 'tipo_contratacion', etiqueta: 'Tipo de contratación', tipo: 'OpcionUnica', ancho: 6, obligatorio: 'Siempre', opciones: opciones(['Nueva', 'Portabilidad']) },
             { clave: 'compania_anterior', etiqueta: 'Compañía anterior', tipo: 'Lista', ancho: 6, obligatorio: 'Siempre', opciones: opciones(['Telmex', 'Totalplay', 'Izzi', 'Otra']),
               condicion: { union: 'Todas', reglas: [{ campo: 'tipo_contratacion', operador: 'Igual', valor: 'portabilidad' }] } }],
            [{ clave: 'adicionales', etiqueta: 'Servicios adicionales', tipo: 'OpcionMultiple', ancho: 6, opciones: opciones(['TV adicional', 'Extensor wifi', 'Línea fija']) },
             { clave: 'descuento', etiqueta: 'Descuento', tipo: 'Porcentaje', ancho: 3, minimo: 0, maximo: 30, ayuda: 'Hasta 30%.' },
             { clave: 'total_mensual', etiqueta: 'Total mensual', tipo: 'Calculado', ancho: 3, formato: 'Moneda', formula: 'REDONDEAR({precio} * (1 - {descuento} / 100) + SUMA({costo_linea}), 2)' }],
            [{ clave: 'sucursal', etiqueta: 'Sucursal', tipo: 'Catalogo', ancho: 6, obligatorio: 'Siempre', catalogo: 'sucursales' },
             { clave: 'domicilia', etiqueta: '¿Domicilia el pago?', tipo: 'SiNo', ancho: 3, obligatorio: 'Siempre' },
             { clave: 'banco_cliente', etiqueta: 'Banco', tipo: 'Lista', ancho: 3, obligatorio: 'Siempre', opciones: opciones(BANCOS),
               condicion: { union: 'Todas', reglas: [{ campo: 'domicilia', operador: 'Igual', valor: 'si' }] } }],
          ],
        },
        {
          clave: 'lineas', titulo: 'Líneas adicionales', descripcion: 'Agrega hasta 3 líneas móviles al paquete.', color: '#7c3aed', repetible: true, minimo: 0, maximo: 3,
          filas: [
            [{ clave: 'numero_linea', etiqueta: 'Número de la línea', tipo: 'TextoCorto', ancho: 6, obligatorio: 'Siempre', validador: 'Telefono' },
             { clave: 'costo_linea', etiqueta: 'Costo mensual', tipo: 'Moneda', ancho: 6, obligatorio: 'Siempre', minimo: 0 }],
          ],
        },
        {
          clave: 'cierre', titulo: 'Cierre de la venta', color: '#0f766e',
          filas: [
            [{ clave: 'aviso_cierre', tipo: 'Informativo', ancho: 12, contenido: 'Antes de enviar, lee al cliente el resumen del plan y confirma que acepta el cargo mensual.' }],
            [{ clave: 'comentarios', etiqueta: 'Comentarios', tipo: 'TextoLargo', ancho: 12, longitudMaxima: 500 }],
            [{ clave: 'comprobante', etiqueta: 'Comprobante de domicilio', tipo: 'Archivo', ancho: 6, ayuda: 'PDF o imagen, hasta 10 MB.' },
             { clave: 'usuario', etiqueta: 'Usuario', tipo: 'Usuario', ancho: 3 },
             { clave: 'nombre_usuario', etiqueta: 'Capturó', tipo: 'NombreUsuario', ancho: 3 }],
          ],
        },
        {
          clave: 'backoffice', titulo: 'BackOffice', descripcion: 'La llenan Validación y Cobro.', color: '#b45309', soloBackOffice: true,
          filas: [
            [{ clave: 'estatus_validacion', etiqueta: 'Estatus de validación', tipo: 'Lista', ancho: 4, esEstatusValidacion: true, opciones: opciones(['Aprobada', 'Rechazada']) },
             { clave: 'motivo_de_rechazo_validacion', etiqueta: 'Motivo de rechazo', tipo: 'Lista', ancho: 4, obligatorio: 'Siempre', opciones: opciones(MOTIVOS_VALIDACION),
               condicion: { union: 'Todas', reglas: [{ campo: 'estatus_validacion', operador: 'Igual', valor: 'rechazada' }] } },
             { clave: 'valido', etiqueta: 'Validó', tipo: 'Validador', ancho: 2 },
             { clave: 'nip', etiqueta: 'NIP', tipo: 'Nip', ancho: 2 }],
            [{ clave: 'estatus_backoffice', etiqueta: 'Estatus de BackOffice', tipo: 'Lista', ancho: 4, esEstatusBackOffice: true, opciones: opciones(['Cobrada', 'Rechazada']) },
             { clave: 'motivo_de_rechazo_backoffice', etiqueta: 'Motivo de rechazo', tipo: 'Lista', ancho: 4, obligatorio: 'Siempre', opciones: opciones(MOTIVOS_BACKOFFICE),
               condicion: { union: 'Todas', reglas: [{ campo: 'estatus_backoffice', operador: 'Igual', valor: 'rechazada' }] } },
             { clave: 'cobro', etiqueta: 'Cobró', tipo: 'Cobrador', ancho: 4 }],
            [{ clave: 'folio_cobro', etiqueta: 'Folio de cobro', tipo: 'TextoCorto', ancho: 4, obligatorio: 'ConCondicion',
               condicionObligatorio: { union: 'Todas', reglas: [{ campo: 'estatus_backoffice', operador: 'Igual', valor: 'cobrada' }] } },
             { clave: 'banco_seleccionado_por_backoffice', etiqueta: 'Banco seleccionado por backoffice', tipo: 'Lista', ancho: 4, opciones: opciones(BANCOS.concat(['No domicilia'])) },
             { clave: 'plastico', etiqueta: 'Últimos 4 del plástico', tipo: 'TextoCorto', ancho: 4, longitudMaxima: 4 }],
          ],
        },
      ],
    };
  }

  /* ---------- Formulario de retención (sin BackOffice) ---------- */
  function definicionRetencion() {
    return {
      secciones: [
        {
          clave: 'cliente', titulo: 'Cliente', color: '#0f766e',
          filas: [
            [{ clave: 'cuenta', etiqueta: 'Número de cuenta', tipo: 'TextoCorto', ancho: 4, obligatorio: 'Siempre' },
             { clave: 'nombre_cliente', etiqueta: 'Nombre del cliente', tipo: 'TextoCorto', ancho: 8, obligatorio: 'Siempre' }],
            [{ clave: 'motivo_cancelacion', etiqueta: 'Motivo de la cancelación', tipo: 'Lista', ancho: 6, obligatorio: 'Siempre', opciones: opciones(['Precio', 'Fallas en el servicio', 'Se cambia de domicilio', 'Mejor oferta de otra compañía', 'Otro']) },
             { clave: 'oferta', etiqueta: 'Oferta presentada', tipo: 'Lista', ancho: 6, opciones: opciones(['Descuento temporal', 'Upgrade de velocidad', 'Meses sin costo', 'Ninguna']) }],
            [{ clave: 'resultado', etiqueta: 'Resultado', tipo: 'OpcionUnica', ancho: 6, obligatorio: 'Siempre', opciones: opciones(['Retenido', 'No retenido']) },
             { clave: 'descuento_otorgado', etiqueta: 'Descuento otorgado', tipo: 'Porcentaje', ancho: 3, condicion: { union: 'Todas', reglas: [{ campo: 'resultado', operador: 'Igual', valor: 'retenido' }] } },
             { clave: 'meses', etiqueta: 'Meses', tipo: 'Entero', ancho: 3, minimo: 1, maximo: 12, condicion: { union: 'Todas', reglas: [{ campo: 'resultado', operador: 'Igual', valor: 'retenido' }] } }],
            [{ clave: 'comentarios', etiqueta: 'Comentarios', tipo: 'TextoLargo', ancho: 12 }],
            [{ clave: 'usuario', etiqueta: 'Usuario', tipo: 'Usuario', ancho: 6 }, { clave: 'nombre_usuario', etiqueta: 'Capturó', tipo: 'NombreUsuario', ancho: 6 }],
          ],
        },
      ],
    };
  }

  /* ---------- Datos iniciales ---------- */
  function crear() {
    const r = aleatorio(20261117);
    const elegir = (l) => l[Math.floor(r() * l.length)];
    const entre = (a, b) => a + Math.floor(r() * (b - a + 1));
    const ahora = Date.now();
    const haceDias = (dias, hora, minuto) => {
      const d = new Date(ahora - dias * 86400000);
      // hora de México (UTC-6)
      d.setUTCHours(hora + 6, minuto || 0, entre(0, 59), 0);
      return d.toISOString();
    };

    const campanas = [
      { id: 1, nombre: 'Telefonía Residencial', prefijo: 'TEL', consecutivo: 0, corte: 26, usaBackOffice: true, activa: true,
        descripcion: 'Venta de paquetes de internet, TV y telefonía en casa.', subcampanas: [{ id: 11, nombre: 'Zona Norte', activa: true }, { id: 12, nombre: 'Zona Centro', activa: true }] },
      { id: 2, nombre: 'Retención Móvil', prefijo: 'RET', consecutivo: 0, corte: 1, usaBackOffice: false, activa: true,
        descripcion: 'Llamadas a clientes que piden cancelar su plan para ofrecerles quedarse.', subcampanas: [] },
      { id: 3, nombre: 'Encuestas de Servicio', prefijo: '', consecutivo: 0, corte: 1, usaBackOffice: false, activa: false, descripcion: '', subcampanas: [] },
    ];

    const U = (id, usuario, nombre, rol, campanaId, extra) => Object.assign({
      id, usuario, nombre, rol, campanaId: campanaId || null, supervisorId: null, subcampanas: [], supervisa: [], activo: true,
      ultimoAcceso: haceDias(entre(0, 3), entre(8, 18), entre(0, 59)), creado: haceDias(entre(120, 300), 10), bloqueado: false,
    }, extra || {});
    const usuarios = [
      U(1, 'admin.demo', 'Ana Morales', 'Administrador'),
      U(2, 'gerente.demo', 'Ricardo Valdez', 'Gerente'),
      U(3, 'coordinador.demo', 'Patricia Navarro', 'Coordinador', 1),
      U(4, 'supervisor.demo', 'Jorge Castillo', 'Supervisor', 1, { supervisa: [11] }),
      U(5, 'mfuentes', 'Mariana Fuentes', 'Supervisor', 1, { supervisa: [12] }),
      U(6, 'agente.demo', 'Carlos García', 'Agente', 1, { supervisorId: 4, subcampanas: [11] }),
      U(7, 'sherrera', 'Sofía Herrera', 'Agente', 1, { supervisorId: 4, subcampanas: [11] }),
      U(8, 'mlopez', 'Miguel López', 'Agente', 1, { supervisorId: 4, subcampanas: [11] }),
      U(9, 'vreyes', 'Valeria Reyes', 'Agente', 1, { supervisorId: 5, subcampanas: [12] }),
      U(10, 'ajimenez', 'Andrés Jiménez', 'Agente', 1, { supervisorId: 5, subcampanas: [12] }),
      U(11, 'ftorres', 'Fernanda Torres', 'Agente', 1, { supervisorId: 5, subcampanas: [12] }),
      U(12, 'afiliado.demo', 'Karla Mendoza', 'Afiliado', 1, { supervisorId: 4, subcampanas: [11] }),
      U(13, 'backoffice.demo', 'Daniel Salinas', 'BackOffice', 1),
      U(14, 'lpena', 'Luis Peña', 'BackOffice', 1),
      U(15, 'supbackoffice.demo', 'Elena Ramos', 'Supervisor BackOffice', 1),
      U(16, 'hdelgado', 'Héctor Delgado', 'Supervisor', 2),
      U(17, 'nrios', 'Natalia Ríos', 'Agente', 2, { supervisorId: 16 }),
      U(18, 'ocruz', 'Omar Cruz', 'Agente', 2, { supervisorId: 16 }),
      U(19, 'rsoto', 'Raúl Soto', 'Agente', 1, { supervisorId: 4, subcampanas: [11], activo: false }),
    ];

    const catalogos = [
      { id: 1, campanaId: 1, clave: 'planes', nombre: 'Planes', columnas: [
        { clave: 'clave', titulo: 'Clave', tipo: 'Texto', esClave: true, activa: true },
        { clave: 'nombre', titulo: 'Plan', tipo: 'Texto', esDescripcion: true, activa: true },
        { clave: 'precio', titulo: 'Precio', tipo: 'Numero', activa: true },
        { clave: 'velocidad', titulo: 'Velocidad', tipo: 'Numero', activa: true },
        { clave: 'vigente_desde', titulo: 'Vigente desde', tipo: 'Fecha', activa: true }],
        registros: [
          { valores: { clave: 'P050', nombre: 'Internet 50 Mbps', precio: 299, velocidad: 50, vigente_desde: '2025-01-15' }, activo: false },
          { valores: { clave: 'P100', nombre: 'Internet 100 Mbps', precio: 389, velocidad: 100, vigente_desde: '2025-06-01' }, activo: true },
          { valores: { clave: 'P200', nombre: 'Internet 200 Mbps + TV', precio: 549, velocidad: 200, vigente_desde: '2025-06-01' }, activo: true },
          { valores: { clave: 'P500', nombre: 'Internet 500 Mbps + TV + Teléfono', precio: 749, velocidad: 500, vigente_desde: '2025-09-01' }, activo: true },
          { valores: { clave: 'P1000', nombre: 'Internet 1 Gbps Premium', precio: 999, velocidad: 1000, vigente_desde: '2026-02-01' }, activo: true },
        ] },
      { id: 2, campanaId: 1, clave: 'sucursales', nombre: 'Sucursales', columnas: [
        { clave: 'clave', titulo: 'Número', tipo: 'Texto', esClave: true, activa: true },
        { clave: 'nombre', titulo: 'Sucursal', tipo: 'Texto', esDescripcion: true, activa: true },
        { clave: 'ciudad', titulo: 'Ciudad', tipo: 'Texto', activa: true }],
        registros: [['001', 'Monterrey Centro', 'Monterrey'], ['002', 'Guadalupe', 'Guadalupe'], ['003', 'San Nicolás', 'San Nicolás de los Garza'],
          ['004', 'Apodaca', 'Apodaca'], ['005', 'Saltillo Norte', 'Saltillo'], ['006', 'Torreón', 'Torreón'], ['007', 'Chihuahua', 'Chihuahua'],
          ['008', 'Hermosillo', 'Hermosillo']].map(([c, n, ci]) => ({ valores: { clave: c, nombre: n, ciudad: ci }, activo: true })) },
    ];

    const defVenta = definicionVenta();
    const formularios = [
      { id: 1, campanaId: 1, nombre: 'Venta residencial', subcampanas: [], activo: true, versiones: [
        { numero: 1, estado: 'Retirada', creada: haceDias(160, 10), publicada: haceDias(158, 9), autor: 1, usaBackOffice: false, definicion: defVenta },
        { numero: 2, estado: 'Retirada', creada: haceDias(90, 11), publicada: haceDias(88, 9), autor: 1, usaBackOffice: true, definicion: defVenta },
        { numero: 3, estado: 'Publicada', creada: haceDias(40, 12), publicada: haceDias(38, 9), autor: 1, usaBackOffice: true, definicion: defVenta },
        { numero: 4, estado: 'Borrador', creada: haceDias(1, 16), publicada: null, autor: 1, usaBackOffice: true, definicion: defVenta },
      ] },
      { id: 2, campanaId: 2, nombre: 'Retención de cliente', subcampanas: [], activo: true, versiones: [
        { numero: 1, estado: 'Publicada', creada: haceDias(70, 10), publicada: haceDias(69, 9), autor: 1, usaBackOffice: false, definicion: definicionRetencion() },
      ] },
    ];

    /* ---------- Capturas ---------- */
    const NOMBRES = ['María Fernanda', 'José Luis', 'Ana Karen', 'Juan Carlos', 'Guadalupe', 'Luis Alberto', 'Rosa María', 'Francisco', 'Laura', 'Roberto',
      'Gabriela', 'Alejandro', 'Paola', 'Eduardo', 'Diana', 'Raúl', 'Adriana', 'Arturo', 'Claudia', 'Sergio', 'Mónica', 'Javier', 'Verónica', 'Enrique'];
    const APELLIDOS = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez',
      'Morales', 'Vázquez', 'Jiménez', 'Reyes', 'Díaz', 'Torres', 'Gutiérrez', 'Ruiz', 'Mendoza', 'Aguilar', 'Ortiz', 'Castillo'];
    const ESTADOS = ['Nuevo León', 'Coahuila de Zaragoza', 'Chihuahua', 'Sonora', 'Tamaulipas', 'Durango'];
    const CALLES = ['Av. Constitución', 'Calle Roble', 'Av. Juárez', 'Calle Pino', 'Blvd. Díaz Ordaz', 'Calle Cedro', 'Av. Hidalgo', 'Calle Nogal'];
    const COLONIAS = ['Centro', 'Las Lomas', 'Jardines del Valle', 'San Rafael', 'Los Pinos', 'Villa Verde', 'Mitras', 'Contry'];
    const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    const consonanteInterna = (t) => (sinAcentos(t).slice(1).match(/[B-DF-HJ-NP-TV-Z]/) || ['X'])[0];

    const capturas = [];
    let idCaptura = 1000;
    const planes = catalogos[0].registros.filter((x) => x.activo);
    const sucursales = catalogos[1].registros;
    const agentesTel = usuarios.filter((u) => u.campanaId === 1 && (u.rol === 'Agente' || u.rol === 'Afiliado'));
    const bo = [13, 14, 15];

    function respuestasVenta(agente, r) {
      const nombre = elegir(NOMBRES);
      const ap1 = elegir(APELLIDOS), ap2 = elegir(APELLIDOS);
      const anio = entre(1965, 2003), mes = entre(1, 12), dia = entre(1, 28);
      const p2 = (n) => String(n).padStart(2, '0');
      const vocal = (sinAcentos(ap1).slice(1).match(/[AEIOU]/) || ['X'])[0];
      const base = sinAcentos(ap1)[0] + vocal + sinAcentos(ap2)[0] + sinAcentos(nombre)[0] + String(anio).slice(2) + p2(mes) + p2(dia) +
        elegir(['H', 'M']) + 'NL' + consonanteInterna(ap1) + consonanteInterna(ap2) + consonanteInterna(nombre) + (anio >= 2000 ? 'A' : '0');
      const plan = elegir(planes);
      const portabilidad = r() < 0.45;
      const domicilia = r() < 0.6;
      const lineas = r() < 0.25 ? Array.from({ length: entre(1, 2) }, () => ({ numero_linea: '5550' + String(entre(100000, 999999)), costo_linea: elegir([99, 149, 199]) })) : [];
      const sucursal = elegir(sucursales);
      return {
        generales: {
          nombre: nombre.toUpperCase(), apellidos: (ap1 + ' ' + ap2).toUpperCase(), curp: curpValida(base),
          fecha_nacimiento: anio + '-' + p2(mes) + '-' + p2(dia), id_lead: '5550' + String(entre(100000, 999999)),
          correo: sinAcentos(nombre.split(' ')[0]).toLowerCase() + '.' + sinAcentos(ap1).toLowerCase() + entre(1, 99) + '@ejemplo.com',
          estado: elegir(ESTADOS), codigo_postal: String(entre(64000, 67999)), domicilio: elegir(CALLES) + ' ' + entre(10, 2400) + ', Col. ' + elegir(COLONIAS),
          plan: plan.valores.clave, tipo_contratacion: portabilidad ? 'portabilidad' : 'nueva',
          compania_anterior: portabilidad ? elegir(['telmex', 'totalplay', 'izzi', 'otra']) : null,
          adicionales: r() < 0.4 ? [elegir(['tv_adicional', 'extensor_wifi', 'linea_fija'])] : [],
          descuento: r() < 0.3 ? elegir([5, 10, 15]) : null, sucursal: sucursal.valores.clave, domicilia: domicilia ? 'si' : 'no',
          banco_cliente: domicilia ? elegir(opciones(BANCOS)).valor : null,
          comentarios: r() < 0.3 ? elegir(['Instalación por la tarde.', 'Cliente pide factura.', 'Referido por un vecino.', 'Llamar antes de ir.']) : null,
          comprobante: r() < 0.7 ? [{ nombre: 'comprobante_' + sinAcentos(nombre.split(' ')[0]).toLowerCase() + '.pdf', tamano: entre(120, 900) * 1024 }] : [],
          usuario: agente.usuario, nombre_usuario: agente.nombre,
        },
        repeticiones: { lineas },
        catalogo: { plan: plan.valores, sucursal: sucursal.valores },
      };
    }

    for (let dias = 44; dias >= 0; dias--) {
      agentesTel.forEach(function (agente) {
        if (!agente.activo && dias < 20) return;
        const domingo = new Date(ahora - dias * 86400000).getUTCDay() === 0;
        const cuantas = domingo ? (r() < 0.2 ? 1 : 0) : entre(0, 3);
        for (let k = 0; k < cuantas; k++) {
          const hora = entre(9, 19);
          const enviada = haceDias(dias, hora, entre(0, 59));
          if (new Date(enviada).getTime() > ahora) continue;
          const resp = respuestasVenta(agente, r);
          const cap = {
            id: ++idCaptura, folio: null, formularioId: 1, version: 3, campanaId: 1, agenteId: agente.id, supervisorId: agente.supervisorId,
            subcampanaId: agente.subcampanas[0] || null, estado: 'Enviada', creada: enviada, enviada,
            respuestas: { generales: resp.generales, repeticiones: resp.repeticiones }, copiaCatalogo: resp.catalogo,
            estatusValidacion: null, fechaValidacion: null, validadorId: null, estatusBackOffice: null, fechaCobro: null, cobradorId: null,
            rechazadaPorNip: false, aprobadaSinNip: false, nipVerificado: false, correcciones: [], rechazos: [], apartadaPor: null,
          };
          const edadHoras = (ahora - new Date(enviada).getTime()) / 3600000;
          // Validación
          if (edadHoras > 4 || r() < 0.3) {
            const tv = new Date(new Date(enviada).getTime() + entre(20, 300) * 60000);
            if (tv.getTime() < ahora) {
              const esAfiliado = agente.rol === 'Afiliado';
              const porNip = esAfiliado && r() < 0.25;
              const aprobada = !porNip && r() < 0.82;
              const validador = elegir(bo);
              cap.estatusValidacion = aprobada ? 'aprobada' : 'rechazada';
              cap.fechaValidacion = tv.toISOString();
              cap.validadorId = validador;
              cap.nipVerificado = esAfiliado && aprobada;
              cap.rechazadaPorNip = porNip;
              cap.respuestas.generales.estatus_validacion = cap.estatusValidacion;
              cap.respuestas.generales.valido = usuarios.find((u) => u.id === validador).nombre;
              if (!aprobada) {
                const motivo = porNip ? 'Intentos de NIP agotados' : elegir(MOTIVOS_VALIDACION);
                if (!porNip) cap.respuestas.generales.motivo_de_rechazo_validacion = opciones([motivo])[0].valor;
                cap.rechazos.push({ etapa: 'Validación', motivo, usuarioId: validador, fecha: cap.fechaValidacion });
              }
              // Cobro
              if (aprobada && edadHoras > 26) {
                const tc = new Date(tv.getTime() + entre(2, 70) * 3600000);
                if (tc.getTime() < ahora && r() < 0.86) {
                  const cobrada = r() < 0.86;
                  const cobrador = elegir(bo);
                  cap.estatusBackOffice = cobrada ? 'cobrada' : 'rechazada';
                  cap.fechaCobro = tc.toISOString();
                  cap.cobradorId = cobrador;
                  cap.respuestas.generales.estatus_backoffice = cap.estatusBackOffice;
                  cap.respuestas.generales.cobro = usuarios.find((u) => u.id === cobrador).nombre;
                  if (cobrada) {
                    cap.respuestas.generales.folio_cobro = 'FC-' + entre(100000, 999999);
                    cap.respuestas.generales.banco_seleccionado_por_backoffice = r() < 0.62 ? opciones([elegir(BANCOS)])[0].valor : 'no_domicilia';
                    cap.respuestas.generales.plastico = String(entre(1000, 9999));
                  } else {
                    const motivo = elegir(MOTIVOS_BACKOFFICE);
                    cap.respuestas.generales.motivo_de_rechazo_backoffice = opciones([motivo])[0].valor;
                    cap.rechazos.push({ etapa: 'BackOffice', motivo, usuarioId: cobrador, fecha: cap.fechaCobro });
                  }
                }
              }
            }
          }
          capturas.push(cap);
        }
      });
    }

    // Retención: capturas más sencillas
    const agentesRet = usuarios.filter((u) => u.campanaId === 2 && u.rol === 'Agente');
    for (let dias = 30; dias >= 0; dias--) {
      agentesRet.forEach(function (agente) {
        for (let k = 0; k < entre(0, 3); k++) {
          const enviada = haceDias(dias, entre(9, 18), entre(0, 59));
          if (new Date(enviada).getTime() > ahora) continue;
          const retenido = r() < 0.55;
          capturas.push({
            id: ++idCaptura, folio: null, formularioId: 2, version: 1, campanaId: 2, agenteId: agente.id, supervisorId: agente.supervisorId,
            subcampanaId: null, estado: 'Enviada', creada: enviada, enviada, copiaCatalogo: {},
            respuestas: { generales: {
              cuenta: String(entre(10000000, 99999999)), nombre_cliente: (elegir(NOMBRES) + ' ' + elegir(APELLIDOS)).toUpperCase(),
              motivo_cancelacion: elegir(['precio', 'fallas_en_el_servicio', 'se_cambia_de_domicilio', 'mejor_oferta_de_otra_compania']),
              oferta: elegir(['descuento_temporal', 'upgrade_de_velocidad', 'meses_sin_costo']), resultado: retenido ? 'retenido' : 'no_retenido',
              descuento_otorgado: retenido ? elegir([10, 15, 20]) : null, meses: retenido ? elegir([3, 6]) : null,
              usuario: agente.usuario, nombre_usuario: agente.nombre }, repeticiones: {} },
            correcciones: [], rechazos: [],
          });
        }
      });
    }

    // Folios consecutivos por campaña, en orden de envío
    capturas.sort((a, b) => new Date(a.enviada) - new Date(b.enviada));
    capturas.forEach(function (c) {
      const campana = campanas.find((x) => x.id === c.campanaId);
      campana.consecutivo += 1;
      c.folio = campana.prefijo + '-' + String(campana.consecutivo).padStart(6, '0');
    });

    // Correcciones de supervisor (con historial)
    capturas.filter((c) => c.campanaId === 1).slice(-120).filter((_, i) => i % 23 === 5).forEach(function (c) {
      const anterior = c.respuestas.generales.domicilio;
      c.respuestas.generales.domicilio = anterior.replace(/\d+/, (n) => String(Number(n) + 2));
      c.correcciones.push({ fecha: new Date(new Date(c.enviada).getTime() + 5400000).toISOString(), usuarioId: c.supervisorId,
        motivo: 'El cliente corrigió el número exterior.', cambios: [{ campo: 'domicilio', etiqueta: 'Calle, número y colonia', antes: anterior, despues: c.respuestas.generales.domicilio }] });
    });

    // Borradores del agente de la demo
    [[0, 11, { nombre: 'ROSA MARÍA', apellidos: 'GÓMEZ DÍAZ', tipo_contratacion: 'portabilidad', plan: 'P200' }],
     [1, 17, { nombre: 'EDUARDO', apellidos: 'RUIZ ORTIZ', id_lead: '5550428817' }]].forEach(function ([dias, hora, generales]) {
      const creada = haceDias(dias, hora, 20);
      capturas.push({ id: ++idCaptura, folio: null, formularioId: 1, version: 3, campanaId: 1, agenteId: 6, supervisorId: 4, subcampanaId: 11,
        estado: 'Borrador', creada, enviada: null, guardada: creada, respuestas: { generales, repeticiones: { lineas: [] } }, copiaCatalogo: {}, correcciones: [], rechazos: [] });
    });

    /* ---------- Metas ---------- */
    const metas = { campana: {}, supervisor: {}, agente: {} };
    const metaPersonal = { 6: { meta: 3, frecuencia: 'Diaria' } };

    /* ---------- Bitácora ---------- */
    const bitacora = [];
    let idBit = 1;
    const B = (dias, hora, usuarioId, accion, entidad, nombre, cambios) => bitacora.push({ id: idBit++, fecha: haceDias(dias, hora, entre(0, 59)), usuarioId, accion, entidad, nombre, cambios: cambios || [] });
    B(150, 10, 1, 'Crear', 'Campaña', 'Telefonía Residencial', [{ campo: 'Prefijo de folio', antes: null, despues: 'TEL' }, { campo: 'Día de corte', antes: null, despues: '26' }]);
    B(92, 11, 1, 'Editar', 'Campaña', 'Telefonía Residencial', [{ campo: 'Usa BackOffice', antes: 'No', despues: 'Sí' }]);
    B(88, 9, 1, 'Publicar', 'Formulario', 'Venta residencial · versión 2', []);
    B(70, 10, 1, 'Crear', 'Campaña', 'Retención Móvil', [{ campo: 'Prefijo de folio', antes: null, despues: 'RET' }]);
    B(60, 16, 1, 'Crear', 'Usuario', 'Karla Mendoza', [{ campo: 'Rol', antes: null, despues: 'Afiliado' }, { campo: 'Supervisor', antes: null, despues: 'Jorge Castillo' }]);
    B(41, 12, 1, 'Cargar Excel', 'Catálogo', 'Planes', [{ campo: 'Registros nuevos', antes: null, despues: '1' }, { campo: 'Actualizados', antes: null, despues: '3' }, { campo: 'Desactivados', antes: null, despues: '1' }]);
    B(38, 9, 1, 'Publicar', 'Formulario', 'Venta residencial · versión 3', []);
    B(30, 17, 1, 'Restablecer contraseña', 'Usuario', 'Sofía Herrera', []);
    B(21, 10, 1, 'Desactivar', 'Usuario', 'Raúl Soto', [{ campo: 'Activo', antes: 'Sí', despues: 'No' }]);
    B(14, 13, 1, 'Editar', 'Usuario', 'Fernanda Torres', [{ campo: 'Supervisor', antes: 'Jorge Castillo', despues: 'Mariana Fuentes' }, { campo: 'Subcampañas', antes: 'Zona Norte', despues: 'Zona Centro' }]);
    B(9, 11, 1, 'Generar', 'Contraseña sin NIP', 'Telefonía Residencial', []);
    B(6, 15, 15, 'Consultar NIP', 'Captura', capturas.find((c) => c.agenteId === 12) ? capturas.find((c) => c.agenteId === 12).folio : 'TEL-000010', []);
    B(3, 10, 1, 'Editar', 'Campaña', 'Telefonía Residencial', [{ campo: 'Descripción', antes: 'Venta de paquetes de internet.', despues: 'Venta de paquetes de internet, TV y telefonía en casa.' }]);
    B(1, 16, 1, 'Crear borrador', 'Formulario', 'Venta residencial · versión 4', []);
    B(0, 9, 1, 'Desbloquear', 'Usuario', 'Miguel López', [{ campo: 'Bloqueado', antes: 'Sí', despues: 'No' }]);

    // Dos ventas en validación que está trabajando otra persona (el candado de la bandeja)
    capturas.filter((c) => c.campanaId === 1 && c.estado === 'Enviada' && !c.estatusValidacion).slice(0, 2)
      .forEach((c) => { c.apartadaPor = 14; });

    return {
      version: 1, campanas, usuarios, catalogos, formularios, capturas, metas, metaPersonal, bitacora,
      nips: {}, contrasenaSinNip: { 1: { contrasena: 'Hb4tR8mWq2', generada: haceDias(1, 9), generadaPor: 1 } },
      siguiente: { captura: idCaptura + 1, bitacora: idBit, usuario: 20 },
    };
  }

  /* ---------- Acceso ---------- */
  function cargar() {
    try {
      const g = localStorage.getItem(CLAVE);
      if (g) return JSON.parse(g);
    } catch (err) { /* nada */ }
    const d = crear();
    guardarDatos(d);
    return d;
  }

  function guardarDatos(d) {
    try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (err) { /* sin almacenamiento */ }
  }

  let datos = cargar();

  window.D = {
    get datos() { return datos; },
    guardar: () => guardarDatos(datos),
    restablecer: () => { try { localStorage.removeItem(CLAVE); } catch (err) { /* nada */ } datos = cargar(); },
    MOTIVOS_VALIDACION, MOTIVOS_BACKOFFICE, BANCOS, opciones,

    sesion: () => { try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null'); } catch (err) { return null; } },
    iniciarSesion: (id) => { try { localStorage.setItem(CLAVE_SESION, JSON.stringify({ id })); } catch (err) { /* nada */ } },
    cerrarSesion: () => { try { localStorage.removeItem(CLAVE_SESION); } catch (err) { /* nada */ } },

    usuario: (id) => datos.usuarios.find((u) => u.id === Number(id)),
    campana: (id) => datos.campanas.find((c) => c.id === Number(id)),
    formulario: (id) => datos.formularios.find((f) => f.id === Number(id)),
    captura: (id) => datos.capturas.find((c) => c.id === Number(id)),
    catalogo: (campanaId, clave) => datos.catalogos.find((c) => c.campanaId === Number(campanaId) && c.clave === clave),
    versionPublicada: (f) => f.versiones.find((v) => v.estado === 'Publicada'),
    version: (f, n) => f.versiones.find((v) => v.numero === Number(n)),
    nombre: (id) => { const u = datos.usuarios.find((x) => x.id === Number(id)); return u ? u.nombre : '—'; },

    registrar: function (usuarioId, accion, entidad, nombre, cambios) {
      datos.bitacora.push({ id: datos.siguiente.bitacora++, fecha: new Date().toISOString(), usuarioId, accion, entidad, nombre, cambios: cambios || [] });
    },
  };
})();
