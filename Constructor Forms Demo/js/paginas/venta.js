/* Trabajar una venta de BackOffice, con NIP simulado (VentaBackOffice.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'bandejas', titulo: 'Venta', roles: ['Administrador', 'BackOffice', 'Supervisor BackOffice'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador';
  const esSupervisorBo = yo.rol === 'Supervisor BackOffice';
  const INTENTOS = 5;
  const VIGENCIA_MIN = 10;
  const ESPERA_SEG = 60;
  const MOTIVO_SIN_NIP = 'Cliente no recibe NIP';

  const c = D.captura(C.param('id'));
  const bandejaOrigen = c ? R.bandejaDe(c) : null;
  const urlBandeja = () => 'bandejas.html?bandeja=' + (bandejaOrigen || 'validacion');

  function error(texto) {
    p.contenido.innerHTML = C.marcar('VentaBackOffice', '<p class="migas"><a href="' + urlBandeja() + '">Bandejas</a> / ...</p><p>' + e(texto) + ' <a href="' + urlBandeja() + '">Volver a las bandejas</a></p>');
  }
  if (!c || c.estado !== 'Enviada' || (!esAdministrador && c.campanaId !== yo.campanaId)) { error('La venta no existe o no es de tu campaña.'); return; }
  if (!bandejaOrigen) { error('Esta venta ya se cobró: ya no está en ninguna bandeja.'); return; }
  if (c.apartadaPor && c.apartadaPor !== yo.id) { error(D.nombre(c.apartadaPor) + ' está trabajando esta venta.'); return; }

  // Se toma la venta: nadie más la puede trabajar mientras esté abierta
  c.apartadaPor = yo.id;
  D.guardar();
  let soltada = false;
  function soltar() {
    if (soltada) return;
    soltada = true;
    if (c.apartadaPor === yo.id) { c.apartadaPor = null; D.guardar(); }
  }
  window.addEventListener('pagehide', soltar);

  const f = D.formulario(c.formularioId);
  const def = D.version(f, c.version).definicion;
  const campana = D.campana(c.campanaId);
  const agente = D.usuario(c.agenteId);
  const esDeAfiliado = agente.rol === 'Afiliado';
  const etapa = R.BANDEJAS.find((b) => b.clave === bandejaOrigen).etapa;
  const deValidacion = etapa === 'Validacion';
  const campoEstatus = Motor.campos(def).find((x) => deValidacion ? x.esEstatusValidacion : x.esEstatusBackOffice);
  const campoQuien = Motor.campos(def).find((x) => x.tipo === (deValidacion ? 'Validador' : 'Cobrador'));
  const usaNip = esDeAfiliado && deValidacion && Motor.campos(def).some((x) => x.tipo === 'Nip');

  // BackOffice edita lo marcado como "BackOffice puede editarlo" y su sección, salvo el estatus de la otra etapa
  const deBackOffice = new Set();
  def.secciones.filter((s) => s.soloBackOffice).forEach((s) => s.filas.forEach((fi) => fi.forEach((x) => deBackOffice.add(x.clave))));
  const editables = Motor.campos(def).filter((x) => !x.desactivado && !Motor.SIN_CAPTURA.includes(x.tipo) && x.tipo !== 'Informativo' &&
    (x.editableBackOffice || deBackOffice.has(x.clave)) && !(deValidacion ? x.esEstatusBackOffice : x.esEstatusValidacion)).map((x) => x.clave);

  let edicion = JSON.parse(JSON.stringify(c.respuestas));
  let errores = null;
  let mensajeErrores = null;
  let hayCambios = false;
  let nipEscrito = '';

  /* ---------- NIP simulado ---------- */
  function estadoNip() {
    if (!D.datos.nips[c.id]) D.datos.nips[c.id] = { codigo: null, telefono: null, vence: null, usados: 0, ronda: 1, envioIntentado: false, ultimoEnvio: null, enviadoPor: null, intentosContrasena: 0, bloqueadoHasta: null };
    return D.datos.nips[c.id];
  }
  const enmascarar = (t) => t.length <= 4 ? t : '****' + t.slice(-4);
  const motivoValidacion = () => c.respuestas.generales.motivo_de_rechazo_validacion ? V.textoOpcion(c, 'motivo_de_rechazo_validacion') : null;
  const puedeAprobarSinNip = () => c.estatusValidacion === 'rechazada' && (motivoValidacion() || '').toLowerCase() === MOTIVO_SIN_NIP.toLowerCase();

  function enviarNip() {
    const n = estadoNip();
    if (c.autorizadaSinNip) { C.avisar('Esta venta ya está autorizada sin NIP: no hace falta enviarlo.', 'error'); return; }
    if (c.nipVerificado) { C.avisar('El NIP de esta venta ya se verificó.', 'error'); return; }
    const telefono = String(c.respuestas.generales.id_lead || '');
    n.envioIntentado = true;
    if (!/^\d{10}$/.test(telefono)) { D.guardar(); C.avisar('El ID lead "' + telefono + '" no es un teléfono de 10 dígitos. Corrígelo y guarda antes de enviar el NIP.', 'error'); dibujar(); return; }
    if (n.ultimoEnvio) {
      const faltan = Math.ceil(ESPERA_SEG - (Date.now() - new Date(n.ultimoEnvio).getTime()) / 1000);
      if (faltan > 0) { C.avisar('Espera ' + faltan + ' segundos para volver a enviar el NIP.', 'error'); return; }
    }
    // La ronda sube cuando se envía después de que la venta se rechazó: vuelve a tener 5 intentos
    if (c.estatusValidacion === 'rechazada' && n.ultimoEnvio && new Date(c.fechaValidacion) > new Date(n.ultimoEnvio)) { n.ronda++; n.usados = 0; }
    if (INTENTOS - n.usados <= 0) { C.avisar('Ya no quedan intentos en esta ronda: rechaza la venta para volver a intentarlo desde la bandeja de rechazadas.', 'error'); return; }
    n.codigo = String(Math.floor(100000 + Math.random() * 900000));
    n.telefono = telefono;
    n.vence = new Date(Date.now() + VIGENCIA_MIN * 60000).toISOString();
    n.ultimoEnvio = new Date().toISOString();
    n.enviadoPor = yo.id;
    D.guardar();
    C.avisar('NIP enviado a ' + enmascarar(telefono) + '. Vale ' + VIGENCIA_MIN + ' minutos.');
    // En la demo no sale ningún SMS: se muestra lo que le llegaría al cliente
    setTimeout(() => C.avisar('Demo · SMS simulado al cliente: tu NIP es ' + n.codigo + '.'), 400);
    dibujar();
  }

  function verificarNip() {
    const n = estadoNip();
    const escrito = nipEscrito.trim();
    if (!/^\d{6}$/.test(escrito)) { C.avisar('El NIP son 6 dígitos.', 'error'); return; }
    if (!n.codigo) { C.avisar('Primero envía el NIP al cliente.', 'error'); return; }
    if (new Date(n.vence) < new Date()) { C.avisar('El NIP ya venció. Envía uno nuevo.', 'error'); return; }
    nipEscrito = '';
    if (escrito === n.codigo) {
      c.nipVerificado = true;
      D.guardar();
      C.avisar('NIP correcto: ya puedes aprobar la venta.');
      dibujar();
      return;
    }
    n.usados++;
    const restantes = INTENTOS - n.usados;
    if (restantes > 0) {
      D.guardar();
      C.avisar(restantes === 1 ? 'NIP incorrecto. Te queda 1 intento.' : 'NIP incorrecto. Te quedan ' + restantes + ' intentos.', 'error');
      dibujar();
      return;
    }
    // Al quinto intento fallido la venta se rechaza sola y se libera
    const antes = JSON.parse(JSON.stringify(c.respuestas));
    c.respuestas.generales.estatus_validacion = 'rechazada';
    if (campoQuien) c.respuestas.generales[campoQuien.clave] = yo.nombre;
    const ahora = new Date().toISOString();
    Object.assign(c, { estatusValidacion: 'rechazada', fechaValidacion: ahora, validadorId: yo.id, rechazadaPorNip: true });
    n.codigo = null;
    c.correcciones.push({ fecha: ahora, usuarioId: yo.id, motivo: 'Validación: Rechazada por NIP (' + INTENTOS + ' intentos fallidos)', cambios: V.cambios(def, antes, c.respuestas, c.campanaId) });
    c.rechazos.push({ etapa: 'Validación', motivo: 'Intentos de NIP agotados', usuarioId: yo.id, fecha: ahora });
    hayCambios = false;
    soltar();
    C.avisarDespues('NIP incorrecto. Se acabaron los ' + INTENTOS + ' intentos: la venta pasó a Rechazadas por validación como Rechazada por NIP.', 'error');
    location.href = 'bandejas.html?bandeja=rechazadas-validacion';
  }

  function autorizarSinNip(escrita) {
    const n = estadoNip();
    if (c.nipVerificado) { C.avisar('El NIP de esta venta ya se verificó: no hace falta la contraseña.', 'error'); return; }
    if (!escrita.trim()) { C.avisar('Escribe la contraseña.', 'error'); return; }
    if (n.bloqueadoHasta && new Date(n.bloqueadoHasta) > new Date()) {
      const min = Math.ceil((new Date(n.bloqueadoHasta) - new Date()) / 60000);
      C.avisar('Por 5 intentos fallidos, podrás volver a intentarlo en ' + (min === 1 ? '1 minuto' : min + ' minutos') + '.', 'error');
      return;
    }
    const vigente = D.datos.contrasenaSinNip[c.campanaId];
    if (!vigente || !vigente.contrasena) { C.avisar('No hay una contraseña vigente para esta campaña. Pídele al Administrador que genere una.', 'error'); return; }
    if (escrita.trim() !== vigente.contrasena) {
      n.intentosContrasena++;
      const restantes = 5 - n.intentosContrasena;
      if (restantes <= 0) {
        n.intentosContrasena = 0;
        n.bloqueadoHasta = new Date(Date.now() + 15 * 60000).toISOString();
        D.guardar();
        C.avisar('Contraseña incorrecta. Por 5 intentos fallidos, podrás volver a intentarlo en 15 minutos.', 'error');
      } else {
        D.guardar();
        C.avisar(restantes === 1 ? 'Contraseña incorrecta. Te queda 1 intento.' : 'Contraseña incorrecta. Te quedan ' + restantes + ' intentos.', 'error');
      }
      return;
    }
    c.autorizadaSinNip = true;
    c.correcciones.push({ fecha: new Date().toISOString(), usuarioId: yo.id, motivo: 'Validación: autorizada sin NIP con la contraseña', cambios: [] });
    D.guardar();
    C.avisar('Contraseña correcta: ya puedes elegir Aprobada y guardar la venta.');
    dibujar();
  }

  function seccionNip() {
    const n = estadoNip();
    let h = '<section class="nip" aria-labelledby="titulo-nip"><h2 id="titulo-nip">NIP del cliente</h2>';
    if (c.nipVerificado) return h + '<p class="verificado">✓ NIP verificado: ya puedes aprobar la venta.</p></section>';
    if (c.autorizadaSinNip) return h + '<p class="verificado">✓ Autorizada sin NIP: ya puedes elegir Aprobada y guardar la venta.</p></section>';
    const vigente = n.codigo && new Date(n.vence) > new Date();
    const restantes = Math.max(0, INTENTOS - n.usados);
    h += '<p class="detalle">Es una venta de afiliado: para aprobarla, envía un NIP por SMS al teléfono del ID lead y escribe el que te dicte el cliente. La opción Aprobada se habilita al verificar el NIP; mientras tanto, solo se puede rechazar.</p>' +
      '<p class="estado-nip">' + (vigente ? '<span>Enviado a <strong>' + e(enmascarar(n.telefono)) + '</strong>, vale hasta las ' + C.fechas.hora(n.vence) + '.</span>' : '<span>Todavía no hay un NIP vigente.</span>') +
      ' <span' + (restantes <= 2 ? ' class="pocos"' : '') + '>' + (restantes === 1 ? 'Queda 1 intento' : 'Quedan ' + restantes + ' intentos') + (n.ronda > 1 ? ' (ronda ' + n.ronda + ')' : '') + '.</span></p>' +
      '<div class="acciones-nip"><button type="button" id="enviar-nip"' + (restantes === 0 ? ' disabled' : '') + '>' + (vigente ? 'Reenviar NIP' : 'Enviar NIP') + '</button>' +
      '<label>NIP que dicta el cliente <input id="nip-escrito" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="6 dígitos" value="' + e(nipEscrito) + '"' + (vigente ? '' : ' disabled') + ' /></label>' +
      '<button type="button" class="principal" id="verificar-nip"' + (vigente && nipEscrito.trim().length === 6 ? '' : ' disabled') + '>Verificar</button></div>';
    if (esSupervisorBo) {
      h += '<div class="sin-nip"><h3>Aprobar sin NIP</h3>';
      if (puedeAprobarSinNip() && !n.envioIntentado) h += '<p class="detalle">Para aprobar sin NIP, primero intenta enviarle el NIP al cliente desde esta venta.</p>';
      else if (puedeAprobarSinNip()) {
        h += '<p class="detalle">Si al cliente no le llega el NIP, escribe la contraseña de la semana que te dio el Administrador.</p>' +
          '<div class="acciones-nip"><label>Contraseña <input class="contrasena" type="password" id="contrasena" autocomplete="new-password" /></label>' +
          '<button type="button" class="principal" id="autorizar" disabled>Autorizar</button></div>';
      } else h += '<p class="detalle">Para aprobar sin NIP, primero rechaza la venta con el motivo "' + MOTIVO_SIN_NIP + '" y guárdala.</p>';
      h += '</div>';
    }
    return h + '</section>';
  }

  /* ---------- Pantalla ---------- */
  function dibujar() {
    document.title = c.folio + ' - Constructor Forms';
    const sub = campana.subcampanas.find((s) => s.id === c.subcampanaId);
    const nombreBandeja = R.BANDEJAS.find((b) => b.clave === bandejaOrigen).nombre;
    let h = '<p class="migas"><a href="' + urlBandeja() + '">Bandejas</a> / ' + e(c.folio) + '</p>' +
      '<div class="encabezado"><div><h1>' + e(c.folio) + ' <span class="etiqueta">' + e(nombreBandeja) + '</span>' +
      (c.rechazadaPorNip ? ' <span class="etiqueta etiqueta-aviso" title="Alguna vez se rechazó sola al agotar los intentos del NIP">rechazada por NIP</span>' : '') +
      (c.aprobadaSinNip ? ' <span class="etiqueta etiqueta-aviso" title="Se aprobó con la contraseña porque el cliente no recibe el NIP">aprobada sin NIP</span>' : '') + '</h1>' +
      '<p class="detalle">' + e(f.nombre) + ' · ' + e(campana.nombre) + (sub ? ' / ' + e(sub.nombre) : '') + '</p>' +
      '<p class="detalle">' + (esDeAfiliado ? 'Afiliado' : 'Agente') + ': <strong>' + e(agente.nombre) + '</strong> · Supervisor: ' + e(c.supervisorId ? D.nombre(c.supervisorId) : 'sin supervisor') +
      ' · enviada el ' + C.fechas.corta(c.enviada) + ' a las ' + C.fechas.hora(c.enviada) + '</p>' +
      (c.validadorId || c.cobradorId ? '<p class="detalle">Validó: ' + e(c.validadorId ? D.nombre(c.validadorId) : '—') + (c.cobradorId ? ' · Cobró: ' + e(D.nombre(c.cobradorId)) : '') + '</p>' : '') +
      '</div><div class="botones"><button type="button" id="soltar">Soltar y volver</button><button type="button" class="principal" id="guardar">Guardar</button></div></div>';
    if (usaNip) h += seccionNip();
    h += '<div class="instrucciones"><p>Elige el ' + (deValidacion ? 'estatus de validación' : 'estatus de BackOffice') + ' y corrige los campos habilitados si hace falta; los demás se ven deshabilitados. Al guardar no se pide motivo: el historial registra quién cambió qué.</p>' +
      (mensajeErrores ? '<p class="resumen-errores" role="alert">' + e(mensajeErrores) + '</p>' : '') + '</div><div id="formulario-venta"></div>{{hijo:0}}';
    p.contenido.innerHTML = C.marcar('VentaBackOffice', h, [V.historial(c, false)]);

    const bloqueadas = usaNip && !c.nipVerificado && !c.autorizadaSinNip ? ['aprobada'] : [];
    Formulario.montar(document.getElementById('formulario-venta'), {
      def, respuestas: edicion, editables, bloqueadas, errores: errores || undefined,
      opciones: V.opcionesMotor(c, null, { conservarCopia: true, incluirBackOffice: true }),
      alCambiar: () => { hayCambios = true; },
    });

    const nip = document.getElementById('nip-escrito');
    if (nip) nip.addEventListener('input', function () {
      nipEscrito = nip.value.replace(/\D/g, '');
      if (nip.value !== nipEscrito) nip.value = nipEscrito;
      document.getElementById('verificar-nip').disabled = nipEscrito.length !== 6;
    });
    const contrasena = document.getElementById('contrasena');
    if (contrasena) contrasena.addEventListener('input', () => { document.getElementById('autorizar').disabled = !contrasena.value.trim(); });
  }

  function guardar() {
    const g = edicion.generales;
    const estatusAnterior = deValidacion ? c.estatusValidacion : c.estatusBackOffice;
    const nuevo = g[campoEstatus.clave] || null;
    const cambiaEstatus = nuevo !== estatusAnterior;
    // Validó o Cobró se llena con quien cambia el estatus
    if (cambiaEstatus && campoQuien) g[campoQuien.clave] = yo.nombre;
    const op = V.opcionesMotor(c, null, { conservarCopia: true, incluirBackOffice: true });
    const r = Motor.validar(def, JSON.parse(JSON.stringify(edicion)), op);
    if (!nuevo && !r.errores.campos[campoEstatus.clave]) { r.errores.campos[campoEstatus.clave] = 'Elige el estatus.'; r.errores.total++; }
    if (r.errores.total > 0) {
      errores = r.errores;
      mensajeErrores = r.errores.total === 1 ? 'La venta tiene 1 error. Revísalo antes de guardar.' : 'La venta tiene ' + r.errores.total + ' errores. Revísalos antes de guardar.';
      C.avisar(mensajeErrores, 'error');
      dibujar();
      const primero = document.querySelector('.con-error, .resumen-errores');
      if (primero) primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (deValidacion && nuevo === 'aprobada' && esDeAfiliado && !c.nipVerificado && !c.autorizadaSinNip) {
      C.avisar('Esta venta es de un afiliado: para aprobarla primero verifica el NIP del cliente.', 'error');
      return;
    }
    const limpias = Motor.limpiar(def, edicion, r.estado);
    const original = JSON.parse(JSON.stringify(c.respuestas));
    const antes = Motor.limpiar(def, original, Motor.evaluar(def, original, op));
    const lista = V.cambios(def, antes, limpias, c.campanaId);
    if (!lista.length) { C.avisar('No hay cambios que guardar.', 'error'); return; }

    const ahora = new Date().toISOString();
    const estabaRechazada = estatusAnterior === 'rechazada';
    const motivoAntes = deValidacion ? original.generales.motivo_de_rechazo_validacion : original.generales.motivo_de_rechazo_backoffice;
    V.actualizarCopia(def, c, limpias);
    c.respuestas = limpias;
    if (deValidacion) {
      c.estatusValidacion = nuevo;
      if (cambiaEstatus) { c.validadorId = yo.id; c.fechaValidacion = ahora; }
      if (nuevo === 'aprobada' && c.autorizadaSinNip) c.aprobadaSinNip = true;
    } else {
      c.estatusBackOffice = nuevo;
      if (cambiaEstatus) { c.cobradorId = yo.id; c.fechaCobro = ahora; }
    }
    const textoEstatus = Motor.texto(campoEstatus, nuevo);
    c.correcciones.push({ fecha: ahora, usuarioId: yo.id, motivo: (deValidacion ? 'Validación: ' : 'BackOffice: ') + textoEstatus, cambios: lista });
    // El rechazo queda en el historial de rechazos (para las estadísticas de motivos)
    const claveMotivo = deValidacion ? 'motivo_de_rechazo_validacion' : 'motivo_de_rechazo_backoffice';
    if (nuevo === 'rechazada' && (!estabaRechazada || motivoAntes !== limpias.generales[claveMotivo])) {
      c.rechazos.push({ etapa: deValidacion ? 'Validación' : 'BackOffice', motivo: V.textoOpcion(c, claveMotivo), usuarioId: yo.id, fecha: ahora });
    }
    hayCambios = false;
    soltar();
    const destino = R.bandejaDe(c);
    const nombreDestino = destino ? R.BANDEJAS.find((b) => b.clave === destino).nombre : null;
    C.avisarDespues('Venta ' + c.folio + ' guardada como ' + textoEstatus + (nombreDestino ? ': quedó en la bandeja ' + nombreDestino + '.' : '.'));
    location.href = urlBandeja();
  }

  p.contenido.addEventListener('click', function (ev) {
    switch (ev.target.id) {
      case 'guardar': guardar(); break;
      case 'soltar':
        if (hayCambios && !confirm('Tienes cambios sin guardar. ¿Soltar la venta sin guardarlos?')) return;
        hayCambios = false;
        soltar();
        location.href = urlBandeja();
        break;
      case 'enviar-nip': enviarNip(); break;
      case 'verificar-nip': verificarNip(); break;
      case 'autorizar': autorizarSinNip(document.getElementById('contrasena').value); break;
    }
  });
  document.addEventListener('click', function (ev) {
    const a = ev.target.closest('a[href]');
    if (!a || a.getAttribute('href').startsWith('#')) return;
    if (hayCambios && !confirm('Tienes cambios sin guardar. ¿Salir sin guardarlos?')) { ev.preventDefault(); return; }
    hayCambios = false;
    soltar();
  }, true);
  window.addEventListener('beforeunload', (ev) => { if (hayCambios) { ev.preventDefault(); ev.returnValue = ''; } });

  C.avisar('Estás trabajando la venta ' + c.folio + '.');
  dibujar();
})();
