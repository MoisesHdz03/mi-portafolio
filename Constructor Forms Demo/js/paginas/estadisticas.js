/* Estadísticas (PanelEstadisticas.razor + GraficaPorDia) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'estadisticas', titulo: 'Estadísticas', roles: ['Administrador', 'Gerente', 'Coordinador'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador' || yo.rol === 'Gerente';
  const hoy = C.fechas.hoy();
  let campanaId = esAdministrador ? null : yo.campanaId;
  let periodo = null;
  let formularioId = '';

  function datos(c) {
    const actual = R.clavePeriodo(periodo) === R.clavePeriodo(R.periodoQueContiene(hoy, c.corte));
    const capturas = R.enPeriodo(R.enviadas().filter((x) => x.campanaId === c.id && (!formularioId || x.formularioId === Number(formularioId))), periodo);
    const meta = R.metaCampana(c.id, periodo) || null;
    const porcentaje = (env, m) => m > 0 ? Math.floor(100 * env / m) : null;
    const supervisores = D.datos.usuarios.filter((u) => u.rol === 'Supervisor' && (u.campanaId === c.id || capturas.some((x) => x.supervisorId === u.id)))
      .map(function (s) {
        const env = capturas.filter((x) => x.supervisorId === s.id).length;
        const m = R.metaSupervisor(s.id, periodo) || null;
        return { nombre: s.nombre, enCampana: s.campanaId === c.id && s.activo, enviadas: env, meta: m, porcentaje: porcentaje(env, m) };
      }).sort((a, b) => b.enviadas - a.enviadas || a.nombre.localeCompare(b.nombre));
    const agentes = D.datos.usuarios.filter((u) => (u.rol === 'Agente' || u.rol === 'Afiliado') && ((u.campanaId === c.id && u.activo) || capturas.some((x) => x.agenteId === u.id)))
      .map(function (a) {
        const env = capturas.filter((x) => x.agenteId === a.id).length;
        const m = R.metaAgente(a.id, periodo) || null;
        return { nombre: a.nombre, supervisor: a.supervisorId ? D.nombre(a.supervisorId) : null, enCampana: a.campanaId === c.id && a.activo, enviadas: env, meta: m, porcentaje: porcentaje(env, m) };
      }).sort((a, b) => b.enviadas - a.enviadas || a.nombre.localeCompare(b.nombre));
    agentes.forEach((x, i) => { x.posicion = i > 0 && x.enviadas === agentes[i - 1].enviadas ? agentes[i - 1].posicion : i + 1; });
    const fin = periodo.fin < hoy ? periodo.fin : hoy;
    const porDia = periodo.inicio > hoy ? [] : V.listaDias(periodo.inicio, fin).map((d) => ({ dia: d, cantidad: capturas.filter((x) => R.diaDe(x) === d).length }));
    return { actual, capturas, meta, porcentaje: porcentaje(capturas.length, meta), supervisores, agentes, porDia, dias: R.diasRestantes(periodo, hoy) };
  }

  function dibujar() {
    let h = '<h1>Estadísticas</h1>';
    if (esAdministrador) {
      h += '<label class="selector">Campaña <select id="campana"><option value="">Elige una campaña</option>' +
        D.datos.campanas.filter((x) => x.activa).map((x) => '<option value="' + x.id + '"' + (x.id === campanaId ? ' selected' : '') + '>' + e(x.nombre) + '</option>').join('') + '</select></label>';
    }
    if (!campanaId) {
      p.contenido.innerHTML = C.marcar('PanelEstadisticas', h + '<p class="detalle">Elige una campaña para ver sus estadísticas.</p>');
      return;
    }
    const c = D.campana(campanaId);
    if (!periodo) periodo = R.periodoQueContiene(hoy, c.corte);
    const d = datos(c);
    const hijos = [];
    const hijo = (x) => { hijos.push(x); return '{{hijo:' + (hijos.length - 1) + '}}'; };
    const formularios = D.datos.formularios.filter((f) => f.campanaId === c.id);
    const cumplida = (env, m) => m > 0 && env >= m;

    h += hijo(V.descripcionCampana(c)) + '<div class="controles"><div class="periodo"><button data-periodo="anterior">&larr;</button><span class="nombre-periodo"><strong>' + R.nombrePeriodo(periodo) + '</strong>' +
      (d.actual ? '<span class="etiqueta">periodo actual</span>' : '') + '<span class="detalle">' + R.rangoPeriodo(periodo) + '</span></span><button data-periodo="siguiente">&rarr;</button>' +
      (d.actual ? '' : '<button class="secundario" data-periodo="actual">Periodo actual</button>') + '</div>' +
      '<div class="acciones-derecha"><label class="selector">Formulario <select id="formulario"><option value="">Todos</option>' +
      formularios.map((f) => '<option value="' + f.id + '"' + (String(f.id) === formularioId ? ' selected' : '') + '>' + e(f.nombre) + '</option>').join('') + '</select></label>' +
      '<button class="descargar" id="descargar" title="Resumen, supervisores, ranking y capturas por día de lo que estás viendo">Descargar Excel</button></div></div>';
    if (formularioId) h += '<p class="aviso">Solo se cuentan las capturas de este formulario; las metas son las del periodo completo.</p>';

    h += '<section class="resumen"><div class="cifra-grande"><span class="etiqueta-cifra">Capturas del periodo</span><strong>' + C.numero(d.capturas.length) + '</strong></div>';
    if (d.meta) {
      h += '<div class="cifra-grande"><span class="etiqueta-cifra">Meta</span><strong>' + C.numero(d.meta) + '</strong></div>' +
        '<div class="cifra-grande"><span class="etiqueta-cifra">Avance</span><strong' + (cumplida(d.capturas.length, d.meta) ? ' class="cumplida"' : '') + '>' + d.porcentaje + ' %</strong>' + hijo(V.barra(d.capturas.length, d.meta)) + '</div>';
      if (d.actual && !cumplida(d.capturas.length, d.meta)) {
        h += '<div class="cifra-grande"><span class="etiqueta-cifra">Faltan por día</span><strong>' + C.numero(R.faltanPorDia(d.meta, d.capturas.length, d.dias)) + '</strong>' +
          '<span class="detalle">' + (d.dias === 1 ? 'queda 1 día' : 'quedan ' + d.dias + ' días') + '</span></div>';
      }
    } else h += '<p class="detalle">La campaña no tiene metas en este periodo. Se ponen en <a href="metas.html">Metas</a>.</p>';
    h += '</section><section><h2>Capturas por día</h2>' + hijo(V.graficaPorDia(d.porDia, { diasDelPeriodo: C.fechas.diasEntre(periodo.inicio, periodo.fin) + 1, meta: d.meta })) + '</section>';

    h += '<section><h2>Por supervisor</h2>';
    if (!d.supervisores.length) h += '<p class="detalle">La campaña no tiene supervisores ni capturas en este periodo.</p>';
    else {
      h += '<table class="tabla"><thead><tr><th>Supervisor</th><th class="numero">Capturas</th><th class="numero">Meta</th><th class="numero">%</th><th>Avance</th></tr></thead><tbody>' +
        d.supervisores.map((s) => '<tr><td>' + e(s.nombre) + (s.enCampana ? '' : ' <span class="detalle">(ya no está en la campaña)</span>') + '</td><td class="numero">' + C.numero(s.enviadas) + '</td>' +
          '<td class="numero">' + (s.meta ? C.numero(s.meta) : '—') + '</td><td class="numero' + (cumplida(s.enviadas, s.meta) ? ' cumplida' : '') + '">' + (s.porcentaje == null ? '—' : s.porcentaje + ' %') + '</td>' +
          '<td>' + (s.meta ? hijo(V.barra(s.enviadas, s.meta)) : '') + '</td></tr>').join('') +
        '</tbody></table><p class="detalle">Las capturas de un supervisor son las que se enviaron con él, aunque después le hayan cambiado agentes.</p>';
    }
    h += '</section><section><h2>Ranking de agentes</h2>';
    if (!d.agentes.length) h += '<p class="detalle">La campaña no tiene agentes ni capturas en este periodo.</p>';
    else {
      h += '<table class="tabla"><thead><tr><th class="numero">Lugar</th><th>Agente</th><th>Supervisor</th><th class="numero">Capturas</th><th class="numero">Meta</th><th class="numero">%</th><th>Avance</th></tr></thead><tbody>' +
        d.agentes.map((a) => '<tr' + (a.enviadas === 0 ? ' class="en-cero"' : '') + '><td class="numero lugar">' + a.posicion + '</td><td>' + e(a.nombre) + (a.enCampana ? '' : ' <span class="detalle">(ya no está en la campaña)</span>') + '</td>' +
          '<td>' + e(a.supervisor || '—') + '</td><td class="numero">' + C.numero(a.enviadas) + '</td><td class="numero">' + (a.meta ? C.numero(a.meta) : '—') + '</td>' +
          '<td class="numero' + (cumplida(a.enviadas, a.meta) ? ' cumplida' : '') + '">' + (a.porcentaje == null ? '—' : a.porcentaje + ' %') + '</td><td>' + (a.meta ? hijo(V.barra(a.enviadas, a.meta)) : '') + '</td></tr>').join('') +
        '</tbody></table>';
    }
    h += '</section>';
    p.contenido.innerHTML = C.marcar('PanelEstadisticas', h, hijos);
  }

  function descargar() {
    const c = D.campana(campanaId);
    const d = datos(c);
    const filas = [['Estadísticas de ' + c.nombre + ' · ' + R.nombrePeriodo(periodo) + ' (' + R.rangoPeriodo(periodo) + ')'], [], ['Capturas del periodo', d.capturas.length], ['Meta', d.meta || ''], [],
      ['Supervisor', 'Capturas', 'Meta', '%']].concat(d.supervisores.map((s) => [s.nombre, s.enviadas, s.meta || '', s.porcentaje == null ? '' : s.porcentaje]))
      .concat([[], ['Lugar', 'Agente', 'Supervisor', 'Capturas', 'Meta', '%']]).concat(d.agentes.map((a) => [a.posicion, a.nombre, a.supervisor || '', a.enviadas, a.meta || '', a.porcentaje == null ? '' : a.porcentaje]))
      .concat([[], ['Día', 'Capturas']]).concat(d.porDia.map((x) => [x.dia, x.cantidad]));
    C.descargarCsv('estadisticas-' + (c.prefijo || c.id).toLowerCase() + '-' + R.clavePeriodo(periodo) + '.csv', filas);
    C.avisar('En la demo se descarga como CSV (la app real genera un Excel con varias hojas).');
  }

  p.contenido.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-periodo]');
    if (b) {
      const c = D.campana(campanaId);
      periodo = b.dataset.periodo === 'anterior' ? R.periodoAnterior(periodo, c.corte) : b.dataset.periodo === 'siguiente' ? R.periodoSiguiente(periodo, c.corte) : R.periodoQueContiene(hoy, c.corte);
      dibujar();
    } else if (ev.target.id === 'descargar') descargar();
  });
  p.contenido.addEventListener('change', function (ev) {
    if (ev.target.id === 'campana') { campanaId = ev.target.value ? Number(ev.target.value) : null; periodo = null; formularioId = ''; dibujar(); }
    else if (ev.target.id === 'formulario') { formularioId = ev.target.value; dibujar(); }
  });
  dibujar();
})();
