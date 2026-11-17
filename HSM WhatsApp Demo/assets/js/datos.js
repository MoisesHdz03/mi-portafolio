/* ============================================================
   HSM WHATSAPP · DEMO
   Datos ficticios y "base de datos" del navegador (localStorage).
   Equivale a las tablas campaigns, users, clients,
   shipment_batches, shipments y customer_responses.
   ============================================================ */
(function () {
  'use strict';

  const CLAVE = 'hsmdemo.datos.v1';
  const CLAVE_SESION = 'hsmdemo.sesion.v1';

  /* ---------- Utilidades ---------- */
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

  function fechaSql(d) {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function sid(prefijo, r) {
    let s = prefijo;
    for (let i = 0; i < 32; i++) s += '0123456789abcdef'[Math.floor(r() * 16)];
    return s;
  }

  /* ---------- Plantillas (como las devuelve Twilio Content API) ---------- */
  const PLANTILLAS = [
    {
      name: 'recordatorio_pago', language: 'es', status: 'approved', active: 1, variables: ['1', '2', '3'],
      types: ['twilio/quick-reply'],
      body: 'Hola {{1}}, te recordamos que tu pago por {{2}} vence el {{3}}.\nEvita cargos por atraso realizando tu pago a tiempo.',
      actions: [{ type: 'QUICK_REPLY', title: 'Ya realicé mi pago' }, { type: 'QUICK_REPLY', title: 'Necesito ayuda' }],
      ejemplo: { 1: 'Mariana', 2: '$549.00', 3: '20 de noviembre' },
    },
    {
      name: 'bienvenida_cliente', language: 'es', status: 'approved', active: 1, variables: ['1'],
      types: ['twilio/call-to-action'],
      body: '¡Bienvenido(a) {{1}}! Gracias por confiar en nosotros.\nA partir de hoy recibirás por este medio los avisos importantes de tu servicio.',
      actions: [{ type: 'URL', title: 'Consultar mi cuenta' }],
      ejemplo: { 1: 'Roberto' },
    },
    {
      name: 'promocion_velocidad', language: 'es', status: 'approved', active: 1, variables: ['1', '2'],
      types: ['twilio/media', 'twilio/quick-reply'], media: 'assets/img/promocion.svg',
      body: '{{1}}, ¡aprovecha! Duplica tu velocidad a {{2}} megas por el mismo precio durante 6 meses.\n¿Te interesa que un asesor te contacte?',
      actions: [{ type: 'QUICK_REPLY', title: 'Sí, me interesa' }, { type: 'QUICK_REPLY', title: 'No, gracias' }],
      ejemplo: { 1: 'Daniela', 2: '500' },
    },
    {
      name: 'confirmacion_instalacion', language: 'es', status: 'approved', active: 1, variables: ['1', '2', '3'],
      types: ['twilio/quick-reply'],
      body: 'Hola {{1}}, tu instalación está programada para el {{2}} en un horario de {{3}}.\nPor favor confirma que estarás en el domicilio.',
      actions: [{ type: 'QUICK_REPLY', title: 'Confirmar' }, { type: 'QUICK_REPLY', title: 'Reprogramar' }],
      ejemplo: { 1: 'Jorge', 2: 'jueves 19 de noviembre', 3: '9:00 a 13:00 h' },
    },
    {
      name: 'encuesta_satisfaccion', language: 'es', status: 'approved', active: 1, variables: ['1'],
      types: ['twilio/quick-reply'],
      body: '{{1}}, gracias por comunicarte con nosotros.\n¿Cómo calificarías la atención que recibiste?',
      actions: [{ type: 'QUICK_REPLY', title: 'Excelente' }, { type: 'QUICK_REPLY', title: 'Buena' }, { type: 'QUICK_REPLY', title: 'Mala' }],
      ejemplo: { 1: 'Patricia' },
    },
    {
      name: 'aviso_mantenimiento', language: 'es', status: 'approved', active: 1, variables: [],
      types: ['twilio/text'],
      body: 'Te informamos que el próximo domingo de 02:00 a 05:00 h realizaremos mantenimiento programado en tu zona.\nDurante ese horario el servicio podría presentar intermitencias. Gracias por tu comprensión.',
      actions: [],
      ejemplo: {},
    },
    {
      name: 'payment_reminder_en', language: 'en', status: 'approved', active: 0, variables: ['1', '2'],
      types: ['twilio/text'],
      body: 'Hi {{1}}, this is a friendly reminder that your payment is due on {{2}}.',
      actions: [],
      ejemplo: { 1: 'Michael', 2: 'November 20' },
    },
    {
      name: 'seguimiento_cotizacion', language: 'es', status: 'pending', active: 1, variables: ['1', '2'],
      types: ['twilio/quick-reply'],
      body: 'Hola {{1}}, ¿pudiste revisar la cotización {{2}} que te enviamos?\nCon gusto resolvemos tus dudas.',
      actions: [{ type: 'QUICK_REPLY', title: 'Tengo dudas' }, { type: 'QUICK_REPLY', title: 'Ya no me interesa' }],
      ejemplo: { 1: 'Fernanda', 2: 'COT-1042' },
    },
    {
      name: 'reactivacion_cuenta', language: 'es', status: 'rejected', active: 0, variables: ['1'],
      types: ['twilio/text'],
      body: '{{1}}, te extrañamos. Reactiva tu cuenta hoy y recibe un mes gratis.',
      actions: [],
      ejemplo: { 1: 'Luis' },
    },
  ];

  const NOMBRES = ['María Fernanda', 'José Luis', 'Ana Karen', 'Juan Carlos', 'Guadalupe', 'Luis Alberto', 'Rosa María', 'Francisco', 'Laura', 'Roberto',
    'Gabriela', 'Alejandro', 'Paola', 'Eduardo', 'Diana', 'Raúl', 'Adriana', 'Arturo', 'Claudia', 'Sergio', 'Mónica', 'Javier', 'Verónica', 'Enrique',
    'Beatriz', 'Fernando', 'Sandra', 'Martín', 'Alicia', 'Ricardo', 'Itzel', 'Omar', 'Ximena', 'Emilio', 'Renata', 'Hugo'];
  const APELLIDOS = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales',
    'Vázquez', 'Jiménez', 'Reyes', 'Díaz', 'Torres', 'Gutiérrez', 'Ruiz', 'Mendoza', 'Aguilar', 'Ortiz', 'Castillo', 'Romero', 'Álvarez', 'Navarro'];

  const ERRORES = [
    '63003 - El número no tiene una cuenta de WhatsApp activa.',
    '63024 - Destinatario inválido para el remitente.',
    '63049 - Meta decidió no entregar este mensaje para mantener la calidad del ecosistema.',
    '63018 - Se alcanzó el límite de mensajes por segundo.',
    '30008 - Error desconocido al entregar el mensaje.',
  ];

  const RESPUESTAS_TEXTO = ['Gracias por el aviso', '¿Cuál es el costo?', 'Llámenme por la tarde, por favor', 'Ok', '¿Puedo pagar en tienda?', 'Ya no vivo en ese domicilio'];

  /* ---------- Datos iniciales ---------- */
  function crearDatosIniciales() {
    const r = aleatorio(20261117);
    const ahora = new Date();
    const haceDias = (dias, horas, minutos) => {
      const d = new Date(ahora);
      d.setDate(d.getDate() - dias);
      d.setHours(horas, minutos || 0, Math.floor(r() * 60), 0);
      return d;
    };
    const sumarSeg = (d, s) => new Date(d.getTime() + s * 1000);
    const elegir = (lista) => lista[Math.floor(r() * lista.length)];
    const telefono = () => '5550' + String(Math.floor(r() * 1000000)).padStart(6, '0');

    const usuarios = [
      { id: 1, name: 'Laura Medina', username: 'lmedina', password: 'demo1234', role: 'full_admin', status: 1, last_login: fechaSql(haceDias(0, 8, 42)), created_at: fechaSql(haceDias(210, 10)) },
      { id: 2, name: 'Diego Ramírez', username: 'dramirez', password: 'demo1234', role: 'admin', status: 1, last_login: fechaSql(haceDias(1, 17, 5)), created_at: fechaSql(haceDias(180, 9)) },
      { id: 3, name: 'Sofía Castro', username: 'scastro', password: 'demo1234', role: 'admin', status: 1, last_login: fechaSql(haceDias(3, 12, 30)), created_at: fechaSql(haceDias(95, 11)) },
      { id: 4, name: 'Andrés Peña', username: 'apena', password: 'demo1234', role: 'admin', status: 0, last_login: null, created_at: fechaSql(haceDias(60, 16)) },
    ];

    const campanas = PLANTILLAS.map(function (p, i) {
      return {
        id: 10 + i,
        name: p.name,
        template_sid: sid('HX', r),
        variables_count: p.variables.length,
        template_variables: JSON.stringify(p.variables),
        template_language: p.language,
        template_status: p.status,
        source: 'twilio',
        status: p.active,
        creation_date: fechaSql(haceDias(120 - i * 9, 10)),
        last_sync: fechaSql(haceDias(0, 8, 15)),
        body: p.body,
        media: p.media || null,
        actions: p.actions,
        types: p.types,
        ejemplo: p.ejemplo,
      };
    });

    const grupos = [];
    const clientes = [];
    const envios = [];
    const respuestas = [];
    const definicion = [
      // [plantilla, archivo, registros, días atrás, hora, resultado, creado por]
      ['recordatorio_pago', 'recordatorio_pago_oct_semana4.csv', 84, 24, 9, 'COMPLETED', 1],
      ['bienvenida_cliente', 'altas_octubre.csv', 46, 21, 11, 'COMPLETED', 2],
      ['promocion_velocidad', 'promo_500mb_zona_norte.csv', 120, 17, 10, 'PARTIAL', 1],
      ['encuesta_satisfaccion', 'encuesta_soporte_nov.csv', 64, 13, 16, 'COMPLETED', 3],
      ['aviso_mantenimiento', 'mantenimiento_sector_12.csv', 38, 10, 18, 'FAILED', 2],
      ['confirmacion_instalacion', 'instalaciones_semana46.csv', 52, 7, 9, 'PARTIAL', 1],
      ['recordatorio_pago', 'recordatorio_pago_nov_semana2.csv', 96, 4, 9, 'COMPLETED', 2],
      ['promocion_velocidad', 'promo_500mb_zona_centro.csv', 74, 1, 11, 'PENDING', 1],
      ['encuesta_satisfaccion', 'encuesta_ventas_nov.csv', 28, 0, 10, 'PENDING', 3],
    ];

    let idEnvio = 1000;
    let idCliente = 5000;
    let idRespuesta = 1;
    definicion.forEach(function (d, i) {
      const [nombrePlantilla, archivo, total, dias, hora, resultado, creador] = d;
      const campana = campanas.find((c) => c.name === nombrePlantilla);
      const creado = haceDias(dias, hora, Math.floor(r() * 50));
      const grupo = {
        id: 101 + i, campaign_id: campana.id, file_name: archivo, total_records: total, status: resultado,
        created_by: creador, created_at: fechaSql(creado), started_at: null, completed_at: null,
      };
      const inicio = sumarSeg(creado, 600 + Math.floor(r() * 1800));
      if (resultado !== 'PENDING') {
        grupo.started_at = fechaSql(inicio);
        grupo.completed_at = fechaSql(sumarSeg(inicio, total * 2 + 40));
      }
      grupos.push(grupo);

      const variables = JSON.parse(campana.template_variables);
      for (let k = 0; k < total; k++) {
        const nombre = elegir(NOMBRES) + ' ' + elegir(APELLIDOS);
        const cliente = { id: idCliente++, name: nombre, phone: telefono(), batch_id: grupo.id, create_at: grupo.created_at };
        clientes.push(cliente);

        const valores = {};
        variables.forEach(function (v) { valores[v] = valorEjemplo(campana, v, nombre, r); });

        const envio = {
          id: idEnvio++, client_id: cliente.id, campaign_id: campana.id, batch_id: grupo.id, content_variables: JSON.stringify(valores),
          status: 'pending', created_at: grupo.created_at, twilio_sid: null, response_message: null,
          sent_at: null, delivered_at: null, read_at: null, failed_at: null, created_by: creador,
        };
        if (resultado !== 'PENDING') {
          const enviado = sumarSeg(inicio, k * 2 + Math.floor(r() * 2));
          envio.twilio_sid = sid('MM', r);
          const tasaError = resultado === 'FAILED' ? 1 : resultado === 'PARTIAL' ? 0.11 : 0.03;
          if (r() < tasaError) {
            envio.status = 'failed';
            envio.failed_at = fechaSql(sumarSeg(enviado, 3));
            envio.response_message = resultado === 'FAILED' ? ERRORES[1] : elegir(ERRORES);
          } else {
            envio.sent_at = fechaSql(enviado);
            const x = r();
            if (x < 0.06) {
              envio.status = 'sent';
            } else {
              envio.delivered_at = fechaSql(sumarSeg(enviado, 4 + Math.floor(r() * 20)));
              envio.status = 'delivered';
              if (x > 0.32) {
                envio.read_at = fechaSql(sumarSeg(enviado, 120 + Math.floor(r() * 14000)));
                envio.status = 'read';
              }
            }
            // Respuestas del cliente
            if (envio.status === 'read' && r() < 0.42) {
              const conBotones = campana.actions.filter((a) => a.type === 'QUICK_REPLY');
              const esBoton = conBotones.length > 0 && r() < 0.8;
              const boton = esBoton ? elegir(conBotones).title : null;
              respuestas.push({
                id: idRespuesta++, shipment_id: envio.id, message_sid: sid('SM', r), original_message_sid: envio.twilio_sid,
                response_type: esBoton ? 'button' : 'text', response_text: esBoton ? boton : elegir(RESPUESTAS_TEXTO),
                button_text: boton, button_payload: boton ? boton.toUpperCase().replace(/[^A-Z]+/g, '_') : null,
                from_number: 'whatsapp:+52' + cliente.phone, profile_name: nombre.split(' ')[0],
                created_at: fechaSql(sumarSeg(new Date(envio.read_at.replace(' ', 'T')), 30 + Math.floor(r() * 3600))),
              });
            }
          }
        }
        envios.push(envio);
      }
    });

    return { version: 1, usuarios, campanas, grupos, clientes, envios, respuestas, siguiente: { envio: idEnvio, cliente: idCliente, grupo: 101 + definicion.length, usuario: 5, respuesta: idRespuesta } };
  }

  function valorEjemplo(campana, variable, nombre, r) {
    const primer = nombre.split(' ')[0];
    const elegir = (l) => l[Math.floor(r() * l.length)];
    switch (campana.name + ':' + variable) {
      case 'recordatorio_pago:2': return elegir(['$399.00', '$449.00', '$549.00', '$649.00', '$899.00']);
      case 'recordatorio_pago:3': return elegir(['18 de noviembre', '20 de noviembre', '22 de noviembre']);
      case 'promocion_velocidad:2': return elegir(['300', '500', '1000']);
      case 'confirmacion_instalacion:2': return elegir(['martes 18 de noviembre', 'jueves 20 de noviembre', 'sábado 22 de noviembre']);
      case 'confirmacion_instalacion:3': return elegir(['9:00 a 13:00 h', '13:00 a 17:00 h']);
      case 'seguimiento_cotizacion:2': return 'COT-' + (1000 + Math.floor(r() * 900));
      case 'payment_reminder_en:2': return 'November 20';
      default: return primer;
    }
  }

  /* ---------- Acceso a los datos ---------- */
  function cargar() {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) return JSON.parse(guardado);
    } catch (e) { /* sin almacenamiento */ }
    const nuevos = crearDatosIniciales();
    guardar(nuevos);
    return nuevos;
  }

  function guardar(datos) {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* sin almacenamiento: dura la sesión */ }
  }

  let datos = cargar();

  window.HSM = {
    datos: function () { return datos; },
    guardar: function () { guardar(datos); },
    restablecer: function () {
      try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
      datos = cargar();
    },
    fechaSql: fechaSql,
    sid: function (prefijo) { return sid(prefijo, Math.random); },
    errores: ERRORES,
    respuestasTexto: RESPUESTAS_TEXTO,

    /* Sesión */
    sesion: function () {
      try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null'); } catch (e) { return null; }
    },
    iniciarSesion: function (usuario) {
      const s = { id: usuario.id, name: usuario.name, username: usuario.username, role: usuario.role };
      try { localStorage.setItem(CLAVE_SESION, JSON.stringify(s)); } catch (e) { /* nada */ }
      return s;
    },
    cerrarSesion: function () {
      try { localStorage.removeItem(CLAVE_SESION); } catch (e) { /* nada */ }
    },

    /* Consultas frecuentes */
    campana: function (id) { return datos.campanas.find((c) => c.id === Number(id)); },
    usuario: function (id) { return datos.usuarios.find((u) => u.id === Number(id)); },
    cliente: function (id) { return datos.clientes.find((c) => c.id === Number(id)); },
    grupo: function (id) { return datos.grupos.find((g) => g.id === Number(id)); },
    enviosDeGrupo: function (id) { return datos.envios.filter((e) => e.batch_id === Number(id)); },
    respuestaDe: function (idEnvio) { return datos.respuestas.find((x) => x.shipment_id === idEnvio); },
  };
})();
