/* Capturas, consulta y descarga (Ventas.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'capturas', titulo: 'Capturas', roles: ['Administrador', 'Gerente', 'Coordinador'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador' || yo.rol === 'Gerente';
  const esGerente = yo.rol === 'Gerente';
  const hoy = C.fechas.hoy();
  const POR_PAGINA = 25;
  const OMITIR = ['Informativo', 'Nip', 'Validador', 'Cobrador'];

  let campanaId = esAdministrador ? null : yo.campanaId;
  let pagina = 1;
  const f = { formulario: null, desde: hoy, hasta: hoy, agente: '', supervisor: '', validacion: '', backoffice: '' };

  const formulariosDe = (id) => D.datos.formularios.filter((x) => x.campanaId === id);
  function elegirCampana(id) {
    campanaId = id;
    const fs = id ? formulariosDe(id) : [];
    f.formulario = fs.length ? fs[0].id : null;
    f.agente = ''; f.supervisor = '';
  }
  elegirCampana(campanaId);

  // Columnas: los campos del formulario (la versión publicada), sin los que no llevan dato ni los estatus, que van aparte
  function columnas(form) {
    const def = (D.versionPublicada(form) || form.versiones[form.versiones.length - 1]).definicion;
    const todos = Motor.campos(def).filter((c) => !OMITIR.includes(c.tipo) && !c.esEstatusValidacion && !c.esEstatusBackOffice);
    return { def, campos: todos.filter((c) => !c.seccion.repetible), repetibles: def.secciones.filter((s) => s.repetible) };
  }

  function valor(c, campo) {
    const v = c.respuestas.generales[campo.clave];
    if (campo.tipo === 'Catalogo') return c.copiaCatalogo[campo.clave] ? c.copiaCatalogo[campo.clave].nombre : v || '';
    return Motor.texto(campo, v);
  }

  function filtradas() {
    return R.enviadas().filter(function (c) {
      if (c.campanaId !== campanaId || c.formularioId !== f.formulario) return false;
      const d = R.diaDe(c);
      if (f.desde && d < f.desde) return false;
      if (f.hasta && d > f.hasta) return false;
      if (f.agente && c.agenteId !== Number(f.agente)) return false;
      if (f.supervisor && c.supervisorId !== Number(f.supervisor)) return false;
      if (f.validacion && (f.validacion === 'sin' ? c.estatusValidacion : c.estatusValidacion !== f.validacion)) return false;
      if (f.backoffice && (f.backoffice === 'sin' ? c.estatusBackOffice : c.estatusBackOffice !== f.backoffice)) return false;
      return true;
    }).sort((a, b) => new Date(b.enviada) - new Date(a.enviada));
  }

  const ESTATUS = { aprobada: 'Aprobada', rechazada: 'Rechazada', cobrada: 'Cobrada' };
  const fecha = (iso) => iso ? C.fechas.fechaHora(iso) : '—';
  const opcion = (v, t, actual) => '<option value="' + v + '"' + (String(v) === String(actual) ? ' selected' : '') + '>' + e(t) + '</option>';

  function dibujar() {
    const campana = campanaId ? D.campana(campanaId) : null;
    const forms = campana ? formulariosDe(campana.id) : [];
    const delaCampana = campana ? R.enviadas().filter((c) => c.campanaId === campana.id) : [];
    const agentes = [...new Set(delaCampana.map((c) => c.agenteId))].map(D.usuario).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const supervisores = [...new Set(delaCampana.map((c) => c.supervisorId).filter(Boolean))].map(D.usuario).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const usaBo = campana && campana.usaBackOffice;
    const lista = campana && f.formulario ? filtradas() : [];

    let h = '<h1>Capturas</h1><div class="filtros">';
    if (esAdministrador) h += '<label>Campaña <select id="campana">' + opcion('', 'Elige una campaña', campanaId || '') + D.datos.campanas.filter((x) => x.activa).map((x) => opcion(x.id, x.nombre, campanaId)).join('') + '</select></label>';
    h += '<label>Formulario <select data-f="formulario"' + (forms.length ? '' : ' disabled') + '>' + (forms.length ? forms.map((x) => opcion(x.id, x.nombre, f.formulario)).join('') : '<option value="">Sin formularios</option>') + '</select></label>' +
      '<label>Desde <input type="date" data-f="desde" value="' + (f.desde || '') + '" /></label><label>Hasta <input type="date" data-f="hasta" value="' + (f.hasta || '') + '" /></label>' +
      '<label>Agente <select data-f="agente">' + opcion('', 'Todos', f.agente) + agentes.map((a) => opcion(a.id, a.nombre, f.agente)).join('') + '</select></label>' +
      '<label>Supervisor <select data-f="supervisor">' + opcion('', 'Todos', f.supervisor) + supervisores.map((a) => opcion(a.id, a.nombre, f.supervisor)).join('') + '</select></label>';
    if (usaBo) {
      h += '<label>Estatus validación <select data-f="validacion">' + opcion('', 'Todas', f.validacion) + opcion('sin', 'Sin validar', f.validacion) + opcion('aprobada', 'Aprobada', f.validacion) + opcion('rechazada', 'Rechazada', f.validacion) + '</select></label>' +
        '<label>Estatus BackOffice <select data-f="backoffice">' + opcion('', 'Todas', f.backoffice) + opcion('sin', 'Sin cobrar', f.backoffice) + opcion('cobrada', 'Cobrada', f.backoffice) + opcion('rechazada', 'Rechazada', f.backoffice) + '</select></label>';
    }
    h += '<button type="button" class="secundario" id="limpiar">Limpiar filtros</button><button type="button" id="descargar"' + (lista.length ? '' : ' disabled') + '>Descargar Excel</button></div>';

    if (!campana) h += '<p class="detalle">Elige una campaña para ver sus capturas.</p>';
    else if (!f.formulario) h += '<p class="detalle">' + (forms.length ? 'Elige un formulario para ver sus capturas.' : 'La campaña todavía no tiene formularios.') + '</p>';
    else {
      const form = D.formulario(f.formulario);
      const col = columnas(form);
      h += '<p class="detalle">' + C.numero(lista.length) + ' ' + (lista.length === 1 ? 'captura' : 'capturas') + ' de ' + e(form.nombre) + '. Fechas en hora de la Ciudad de México; el supervisor es el que tenía el agente al enviar. "Descargar Excel" baja todas las del filtro, no solo esta página.</p>';
      if (lista.length) {
        const paginas = Math.ceil(lista.length / POR_PAGINA);
        pagina = Math.min(pagina, paginas);
        const numerico = (c) => ['Entero', 'Decimal', 'Moneda', 'Porcentaje'].includes(c.tipo) || c.formato === 'Moneda' || c.tipo === 'DatoCatalogo' && ['precio', 'velocidad'].includes(c.columna);
        h += '<div class="contenedor-tabla"><table class="tabla"><thead><tr><th>Folio</th><th>Enviada</th><th>Agente</th><th>Supervisor</th><th>Subcampaña</th>' +
          (usaBo ? '<th>Estatus validación</th><th>Validó</th><th>Fecha de validación</th><th>Estatus BackOffice</th><th>Cobró</th><th>Fecha BackOffice</th>' : '') +
          col.campos.map((c) => '<th' + (numerico(c) ? ' class="numero"' : '') + '>' + e(c.etiqueta) + '</th>').join('') +
          col.repetibles.map((s) => '<th class="numero" title="Renglones de la sección; el detalle viene en el Excel">' + e(s.titulo) + '</th>').join('') + '</tr></thead><tbody>' +
          lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map(function (c) {
            const sub = campana.subcampanas.find((s) => s.id === c.subcampanaId);
            return '<tr><td class="folio">' + (esGerente ? e(c.folio) : '<a href="captura-supervision.html?id=' + c.id + '" title="Ver la captura completa">' + e(c.folio) + '</a>') +
              (c.correcciones.length ? ' <span class="etiqueta" title="Tiene correcciones">corregida</span>' : '') + '</td><td class="fecha">' + C.fechas.fechaHora(c.enviada) + '</td>' +
              '<td>' + e(D.nombre(c.agenteId)) + '</td><td>' + e(c.supervisorId ? D.nombre(c.supervisorId) : '—') + '</td><td>' + e(sub ? sub.nombre : '—') + '</td>' +
              (usaBo ? '<td>' + (ESTATUS[c.estatusValidacion] || '—') + (c.rechazadaPorNip ? ' <span class="etiqueta" title="Alguna vez se rechazó sola al agotar los intentos del NIP">rechazada por NIP</span>' : '') +
                (c.aprobadaSinNip ? ' <span class="etiqueta" title="Se aprobó con la contraseña porque el cliente no recibe el NIP">aprobada sin NIP</span>' : '') + '</td>' +
                '<td>' + e(c.validadorId ? D.nombre(c.validadorId) : '—') + '</td><td class="fecha">' + fecha(c.fechaValidacion) + '</td><td>' + (ESTATUS[c.estatusBackOffice] || '—') + '</td>' +
                '<td>' + e(c.cobradorId ? D.nombre(c.cobradorId) : '—') + '</td><td class="fecha">' + fecha(c.fechaCobro) + '</td>' : '') +
              col.campos.map((x) => '<td' + (numerico(x) ? ' class="numero"' : '') + '>' + e(valor(c, x)) + '</td>').join('') +
              col.repetibles.map((s) => '<td class="numero">' + ((c.respuestas.repeticiones[s.clave] || []).length || '') + '</td>').join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
        if (paginas > 1) {
          h += '<div class="paginacion"><button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>Página ' + pagina + ' de ' + paginas + '</span>' +
            '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button></div>';
        }
      }
    }
    p.contenido.innerHTML = C.marcar('Ventas', h);
  }

  function descargar() {
    const campana = D.campana(campanaId);
    const form = D.formulario(f.formulario);
    const col = columnas(form);
    const usaBo = campana.usaBackOffice;
    const filas = [['Folio', 'Enviada', 'Agente', 'Supervisor', 'Subcampaña'].concat(usaBo ? ['Estatus validación', 'Validó', 'Fecha de validación', 'Estatus BackOffice', 'Cobró', 'Fecha BackOffice'] : [])
      .concat(col.campos.map((c) => c.etiqueta)).concat(col.repetibles.map((s) => s.titulo))];
    filtradas().forEach(function (c) {
      const sub = campana.subcampanas.find((s) => s.id === c.subcampanaId);
      filas.push([c.folio, C.fechas.fechaHora(c.enviada), D.nombre(c.agenteId), c.supervisorId ? D.nombre(c.supervisorId) : '', sub ? sub.nombre : '']
        .concat(usaBo ? [ESTATUS[c.estatusValidacion] || '', c.validadorId ? D.nombre(c.validadorId) : '', c.fechaValidacion ? C.fechas.fechaHora(c.fechaValidacion) : '',
          ESTATUS[c.estatusBackOffice] || '', c.cobradorId ? D.nombre(c.cobradorId) : '', c.fechaCobro ? C.fechas.fechaHora(c.fechaCobro) : ''] : [])
        .concat(col.campos.map((x) => valor(c, x))).concat(col.repetibles.map((s) => (c.respuestas.repeticiones[s.clave] || []).length)));
    });
    C.descargarCsv('capturas-' + (campana.prefijo || campana.id).toLowerCase() + '-' + (f.desde || 'inicio') + '-a-' + (f.hasta || hoy) + '.csv', filas);
    C.avisar('En la demo se descarga como CSV (la app real genera un Excel).');
  }

  p.contenido.addEventListener('change', function (ev) {
    const t = ev.target;
    if (t.id === 'campana') { elegirCampana(t.value ? Number(t.value) : null); pagina = 1; dibujar(); }
    else if (t.dataset.f) { f[t.dataset.f] = t.dataset.f === 'formulario' ? Number(t.value) : t.value; pagina = 1; dibujar(); }
  });
  p.contenido.addEventListener('click', function (ev) {
    const pag = ev.target.closest('[data-pag]');
    if (pag) { pagina = Number(pag.dataset.pag); dibujar(); }
    else if (ev.target.id === 'limpiar') { Object.assign(f, { desde: hoy, hasta: hoy, agente: '', supervisor: '', validacion: '', backoffice: '' }); pagina = 1; dibujar(); }
    else if (ev.target.id === 'descargar') descargar();
  });
  dibujar();
})();
