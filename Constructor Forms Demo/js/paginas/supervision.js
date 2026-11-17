/* Supervisión (PanelSupervision.razor + TableroEquipo.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'supervision', titulo: 'Supervisión', roles: ['Administrador', 'Gerente', 'Coordinador', 'Supervisor'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esSupervisor = yo.rol === 'Supervisor';
  const esAdministrador = yo.rol === 'Administrador' || yo.rol === 'Gerente';
  const esGerente = yo.rol === 'Gerente';
  const hoy = C.fechas.hoy();

  let campanaId = esAdministrador ? (Number(C.param('campana')) || null) : yo.campanaId;
  let periodo = null;
  let pagina = 1;
  const filtros = { desde: hoy, hasta: hoy, agente: '', supervisor: '', formulario: '', folio: '' };
  if (C.param('agente')) { filtros.agente = C.param('agente'); }

  const campana = () => (campanaId ? D.campana(campanaId) : null);
  const esActual = () => campana() && R.clavePeriodo(periodo) === R.clavePeriodo(R.periodoQueContiene(hoy, campana().corte));

  /* ---------- Tablero del equipo ---------- */
  function equipo() {
    const c = campana();
    const enviadas = R.enPeriodo(R.enviadas().filter((x) => x.campanaId === c.id), periodo);
    const agentesActivos = D.datos.usuarios.filter((u) => u.campanaId === c.id && (u.rol === 'Agente' || u.rol === 'Afiliado') && u.activo);
    const dias = R.diasRestantes(periodo, hoy);
    const delAgente = (a) => enviadas.filter((x) => x.agenteId === a.id && (!esSupervisor || x.supervisorId === yo.id));
    const filaAgente = (a) => ({ a, enviadas: delAgente(a).length, hoy: R.deHoy(delAgente(a)).length, meta: R.metaAgente(a.id, periodo) });
    const grupos = [];
    const supervisores = D.datos.usuarios.filter((u) => u.campanaId === c.id && u.rol === 'Supervisor' && u.activo && (!esSupervisor || u.id === yo.id));
    supervisores.forEach(function (s) {
      const agentes = agentesActivos.filter((a) => a.supervisorId === s.id).map(filaAgente);
      const metaSup = R.metaSupervisor(s.id, periodo);
      grupos.push({ nombre: s.nombre, supervisor: s, agentes, enviadas: enviadas.filter((x) => x.supervisorId === s.id).length,
        meta: metaSup || agentes.reduce((t, x) => t + (x.meta || 0), 0), metaSupervisor: metaSup });
    });
    if (!esSupervisor) {
      const sinSup = agentesActivos.filter((a) => !a.supervisorId).map(filaAgente);
      if (sinSup.length) grupos.push({ nombre: 'Sin supervisor', supervisor: null, agentes: sinSup, enviadas: sinSup.reduce((t, x) => t + x.enviadas, 0), meta: sinSup.reduce((t, x) => t + (x.meta || 0), 0) });
    }
    const metaCampana = esSupervisor ? null : R.metaCampana(c.id, periodo);
    const total = esSupervisor ? grupos.reduce((t, g) => t + g.enviadas, 0) : enviadas.length;
    return { grupos, enviadas: total, hoy: R.deHoy(esSupervisor ? enviadas.filter((x) => x.supervisorId === yo.id) : enviadas).length, dias,
      meta: metaCampana || grupos.reduce((t, g) => t + g.meta, 0), metaCampana, coordinadores: esAdministrador ? D.datos.usuarios.filter((u) => u.campanaId === c.id && u.rol === 'Coordinador').map((u) => u.nombre) : [] };
  }

  function tablero() {
    const q = equipo();
    const actual = esActual();
    const hijos = [];
    const barra = (v, m) => { hijos.push(V.barra(v, m)); return '{{hijo:' + (hijos.length - 1) + '}}'; };
    const faltan = (meta, env) => env >= meta ? 'Meta cumplida.' : 'Faltan ' + C.numero(meta - env) + ': ' + C.numero(R.faltanPorDia(meta, env, q.dias)) + ' por día.';
    function tabla(g) {
      if (!g.agentes.length) return '<p class="vacio">Sin agentes activos.</p>';
      return '<table class="tabla"><thead><tr><th>Agente</th>' + (actual ? '<th class="numero">Hoy</th>' : '') + '<th class="numero">Periodo</th><th class="numero">Meta</th><th>Avance</th>' +
        (actual ? '<th class="numero" title="Lo que le falta para su meta, entre los días que quedan">Por día</th>' : '') + '<th></th></tr></thead><tbody>' +
        g.agentes.map((x) => '<tr' + (actual && x.hoy === 0 ? ' class="en-cero"' : '') + '><td>' + e(x.a.nombre) + (x.a.rol === 'Afiliado' ? ' <span class="detalle">(afiliado)</span>' : '') + '</td>' +
          (actual ? '<td class="numero">' + x.hoy + '</td>' : '') + '<td class="numero">' + C.numero(x.enviadas) + '</td><td class="numero">' + (x.meta ? C.numero(x.meta) : '—') + '</td>' +
          '<td class="avance">' + (x.meta ? barra(x.enviadas, x.meta) : '') + '</td>' +
          (actual ? '<td class="numero">' + (x.meta ? (x.enviadas >= x.meta ? '✓' : C.numero(R.faltanPorDia(x.meta, x.enviadas, q.dias))) : '—') + '</td>' : '') +
          '<td><button type="button" class="enlace" data-ver-agente="' + x.a.id + '">Ver capturas</button></td></tr>').join('') + '</tbody></table>';
    }
    let h = '<div class="tablero"><div class="totales"><span><strong>' + C.numero(q.enviadas) + '</strong> ' + (q.enviadas === 1 ? 'captura enviada' : 'capturas enviadas') + ' en el periodo</span>';
    if (q.meta > 0) h += '<span class="detalle">de una meta de ' + C.numero(q.meta) + (q.metaCampana ? '' : ' (suma de las metas del equipo)') + '</span>' + barra(q.enviadas, q.meta);
    h += '</div><p class="detalle">';
    if (actual) h += '<span>Hoy: <strong>' + C.numero(q.hoy) + '</strong>.</span> <span>' + (q.dias === 1 ? 'Queda 1 día' : 'Quedan ' + q.dias + ' días') + ' del periodo, contando hoy.</span> ' + (q.meta > 0 ? '<span>' + faltan(q.meta, q.enviadas) + '</span>' : '');
    else if (q.dias === 0) h += '<span>El periodo ya terminó.</span>';
    else h += '<span>El periodo todavía no empieza.</span>';
    h += '</p>';
    if (q.coordinadores.length) h += '<p class="detalle">Coordinación: ' + e(q.coordinadores.join(', ')) + '</p>';
    if (!q.grupos.length) h += '<p>Esta campaña no tiene supervisores ni agentes activos.</p>';
    q.grupos.forEach(function (g) {
      if (!esSupervisor) {
        h += '<details class="grupo' + (g.supervisor ? '' : ' sin-supervisor') + '"' + (q.grupos.length === 1 ? ' open' : '') + '><summary><span class="nombre">' + e(g.nombre) + '</span>' +
          '<span class="detalle">' + g.agentes.length + ' ' + (g.agentes.length === 1 ? 'agente' : 'agentes') + '</span><span class="cifra">' + C.numero(g.enviadas) + (g.meta > 0 ? ' / ' + C.numero(g.meta) : '') + '</span>' +
          (g.meta > 0 ? barra(g.enviadas, g.meta) : '') + '</summary>' + tabla(g) + '</details>';
      } else {
        if (g.metaSupervisor) h += '<p class="detalle">Tu meta del periodo: <strong>' + C.numero(g.metaSupervisor) + '</strong>. Tus agentes llevan ' + C.numero(g.enviadas) + '.</p>';
        h += tabla(g);
      }
    });
    return C.marcar('TableroEquipo', h + '</div>', hijos);
  }

  /* ---------- Lista de capturas ---------- */
  function alcance() {
    return R.enviadas().filter(function (x) {
      if (esSupervisor) return x.supervisorId === yo.id;
      if (yo.rol === 'Coordinador') return x.campanaId === yo.campanaId;
      return !campanaId || x.campanaId === campanaId;
    });
  }

  function opcionesFiltro() {
    const lista = alcance();
    const agentes = [...new Set(lista.map((x) => x.agenteId))].map(D.usuario).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const supervisores = [...new Set(lista.map((x) => x.supervisorId).filter(Boolean))].map(D.usuario).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const formularios = [...new Set(lista.map((x) => x.formularioId))].map(D.formulario);
    return { agentes, supervisores, formularios };
  }

  function listaCapturas() {
    const folio = filtros.folio.trim().toUpperCase();
    const lista = alcance().filter(function (x) {
      if (folio) return x.folio.includes(folio);
      const d = R.diaDe(x);
      if (filtros.desde && d < filtros.desde) return false;
      if (filtros.hasta && d > filtros.hasta) return false;
      if (filtros.agente && x.agenteId !== Number(filtros.agente)) return false;
      if (filtros.supervisor && x.supervisorId !== Number(filtros.supervisor)) return false;
      if (filtros.formulario && x.formularioId !== Number(filtros.formulario)) return false;
      return true;
    }).sort((a, b) => new Date(b.enviada) - new Date(a.enviada));
    if (!lista.length) return '<p>No hay capturas con estos filtros.</p>';
    const paginas = Math.ceil(lista.length / 25);
    pagina = Math.min(pagina, paginas);
    let h = '<p class="detalle">' + C.numero(lista.length) + ' ' + (lista.length === 1 ? 'captura' : 'capturas') + '. Fechas en hora de la Ciudad de México.</p>' +
      '<table class="tabla"><thead><tr><th>Folio</th><th>Formulario</th><th>Agente</th>' + (esSupervisor ? '' : '<th>Supervisor</th>') + '<th>Subcampaña</th><th>Enviada</th><th></th></tr></thead><tbody>' +
      lista.slice((pagina - 1) * 25, pagina * 25).map(function (x) {
        const est = R.estadoVenta(x);
        const sub = D.campana(x.campanaId).subcampanas.find((s) => s.id === x.subcampanaId);
        return '<tr><td class="folio">' + e(x.folio) + (x.correcciones && x.correcciones.length ? ' <span class="etiqueta" title="Tiene correcciones">corregida</span>' : '') +
          (est ? ' <span class="etiqueta ' + est.clase + '">' + est.texto + '</span>' : '') + '</td>' +
          '<td>' + e(D.formulario(x.formularioId).nombre) + '</td><td>' + e(D.nombre(x.agenteId)) + '</td>' + (esSupervisor ? '' : '<td>' + e(x.supervisorId ? D.nombre(x.supervisorId) : '—') + '</td>') +
          '<td>' + e(sub ? sub.nombre : '—') + '</td><td class="fecha">' + C.fechas.fechaHora(x.enviada) + '</td>' +
          '<td>' + (esGerente ? '' : '<a href="captura-supervision.html?id=' + x.id + '">Ver</a>') + '</td></tr>';
      }).join('') + '</tbody></table>';
    if (paginas > 1) h += '<div class="paginacion"><button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>Página ' + pagina + ' de ' + paginas + '</span><button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button></div>';
    return h;
  }

  function dibujar() {
    const c = campana();
    if (c && !periodo) periodo = R.periodoQueContiene(hoy, c.corte);
    const o = opcionesFiltro();
    const hijos = [];
    let h = '<h1>Supervisión</h1>';
    if (esAdministrador) {
      h += '<label class="selector-campana">Campaña <select id="campana"><option value="">Todas (elige una para ver su equipo)</option>' +
        D.datos.campanas.filter((x) => x.activa).map((x) => '<option value="' + x.id + '"' + (x.id === campanaId ? ' selected' : '') + '>' + e(x.nombre) + '</option>').join('') + '</select></label>';
    }
    h += '<section><div class="encabezado-seccion"><h2>' + (esSupervisor ? 'Mi equipo' : c ? 'Equipo de ' + e(c.nombre) : 'Equipo') + '</h2>';
    if (c) {
      h += '<div class="periodo"><button data-periodo="anterior">&larr;</button><span><strong>' + R.nombrePeriodo(periodo) + '</strong> <span class="detalle">' + R.rangoPeriodo(periodo) + '</span></span>' +
        '<button data-periodo="siguiente">&rarr;</button>' + (esActual() ? '' : '<button class="secundario" data-periodo="actual">Periodo actual</button>') + '</div>';
    }
    h += '</div>{{hijo:0}}';
    hijos.push(c ? V.descripcionCampana(c) : '');
    if (!c) h += '<p class="detalle">Elige una campaña para ver a sus coordinadores, supervisores y agentes.</p>';
    else { h += '{{hijo:1}}'; hijos.push(tablero()); }
    h += '</section><section><h2>Capturas</h2><div class="filtros">' +
      '<label>Desde <input type="date" data-filtro="desde" value="' + filtros.desde + '"' + (filtros.folio ? ' disabled' : '') + ' /></label>' +
      '<label>Hasta <input type="date" data-filtro="hasta" value="' + filtros.hasta + '"' + (filtros.folio ? ' disabled' : '') + ' /></label>' +
      '<label>Agente <select data-filtro="agente"><option value="">Todos</option>' + o.agentes.map((a) => '<option value="' + a.id + '"' + (String(a.id) === String(filtros.agente) ? ' selected' : '') + '>' + e(a.nombre) + '</option>').join('') + '</select></label>' +
      (esSupervisor ? '' : '<label>Supervisor <select data-filtro="supervisor"><option value="">Todos</option>' + o.supervisores.map((a) => '<option value="' + a.id + '"' + (String(a.id) === String(filtros.supervisor) ? ' selected' : '') + '>' + e(a.nombre) + '</option>').join('') + '</select></label>') +
      '<label>Formulario <select data-filtro="formulario"><option value="">Todos</option>' + o.formularios.map((f) => '<option value="' + f.id + '"' + (String(f.id) === String(filtros.formulario) ? ' selected' : '') + '>' + e(f.nombre) + '</option>').join('') + '</select></label>' +
      '<label>Folio <input type="search" data-filtro="folio" value="' + e(filtros.folio) + '" placeholder="En todas las fechas" /></label>' +
      '<button type="button" class="limpiar" id="limpiar">Limpiar filtros</button></div><div id="lista-capturas">' + listaCapturas() + '</div></section>';
    p.contenido.innerHTML = C.marcar('PanelSupervision', h, hijos);
  }

  p.contenido.addEventListener('change', function (ev) {
    const t = ev.target;
    if (t.id === 'campana') { campanaId = t.value ? Number(t.value) : null; periodo = null; filtros.agente = ''; filtros.supervisor = ''; pagina = 1; dibujar(); return; }
    if (t.dataset.filtro && t.dataset.filtro !== 'folio') { filtros[t.dataset.filtro] = t.value; pagina = 1; dibujar(); }
  });
  p.contenido.addEventListener('input', function (ev) {
    if (ev.target.dataset.filtro === 'folio') {
      filtros.folio = ev.target.value;
      pagina = 1;
      document.getElementById('lista-capturas').innerHTML = C.marcar('PanelSupervision', listaCapturas());
      document.querySelectorAll('[data-filtro="desde"], [data-filtro="hasta"]').forEach((x) => { x.disabled = !!filtros.folio; });
    }
  });
  p.contenido.addEventListener('click', function (ev) {
    const per = ev.target.closest('[data-periodo]');
    const pag = ev.target.closest('[data-pag]');
    const ver = ev.target.closest('[data-ver-agente]');
    const c = campana();
    if (per) {
      periodo = per.dataset.periodo === 'anterior' ? R.periodoAnterior(periodo, c.corte) : per.dataset.periodo === 'siguiente' ? R.periodoSiguiente(periodo, c.corte) : R.periodoQueContiene(hoy, c.corte);
      dibujar();
    } else if (pag) { pagina = Number(pag.dataset.pag); dibujar(); }
    else if (ver) {
      // "Ver capturas": el agente con las fechas del periodo que se está viendo
      Object.assign(filtros, { agente: ver.dataset.verAgente, desde: periodo.inicio, hasta: periodo.fin, folio: '' });
      pagina = 1;
      dibujar();
      document.getElementById('lista-capturas').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (ev.target.id === 'limpiar') {
      Object.assign(filtros, { desde: hoy, hasta: hoy, agente: '', supervisor: '', formulario: '', folio: '' });
      pagina = 1;
      dibujar();
    }
  });

  dibujar();
})();
