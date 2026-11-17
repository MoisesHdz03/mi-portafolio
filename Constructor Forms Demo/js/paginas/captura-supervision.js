/* Captura vista desde Supervisión, con corrección (CapturaSupervision.razor + HistorialCorrecciones.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'supervision', titulo: 'Captura', roles: ['Administrador', 'Coordinador', 'Supervisor'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador';
  const LONGITUD_MOTIVO = 500;

  const c = D.captura(C.param('id'));
  const enAlcance = c && c.estado === 'Enviada' && (esAdministrador ||
    (yo.rol === 'Coordinador' && c.campanaId === yo.campanaId) || (yo.rol === 'Supervisor' && c.supervisorId === yo.id));
  if (!enAlcance) {
    p.contenido.innerHTML = C.marcar('CapturaSupervision', '<p class="migas"><a href="supervision.html">Supervisión</a> / ...</p><p>La captura no existe o no está a tu cargo. <a href="supervision.html">Volver</a></p>');
    return;
  }

  const f = D.formulario(c.formularioId);
  const def = D.version(f, c.version).definicion;
  const campana = D.campana(c.campanaId);
  const veBackOffice = esAdministrador;
  const deBackOffice = new Set();
  def.secciones.filter((s) => s.soloBackOffice).forEach((s) => s.filas.forEach((fi) => fi.forEach((x) => deBackOffice.add(x.clave))));

  // El supervisor solo corrige los campos marcados; el administrador, cualquiera que se captura.
  // Los calculados y los datos de catálogo nunca: se llenan solos.
  const corregibles = Motor.campos(def).filter((x) => !x.desactivado && !Motor.SIN_CAPTURA.includes(x.tipo) && x.tipo !== 'Informativo' &&
    !deBackOffice.has(x.clave) && (esAdministrador || x.corregible)).map((x) => x.clave);
  const puedeCorregir = corregibles.length > 0 && (esAdministrador || (yo.rol === 'Supervisor' && c.supervisorId === yo.id));

  let editando = false;
  let hayCambios = false;
  let edicion = null;
  let motivo = '';
  let errores = null;
  let mensajeErrores = null;

  const opciones = (extra) => V.opcionesMotor(c, null, Object.assign({ conservarCopia: true, incluirBackOffice: veBackOffice }, extra || {}));

  function dibujar() {
    document.title = c.folio + ' - Constructor Forms';
    const sub = campana.subcampanas.find((s) => s.id === c.subcampanaId);
    const hijos = [V.estadoVenta(c), V.historial(c, !veBackOffice)];
    let h = '<p class="migas"><a href="supervision.html">Supervisión</a> / ' + e(c.folio) + '</p>' +
      '<div class="encabezado"><div><h1>' + e(c.folio) + (c.correcciones.length ? ' <span class="etiqueta">corregida</span>' : '') + '</h1>' +
      '<p class="detalle">' + e(f.nombre) + ' · versión ' + c.version + ' · ' + e(campana.nombre) + (sub ? ' / ' + e(sub.nombre) : '') + '</p>' +
      '<p class="detalle">Agente: <strong>' + e(D.nombre(c.agenteId)) + '</strong> · Supervisor: ' + e(c.supervisorId ? D.nombre(c.supervisorId) : 'sin supervisor') +
      ' · enviada el ' + C.fechas.corta(c.enviada) + ' a las ' + C.fechas.hora(c.enviada) + '</p></div>' +
      (puedeCorregir && !editando ? '<button type="button" class="principal" id="corregir">Corregir</button>' : '') + '</div>{{hijo:0}}';
    if (editando) {
      h += '<div class="correccion"><p>Solo se pueden cambiar los campos habilitados; los demás se ven deshabilitados. Los calculados y los datos de catálogo se actualizan solos.</p>' +
        (mensajeErrores ? '<p class="resumen-errores" role="alert">' + e(mensajeErrores) + '</p>' : '') +
        '<label class="motivo">Motivo de la corrección <textarea rows="2" maxlength="' + LONGITUD_MOTIVO + '" id="motivo" placeholder="Por ejemplo: el cliente dio mal su teléfono y lo confirmó por llamada">' + e(motivo) + '</textarea></label>' +
        '<div class="botones"><button type="button" id="cancelar">Cancelar</button><button type="button" class="principal" id="guardar"' + (motivo.trim() ? '' : ' disabled') + '>Guardar corrección</button></div></div>';
    }
    h += '<div id="formulario-supervision"></div>{{hijo:1}}';
    p.contenido.innerHTML = C.marcar('CapturaSupervision', h, hijos);

    Formulario.montar(document.getElementById('formulario-supervision'), editando
      ? { def, respuestas: edicion, opciones: opciones(), editables: corregibles, errores: errores || undefined, alCambiar: () => { hayCambios = true; } }
      : { def, respuestas: JSON.parse(JSON.stringify(c.respuestas)), opciones: opciones(), soloLectura: true });

    const motivoEl = document.getElementById('motivo');
    if (motivoEl) motivoEl.addEventListener('input', function () {
      motivo = motivoEl.value;
      document.getElementById('guardar').disabled = !motivo.trim();
    });
  }

  // Qué cambió, campo por campo, con el texto como se ve en pantalla
  function textoDe(campo, valor) {
    if (campo.tipo === 'Catalogo' && valor) {
      const reg = R.catalogosDe(c.campanaId)(campo.catalogo).find((k) => String(k.valores.clave) === String(valor));
      return reg ? reg.valores.nombre : String(valor);
    }
    return Motor.texto(campo, valor);
  }

  function cambios(antes, despues) {
    const lista = [];
    Motor.campos(def).forEach(function (campo) {
      if (campo.tipo === 'Informativo') return;
      if (campo.seccion.repetible) {
        const fa = antes.repeticiones[campo.seccion.clave] || [];
        const fd = despues.repeticiones[campo.seccion.clave] || [];
        for (let i = 0; i < Math.max(fa.length, fd.length); i++) {
          const a = textoDe(campo, (fa[i] || {})[campo.clave]);
          const d = textoDe(campo, (fd[i] || {})[campo.clave]);
          if (a !== d) lista.push({ campo: campo.clave, etiqueta: campo.etiqueta, seccion: campo.seccion.titulo, fila: i, antes: a || null, despues: d || null });
        }
        return;
      }
      const a = textoDe(campo, antes.generales[campo.clave]);
      const d = textoDe(campo, despues.generales[campo.clave]);
      if (a !== d) lista.push({ campo: campo.clave, etiqueta: campo.etiqueta, antes: a || null, despues: d || null });
    });
    return lista;
  }

  function guardar() {
    if (!motivo.trim()) { C.avisar('Escribe el motivo de la corrección.', 'error'); return; }
    // Se valida con la sección de BackOffice incluida para no perder lo que ya tiene
    const op = opciones({ incluirBackOffice: true });
    const r = Motor.validar(def, JSON.parse(JSON.stringify(edicion)), Object.assign({ soloEstos: corregibles }, op));
    if (r.errores.total > 0) {
      errores = r.errores;
      mensajeErrores = r.errores.total === 1 ? 'La corrección tiene 1 error. Revísalo antes de guardar.' : 'La corrección tiene ' + r.errores.total + ' errores. Revísalos antes de guardar.';
      C.avisar(mensajeErrores, 'error');
      dibujar();
      return;
    }
    const limpias = Motor.limpiar(def, edicion, r.estado);
    // Lo guardado, con sus calculados y datos de catálogo, para comparar contra lo corregido
    const original = JSON.parse(JSON.stringify(c.respuestas));
    const antes = Motor.limpiar(def, original, Motor.evaluar(def, original, op));
    const lista = cambios(antes, limpias);
    if (!lista.length) { C.avisar('No hay cambios que guardar.', 'error'); return; }

    // Copia del catálogo: la nueva opción elegida se guarda tal como está hoy
    Motor.campos(def).filter((x) => x.tipo === 'Catalogo' && limpias.generales[x.clave]).forEach(function (x) {
      if (c.copiaCatalogo[x.clave] && c.copiaCatalogo[x.clave].clave === limpias.generales[x.clave]) return;
      const reg = R.catalogosDe(c.campanaId)(x.catalogo).find((k) => String(k.valores.clave) === String(limpias.generales[x.clave]));
      if (reg) c.copiaCatalogo[x.clave] = Object.assign({}, reg.valores);
    });
    c.respuestas = limpias;
    c.correcciones.push({ fecha: new Date().toISOString(), usuarioId: yo.id, motivo: motivo.trim(), cambios: lista });
    D.guardar();
    C.avisar('Captura ' + c.folio + ' corregida: ' + (lista.length === 1 ? '1 cambio.' : lista.length + ' cambios.'));
    editando = false;
    hayCambios = false;
    dibujar();
  }

  p.contenido.addEventListener('click', function (ev) {
    const id = ev.target.id;
    if (id === 'corregir') {
      edicion = JSON.parse(JSON.stringify(c.respuestas));
      motivo = '';
      errores = null;
      mensajeErrores = null;
      editando = true;
      dibujar();
    } else if (id === 'cancelar') {
      editando = false;
      hayCambios = false;
      dibujar();
    } else if (id === 'guardar') guardar();
  });

  document.addEventListener('click', function (ev) {
    const a = ev.target.closest('a[href]');
    if (!a || !hayCambios || a.getAttribute('href').startsWith('#')) return;
    if (!confirm('Tienes una corrección sin guardar. ¿Salir sin guardarla?')) ev.preventDefault();
    else hayCambios = false;
  }, true);
  window.addEventListener('beforeunload', (ev) => { if (hayCambios) { ev.preventDefault(); ev.returnValue = ''; } });

  dibujar();
})();
