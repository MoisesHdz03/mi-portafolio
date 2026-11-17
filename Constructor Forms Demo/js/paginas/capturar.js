/* Captura nueva o borrador (Captura.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'capturar', titulo: 'Captura', roles: ['Agente', 'Afiliado'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const campana = D.campana(yo.campanaId);

  let borrador = C.param('borrador') ? D.captura(C.param('borrador')) : null;
  if (borrador && (borrador.agenteId !== yo.id || borrador.estado !== 'Borrador')) borrador = null;
  const formulario = borrador ? D.formulario(borrador.formularioId) : D.formulario(C.param('formulario'));
  const version = formulario ? (borrador ? D.version(formulario, borrador.version) : D.versionPublicada(formulario)) : null;

  if (!formulario || !version || formulario.campanaId !== yo.campanaId) {
    p.contenido.innerHTML = C.marcar('Captura', '<p class="migas"><a href="captura-inicio.html">Capturar</a> / ...</p><p>Este formulario o borrador ya no está disponible. <a href="captura-inicio.html">Volver a capturar</a></p>');
    return;
  }
  document.title = formulario.nombre + ' - Constructor Forms';

  const def = version.definicion;
  const subcampanas = campana.subcampanas.filter((s) => s.activa && (!yo.subcampanas.length || yo.subcampanas.includes(s.id)));
  let respuestas = borrador ? JSON.parse(JSON.stringify(borrador.respuestas)) : { generales: {}, repeticiones: {} };
  let errores = null;
  let mensajeErrores = null;
  let hayCambios = false;
  let guardadoA = null;
  let confirmandoDescartar = false;
  let subcampanaId = borrador ? borrador.subcampanaId : (subcampanas.length === 1 ? subcampanas[0].id : null);
  let control = null;

  const opcionesMotor = () => ({ catalogos: R.catalogosDe(campana.id), usuario: { usuario: yo.usuario, nombre: yo.nombre }, hoy: C.fechas.hoy() });

  function textoEstado() {
    if (!borrador) return 'Captura nueva, sin guardar';
    return guardadoA ? 'Borrador guardado a las ' + C.fechas.hora(guardadoA) : 'Borrador';
  }

  function dibujar() {
    const migas = '<p class="migas"><a href="captura-inicio.html">Capturar</a> / ' + e(formulario.nombre) + '</p>';
    let h = migas + '<div class="encabezado"><div><h1>' + e(formulario.nombre) + '</h1><span class="detalle">Versión ' + version.numero + ' · ' + textoEstado() + '</span></div></div>';
    if (!campana.prefijo) h += '<p class="aviso" role="status">La campaña todavía no tiene prefijo de folio: puedes guardar borradores, pero no enviar.</p>';
    if (mensajeErrores) h += '<p class="resumen-errores" role="alert">' + e(mensajeErrores) + '</p>';
    if (subcampanas.length > 1) {
      h += '<label class="subcampana">Subcampaña <select id="subcampana"><option value="">Elige una subcampaña</option>' +
        subcampanas.map((s) => '<option value="' + s.id + '"' + (s.id === subcampanaId ? ' selected' : '') + '>' + e(s.nombre) + '</option>').join('') + '</select></label>';
    } else if (subcampanas.length === 1) {
      h += '<p class="detalle">Subcampaña: ' + e(subcampanas[0].nombre) + '</p>';
    }
    h += '<div id="formulario-captura"></div><div class="barra-acciones">';
    if (borrador) {
      h += confirmandoDescartar
        ? '<span>¿Descartar este borrador?</span><button type="button" class="peligro" data-accion-captura="descartar-si">Sí, descartar</button><button type="button" data-accion-captura="descartar-no">No</button>'
        : '<button type="button" class="peligro" data-accion-captura="descartar">Descartar borrador</button>';
    }
    h += '<span class="separador"></span><button type="button" data-accion-captura="guardar">Guardar borrador</button>' +
      '<button type="button" class="principal" data-accion-captura="enviar"' + (campana.prefijo ? '' : ' disabled') + '>Enviar</button></div>';
    p.contenido.innerHTML = C.marcar('Captura', h);

    control = Formulario.montar(document.getElementById('formulario-captura'), {
      def, respuestas, opciones: opcionesMotor(), errores: errores || undefined,
      alCambiar: () => { hayCambios = true; },
    });
    const sel = document.getElementById('subcampana');
    if (sel) sel.addEventListener('change', () => { subcampanaId = sel.value ? Number(sel.value) : null; hayCambios = true; });
  }

  function guardarBorrador() {
    const ahora = new Date().toISOString();
    if (!borrador) {
      borrador = { id: D.datos.siguiente.captura++, folio: null, formularioId: formulario.id, version: version.numero, campanaId: campana.id, agenteId: yo.id,
        supervisorId: yo.supervisorId, subcampanaId, estado: 'Borrador', creada: ahora, enviada: null, respuestas: null, copiaCatalogo: {}, correcciones: [], rechazos: [] };
      D.datos.capturas.push(borrador);
    }
    borrador.respuestas = JSON.parse(JSON.stringify(respuestas));
    borrador.subcampanaId = subcampanaId;
    borrador.guardada = ahora;
    D.guardar();
    guardadoA = ahora;
    hayCambios = false;
    history.replaceState(null, '', 'capturar.html?borrador=' + borrador.id);
    C.avisar('Borrador guardado.');
    dibujar();
  }

  function enviar() {
    if (subcampanas.length > 1 && !subcampanaId) {
      mensajeErrores = 'Elige la subcampaña antes de enviar.';
      C.avisar(mensajeErrores, 'error');
      dibujar();
      return;
    }
    const r = Motor.validar(def, JSON.parse(JSON.stringify(respuestas)), opcionesMotor());
    if (r.errores.total > 0) {
      errores = r.errores;
      mensajeErrores = r.errores.total === 1 ? 'La captura tiene 1 error. Revísalo antes de enviar.' : 'La captura tiene ' + r.errores.total + ' errores. Revísalos antes de enviar.';
      C.avisar(mensajeErrores, 'error');
      dibujar();
      const primero = document.querySelector('.con-error, .resumen-errores');
      if (primero) primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // Lo que guarda "el servidor": respuestas limpias, calculados y copia de los datos de catálogo
    const limpias = Motor.limpiar(def, respuestas, r.estado);
    const copia = {};
    Motor.campos(def).filter((c) => c.tipo === 'Catalogo' && limpias.generales[c.clave]).forEach(function (c) {
      const reg = R.catalogosDe(campana.id)(c.catalogo).find((x) => String(x.valores.clave) === String(limpias.generales[c.clave]));
      if (reg) copia[c.clave] = Object.assign({}, reg.valores);
    });
    campana.consecutivo += 1;
    const folio = campana.prefijo + '-' + String(campana.consecutivo).padStart(6, '0');
    const ahora = new Date().toISOString();
    const captura = borrador || { id: D.datos.siguiente.captura++, formularioId: formulario.id, version: version.numero, campanaId: campana.id, agenteId: yo.id, creada: ahora, correcciones: [], rechazos: [] };
    Object.assign(captura, {
      folio, estado: 'Enviada', enviada: ahora, supervisorId: yo.supervisorId, subcampanaId, respuestas: limpias, copiaCatalogo: copia,
      estatusValidacion: null, fechaValidacion: null, validadorId: null, estatusBackOffice: null, fechaCobro: null, cobradorId: null,
      rechazadaPorNip: false, aprobadaSinNip: false, nipVerificado: false, apartadaPor: null,
    });
    if (!borrador) D.datos.capturas.push(captura);
    D.guardar();
    hayCambios = false;
    C.avisar('Captura enviada con el folio ' + e(folio) + '.');
    p.contenido.innerHTML = C.marcar('Captura',
      '<p class="migas"><a href="captura-inicio.html">Capturar</a> / ' + e(formulario.nombre) + '</p>' +
      '<div class="enviada"><h1>Captura enviada</h1><p>Folio</p><p class="folio">' + e(folio) + '</p>' +
      '<p class="detalle">Anota o comparte este folio: identifica la captura.</p>' +
      '<div class="botones"><button type="button" class="principal" id="capturar-otra">Capturar otra</button><a href="captura-inicio.html">Volver a capturar</a></div></div>');
    document.getElementById('capturar-otra').addEventListener('click', () => { location.href = 'capturar.html?formulario=' + formulario.id; });
  }

  p.contenido.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-accion-captura]');
    if (!b) return;
    switch (b.dataset.accionCaptura) {
      case 'guardar': guardarBorrador(); break;
      case 'enviar': enviar(); break;
      case 'descartar': confirmandoDescartar = true; dibujar(); break;
      case 'descartar-no': confirmandoDescartar = false; dibujar(); break;
      case 'descartar-si':
        D.datos.capturas = D.datos.capturas.filter((c) => c !== borrador);
        D.guardar();
        hayCambios = false;
        C.avisarDespues('Borrador descartado.');
        location.href = 'captura-inicio.html';
        break;
    }
  });

  // Si intenta salir con cambios sin guardar, se le pregunta antes de perderlos
  document.addEventListener('click', function (ev) {
    const a = ev.target.closest('a[href]');
    if (!a || !hayCambios || a.getAttribute('href').startsWith('#')) return;
    if (!confirm('Tienes cambios sin guardar. ¿Salir sin guardarlos?')) ev.preventDefault();
    else hayCambios = false;
  }, true);
  window.addEventListener('beforeunload', (ev) => { if (hayCambios) { ev.preventDefault(); ev.returnValue = ''; } });

  dibujar();
})();
