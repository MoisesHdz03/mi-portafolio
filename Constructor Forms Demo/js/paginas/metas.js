/* Metas (Metas.razor + Reparto.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'metas', titulo: 'Metas', roles: ['Administrador', 'Gerente', 'Coordinador', 'Supervisor'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador' || yo.rol === 'Gerente';
  const esSupervisor = yo.rol === 'Supervisor';
  const META_MAXIMA = 100000;
  const hoy = C.fechas.hoy();

  let campanaId = esAdministrador ? null : yo.campanaId;
  let periodo = null;
  let campana = null; // { valor, original, editable }
  let grupos = [];

  const tabla = { Campana: 'campana', Supervisor: 'supervisor', Agente: 'agente' };
  const texto = (v) => v == null ? 'Sin meta' : C.numero(v);
  const cambio = (m) => m.editable && m.valor !== m.original;
  const editables = () => [campana].concat(grupos.map((g) => g.supervisor)).concat(grupos.flatMap((g) => g.agentes)).filter((m) => m && m.editable);
  const hayCambios = () => editables().some(cambio);

  function meta(tipo, id, editable, nombre) {
    const v = D.datos.metas[tabla[tipo]][id + '|' + R.clavePeriodo(periodo)];
    return { tipo, id, nombre, editable, original: v == null ? null : v, valor: v == null ? null : v };
  }

  function preparar() {
    if (!campanaId) { campana = null; grupos = []; return; }
    const c = D.campana(campanaId);
    if (!periodo) periodo = R.periodoQueContiene(hoy, c.corte);
    const puedeCampana = yo.rol === 'Administrador';
    const puedeSupervisores = yo.rol === 'Administrador' || yo.rol === 'Coordinador';
    const puedeAgentes = yo.rol === 'Administrador' || esSupervisor;
    const equipo = D.datos.usuarios.filter((u) => u.campanaId === c.id && u.activo);
    const agentesDe = (filtro) => equipo.filter((u) => (u.rol === 'Agente' || u.rol === 'Afiliado') && filtro(u.supervisorId))
      .sort((a, b) => a.nombre.localeCompare(b.nombre)).map((a) => meta('Agente', a.id, puedeAgentes, a.nombre));
    campana = meta('Campana', c.id, puedeCampana);
    if (esSupervisor) {
      grupos = [{ supervisorId: yo.id, nombre: yo.nombre, supervisor: meta('Supervisor', yo.id, false), agentes: agentesDe((s) => s === yo.id) }];
    } else {
      const supervisores = equipo.filter((u) => u.rol === 'Supervisor').sort((a, b) => a.nombre.localeCompare(b.nombre));
      grupos = supervisores.map((s) => ({ supervisorId: s.id, nombre: s.nombre, supervisor: meta('Supervisor', s.id, puedeSupervisores), agentes: agentesDe((x) => x === s.id) }));
      const ids = supervisores.map((s) => s.id);
      const sin = agentesDe((x) => !x || !ids.includes(x));
      if (sin.length) grupos.push({ supervisorId: null, nombre: 'Sin supervisor', supervisor: null, agentes: sin });
    }
  }

  function reparto(metaValor, repartido, explicacion) {
    const dif = metaValor - repartido;
    const clase = dif > 0 ? 'falta' : dif < 0 ? 'sobra' : 'completa';
    const msj = dif > 0 ? 'Faltan ' + C.numero(dif) + ' por repartir.' : dif < 0 ? 'El reparto se pasa por ' + C.numero(-dif) + '.' : 'Repartida completa.';
    return C.marcar('Reparto', '<span class="reparto ' + clase + '" title="' + e(explicacion) + '">Repartido ' + C.numero(repartido) + ' de ' + C.numero(metaValor) + ' · ' + msj + '</span>');
  }

  const entrada = (m, ref) => '<input type="number" min="1" max="' + META_MAXIMA + '" data-meta="' + ref + '" value="' + (m.valor == null ? '' : m.valor) + '" placeholder="Sin meta" />';

  function dibujar() {
    const cambios = hayCambios();
    const hijos = [];
    const hijo = (html) => { hijos.push(html); return '{{hijo:' + (hijos.length - 1) + '}}'; };
    let h = '<h1>Metas</h1>';
    if (esAdministrador) {
      h += '<label class="selector-campana">Campaña <select id="campana"' + (cambios ? ' disabled' : '') + '><option value="">Elige una campaña</option>' +
        D.datos.campanas.filter((x) => x.activa).map((x) => '<option value="' + x.id + '"' + (x.id === campanaId ? ' selected' : '') + '>' + e(x.nombre) + '</option>').join('') + '</select></label>';
    }
    if (!campanaId) {
      h += '<p class="detalle">Elige una campaña para ver y poner sus metas.</p>';
      p.contenido.innerHTML = C.marcar('Metas', h);
      return;
    }
    const c = D.campana(campanaId);
    const actual = R.clavePeriodo(periodo) === R.clavePeriodo(R.periodoQueContiene(hoy, c.corte));
    const anterior = R.periodoAnterior(periodo, c.corte);
    const dis = cambios ? ' disabled' : '';
    h += '<div class="periodo"><button data-periodo="anterior"' + dis + '>&larr; Anterior</button><div class="nombre-periodo"><strong>' + R.nombrePeriodo(periodo) + '</strong>' +
      (actual ? '<span class="etiqueta">periodo actual</span>' : '') + '<span class="detalle">' + R.rangoPeriodo(periodo) + '</span></div>' +
      '<button data-periodo="siguiente"' + dis + '>Siguiente &rarr;</button>' + (actual ? '' : '<button class="secundario" data-periodo="actual"' + dis + '>Ir al periodo actual</button>') + '</div>';
    if (cambios) h += '<p class="aviso-cambios">Tienes cambios sin guardar. Guárdalos o descártalos antes de cambiar de periodo.</p>';

    if (!esSupervisor) {
      h += '<section class="campana"><label>Meta de la campaña ' + e(c.nombre) + ' ' + (campana.editable ? entrada(campana, 'c') : '<span class="valor">' + texto(campana.valor) + '</span>') + '</label>';
      if (campana.valor != null) h += hijo(reparto(campana.valor, grupos.reduce((t, g) => t + ((g.supervisor && g.supervisor.valor) || 0), 0), 'Suma de las metas de los supervisores'));
      h += '</section>';
    }
    grupos.forEach(function (g, gi) {
      h += '<section class="grupo' + (g.supervisorId ? '' : ' sin-supervisor') + '"><div class="encabezado-grupo"><span class="nombre">' + e(g.nombre) + '</span>';
      if (g.supervisor) {
        h += '<label class="meta-supervisor">' + (esSupervisor ? 'Tu meta' : 'Meta del supervisor') + ' ' +
          (g.supervisor.editable ? entrada(g.supervisor, 's' + gi) : '<span class="valor">' + texto(g.supervisor.valor) + '</span>') + '</label>';
        if (g.supervisor.valor != null) h += hijo(reparto(g.supervisor.valor, g.agentes.reduce((t, a) => t + (a.valor || 0), 0), 'Suma de las metas de sus agentes'));
      }
      h += '</div>';
      if (!g.agentes.length) h += '<p class="detalle vacio">Sin agentes a cargo.</p>';
      else {
        h += '<table class="tabla"><thead><tr><th>Agente</th><th class="numero">Meta del periodo</th></tr></thead><tbody>' +
          g.agentes.map((a, ai) => '<tr' + (cambio(a) ? ' class="cambiada"' : '') + '><td>' + e(a.nombre) + '</td><td class="numero">' +
            (a.editable ? entrada(a, 'a' + gi + '-' + ai) : texto(a.valor)) + '</td></tr>').join('') + '</tbody></table>';
      }
      h += '</section>';
    });
    if (editables().length) {
      h += '<div class="acciones"><button id="guardar"' + (cambios ? '' : ' disabled') + '>Guardar cambios</button>' +
        '<button class="secundario" id="descartar"' + (cambios ? '' : ' disabled') + '>Descartar cambios</button>' +
        '<button class="secundario" id="copiar"' + (cambios ? ' disabled' : '') + ' title="Copia las metas de ' + R.nombrePeriodo(anterior) + ' que todavía no tienen valor en este periodo. No cambia las que ya pusiste.">Copiar de ' + R.nombrePeriodo(anterior) + '</button></div>' +
        '<p class="detalle">Deja una meta vacía para quitarla. Los avisos de reparto solo informan: puedes guardar aunque no cuadre.</p>';
    }
    p.contenido.innerHTML = C.marcar('Metas', h, hijos);
  }

  function metaDeRef(ref) {
    if (ref === 'c') return campana;
    if (ref[0] === 's') return grupos[Number(ref.slice(1))].supervisor;
    const [gi, ai] = ref.slice(1).split('-').map(Number);
    return grupos[gi].agentes[ai];
  }

  function guardar() {
    const lista = editables().filter(cambio);
    for (const m of lista) {
      if (m.valor != null && (m.valor < 1 || m.valor > META_MAXIMA || !Number.isInteger(m.valor))) { C.avisar('La meta debe estar entre 1 y 100,000, o quedar vacía.', 'error'); return; }
    }
    if (!lista.length) { C.avisar('No hay cambios que guardar.', 'error'); return; }
    const k = R.clavePeriodo(periodo);
    lista.forEach(function (m) {
      const t = D.datos.metas[tabla[m.tipo]];
      if (m.valor == null) delete t[m.id + '|' + k]; else t[m.id + '|' + k] = m.valor;
    });
    D.guardar();
    C.avisar(lista.length === 1 ? 'Se guardó 1 meta de ' + R.nombrePeriodo(periodo) + '.' : 'Se guardaron ' + lista.length + ' metas de ' + R.nombrePeriodo(periodo) + '.');
    preparar();
    dibujar();
  }

  function copiar() {
    const c = D.campana(campanaId);
    const anterior = R.periodoAnterior(periodo, c.corte);
    const ka = R.clavePeriodo(anterior);
    const k = R.clavePeriodo(periodo);
    let copiadas = 0;
    let habia = 0;
    editables().forEach(function (m) {
      const t = D.datos.metas[tabla[m.tipo]];
      const previa = t[m.id + '|' + ka];
      if (previa == null) return;
      habia++;
      if (t[m.id + '|' + k] == null) { t[m.id + '|' + k] = previa; copiadas++; }
    });
    if (!habia) { C.avisar('No hay metas de ' + R.nombrePeriodo(anterior) + ' que copiar.', 'error'); return; }
    if (!copiadas) { C.avisar('Las metas de este periodo ya tienen valor: no hay nada que copiar.', 'error'); return; }
    D.guardar();
    C.avisar(copiadas === 1 ? 'Se copió 1 meta de ' + R.nombrePeriodo(anterior) + '.' : 'Se copiaron ' + copiadas + ' metas de ' + R.nombrePeriodo(anterior) + '.');
    preparar();
    dibujar();
  }

  p.contenido.addEventListener('input', function (ev) {
    const ref = ev.target.dataset.meta;
    if (!ref) return;
    const v = ev.target.value;
    metaDeRef(ref).valor = v === '' ? null : Number(v);
    const pos = ev.target.value.length;
    dibujar();
    const n = p.contenido.querySelector('[data-meta="' + ref + '"]');
    if (n) { n.focus(); void pos; }
  });
  p.contenido.addEventListener('change', function (ev) {
    if (ev.target.id === 'campana') { campanaId = ev.target.value ? Number(ev.target.value) : null; periodo = null; preparar(); dibujar(); }
  });
  p.contenido.addEventListener('click', function (ev) {
    const per = ev.target.closest('[data-periodo]');
    if (per && !per.disabled) {
      const c = D.campana(campanaId);
      periodo = per.dataset.periodo === 'anterior' ? R.periodoAnterior(periodo, c.corte) : per.dataset.periodo === 'siguiente' ? R.periodoSiguiente(periodo, c.corte) : R.periodoQueContiene(hoy, c.corte);
      preparar();
      dibujar();
    } else if (ev.target.id === 'guardar') guardar();
    else if (ev.target.id === 'descartar') { preparar(); dibujar(); }
    else if (ev.target.id === 'copiar') copiar();
  });
  window.addEventListener('beforeunload', (ev) => { if (hayCambios()) { ev.preventDefault(); ev.returnValue = ''; } });

  preparar();
  dibujar();
})();
