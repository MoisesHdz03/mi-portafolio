/* Panel BackOffice (PanelBackOffice.razor + GraficaPorDia, GraficaMotivos, RankingPanel, RankingDomiciliacion) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'panel', titulo: 'Panel BackOffice', roles: ['Administrador', 'Gerente', 'Supervisor BackOffice'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador' || yo.rol === 'Gerente';
  const hoy = C.fechas.hoy();
  const conBackOffice = D.datos.campanas.filter((c) => c.activa && c.usaBackOffice);
  const dia = (iso) => iso ? C.fechas.dia(iso) : null;
  const entre = (d, a, b) => d && d >= a && d <= b;

  let campanaId = esAdministrador ? (conBackOffice.length === 1 ? conBackOffice[0].id : null) : yo.campanaId;
  let periodo = 'Hoy';
  let desde = null;
  let hasta = null;

  function dias(campana) {
    if (periodo === 'Hoy') return [hoy, hoy];
    if (periodo === 'Actual') { const pe = R.periodoQueContiene(hoy, campana.corte); return [pe.inicio, pe.fin]; }
    let a = desde || hoy;
    let b = hasta || hoy;
    if (a > b) [a, b] = [b, a];
    return [a, b];
  }

  function ranking(personas, cuenta) {
    const ordenados = personas.map((u) => ({ nombre: u.nombre, ventas: cuenta(u) })).sort((a, b) => b.ventas - a.ventas || a.nombre.localeCompare(b.nombre));
    ordenados.forEach((x, i) => { x.posicion = i > 0 && x.ventas === ordenados[i - 1].ventas ? ordenados[i - 1].posicion : i + 1; });
    return ordenados;
  }

  function rankingPanel(titulo, columna, lugares) {
    let h = '<div class="ranking"><h3>' + e(titulo) + '</h3>';
    if (!lugares.length) return C.marcar('RankingPanel', h + '<p class="vacio">La campaña no tiene usuarios BackOffice activos ni ventas ' + columna.toLowerCase() + ' en estos días.</p></div>');
    h += '<table><thead><tr><th class="numero">Lugar</th><th>BackOffice</th><th class="numero">' + columna + '</th></tr></thead><tbody>' +
      lugares.map((l) => '<tr' + (l.ventas === 0 ? ' class="en-cero"' : '') + '><td class="numero posicion">' + l.posicion + '</td><td>' + e(l.nombre) + '</td><td class="numero">' + C.numero(l.ventas) + '</td></tr>').join('') +
      '</tbody></table></div>';
    return C.marcar('RankingPanel', h);
  }

  function rankingDomiciliacion(titulo, lugares) {
    let h = '<div class="ranking"><h3>' + e(titulo) + '</h3>';
    if (!lugares.length) return C.marcar('RankingDomiciliacion', h + '<p class="vacio">La campaña no tiene usuarios BackOffice activos ni ventas cobradas en estos días.</p></div>');
    h += '<table><thead><tr><th class="numero">Lugar</th><th>BackOffice</th><th class="numero">Cobradas</th><th class="numero">Domiciliadas</th><th class="numero">%</th></tr></thead><tbody>' +
      lugares.map((l) => '<tr' + (l.domiciliadas === 0 ? ' class="en-cero"' : '') + '><td class="numero posicion">' + l.posicion + '</td><td>' + e(l.nombre) + '</td><td class="numero">' + C.numero(l.cobradas) +
        '</td><td class="numero">' + C.numero(l.domiciliadas) + '</td><td class="numero porcentaje">' + (l.porcentaje == null ? '—' : l.porcentaje + ' %') + '</td></tr>').join('') +
      '</tbody></table></div>';
    return C.marcar('RankingDomiciliacion', h);
  }

  const tarjeta = (titulo, valor, clase, nota) => '<div class="tarjeta-cifra ' + clase + '"><span class="titulo-cifra">' + e(titulo) + '</span><strong>' + C.numero(valor) + '</strong>' +
    (nota ? '<span class="nota-cifra">' + e(nota) + '</span>' : '') + '</div>';

  function dibujar() {
    let h = '<h1>Panel BackOffice</h1>';
    if (esAdministrador) {
      h += '<label class="selector-campana">Campaña <select id="campana"><option value="">Elige una campaña con BackOffice</option>' +
        conBackOffice.map((c) => '<option value="' + c.id + '"' + (c.id === campanaId ? ' selected' : '') + '>' + e(c.nombre) + '</option>').join('') + '</select></label>';
    }
    const campana = campanaId ? D.campana(campanaId) : null;
    if (!campana || !campana.usaBackOffice) {
      h += '<p class="detalle">' + (esAdministrador ? 'Elige una campaña para ver su panel.' : 'Tu campaña no usa BackOffice o no tienes una campaña asignada. Pídele al administrador que lo revise.') + '</p>';
      p.contenido.innerHTML = C.marcar('PanelBackOffice', h);
      return;
    }
    const [inicio, fin] = dias(campana);
    // Con "Hoy", la gráfica por día y los acumulados muestran el periodo actual
    const [ia, fa] = periodo === 'Hoy' ? (function () { const pe = R.periodoQueContiene(hoy, campana.corte); return [pe.inicio, pe.fin]; })() : [inicio, fin];
    const ventas = R.enviadas().filter((c) => c.campanaId === campana.id);
    const bo = D.datos.usuarios.filter((u) => u.campanaId === campana.id && u.activo && (u.rol === 'BackOffice' || u.rol === 'Supervisor BackOffice'));

    const aprobadas = ventas.filter((c) => c.estatusValidacion === 'aprobada' && entre(dia(c.fechaValidacion), inicio, fin)).length;
    const rechV = ventas.filter((c) => c.estatusValidacion === 'rechazada' && entre(dia(c.fechaValidacion), inicio, fin)).length;
    const cobradas = ventas.filter((c) => c.estatusBackOffice === 'cobrada' && entre(dia(c.fechaCobro), inicio, fin)).length;
    const rechB = ventas.filter((c) => c.estatusBackOffice === 'rechazada' && entre(dia(c.fechaCobro), inicio, fin)).length;
    const subidas = ventas.filter((c) => entre(R.diaDe(c), inicio, fin));
    const mismoDia = subidas.filter((c) => c.estatusBackOffice === 'cobrada' && dia(c.fechaCobro) === R.diaDe(c)).length;

    const hijos = [];
    const hijo = (x) => { hijos.push(x); return '{{hijo:' + (hijos.length - 1) + '}}'; };
    const opciones = [['Hoy', 'Hoy'], ['Actual', 'Periodo actual'], ['Rango', 'Rango']];
    h += '<div class="controles"><div class="periodos" role="group" aria-label="Periodo">' +
      opciones.map(([k, n]) => '<button type="button" aria-pressed="' + (k === periodo) + '"' + (k === periodo ? ' class="activo"' : '') + ' data-periodo="' + k + '">' + n + '</button>').join('') + '</div>' +
      (periodo === 'Rango' ? '<label>Desde <input type="date" id="desde" value="' + inicio + '" /></label><label>Hasta <input type="date" id="hasta" value="' + fin + '" /></label>' : '') +
      '<button type="button" class="secundario" id="actualizar">Actualizar</button><span class="detalle">Se actualiza sola cada 20 segundos</span></div>' +
      '<p class="detalle">' + e(campana.nombre) + ', ' + V.textoDias(inicio, fin) + '. Las pendientes son todas las que faltan, sin importar la fecha; las demás cuentan por el día en que se validaron o se cobraron.</p>';

    h += '<section><h2>Validación</h2><div class="tarjetas">' + tarjeta('Pendientes de validar', ventas.filter((c) => !c.estatusValidacion).length, 'pendiente') +
      tarjeta('Aprobadas', aprobadas, 'correcta', 'Incluye las que ya se cobraron') + tarjeta('Rechazadas en validación', rechV, 'rechazada') + '</div></section>' +
      '<section><h2>Cobro</h2><div class="tarjetas">' + tarjeta('Pendientes de cobrar', ventas.filter((c) => R.bandejaDe(c) === 'backoffice').length, 'pendiente') +
      tarjeta('Cobradas', cobradas, 'correcta') + tarjeta('Rechazadas por BackOffice', rechB, 'rechazada') + '</div></section>' +
      '<section><h2>Cobro el mismo día</h2><p class="detalle">De las ventas que se subieron ' + V.textoDias(inicio, fin) + ', cuántas se cobraron el mismo día en que se subieron.</p><div class="tarjetas">' +
      tarjeta('Ventas subidas', subidas.length, 'subidas') + tarjeta('Cobradas el mismo día', mismoDia, 'correcta', subidas.length ? Math.round(100 * mismoDia / subidas.length) + ' % de las subidas' : null) + '</div></section>';

    // Cobradas por día
    const diasGrafica = C.fechas.diasEntre(ia, fa) + 1;
    h += '<section><h2>Cobradas por día</h2><p class="detalle">' + V.textoDias(ia, fa) + '</p>';
    if (diasGrafica <= 92) {
      const serie = V.listaDias(ia, fa < hoy ? fa : hoy).map((d) => ({ dia: d, cantidad: ventas.filter((c) => c.estatusBackOffice === 'cobrada' && dia(c.fechaCobro) === d).length }));
      h += hijo(V.graficaPorDia(serie, { descripcion: 'Ventas cobradas por día', singular: 'cobrada', plural: 'cobradas' }));
    } else h += '<p class="detalle">Esta gráfica se ve con rangos de hasta 92 días.</p>';
    h += '</section>';

    // Motivos de rechazo: cada rechazo por el día en que ocurrió
    const rechazos = ventas.flatMap((c) => c.rechazos).filter((r) => entre(dia(r.fecha), inicio, fin));
    h += '<section><h2>Principales motivos de rechazo</h2><p class="detalle">' + V.textoDias(inicio, fin) + '. Cuenta cada rechazo por el día en que ocurrió, aunque la venta se haya aprobado o cobrado después.</p><div class="dos-columnas">' +
      hijo(V.graficaMotivos('En validación', V.agrupar(rechazos.filter((r) => r.etapa === 'Validación').map((r) => r.motivo), 5, 'Otros'))) +
      hijo(V.graficaMotivos('En BackOffice', V.agrupar(rechazos.filter((r) => r.etapa === 'BackOffice').map((r) => r.motivo), 5, 'Otros'))) + '</div></section>';

    // Rankings
    const cobradasDe = (a, b) => (u) => ventas.filter((c) => c.cobradorId === u.id && c.estatusBackOffice === 'cobrada' && entre(dia(c.fechaCobro), a, b)).length;
    const aprobadasDe = (a, b) => (u) => ventas.filter((c) => c.validadorId === u.id && c.estatusValidacion === 'aprobada' && entre(dia(c.fechaValidacion), a, b)).length;
    const acumulado = 'Acumulado ' + V.textoDias(ia, fa);
    h += '<section><h2>Ranking de cobradas</h2><p class="detalle">Cuenta las ventas por el día en que se cobraron, a nombre de quien las marcó como Cobrada. Quienes empatan comparten lugar.</p><div class="dos-columnas">' +
      hijo(rankingPanel('Hoy', 'Cobradas', ranking(bo, cobradasDe(hoy, hoy)))) + hijo(rankingPanel(acumulado, 'Cobradas', ranking(bo, cobradasDe(ia, fa)))) + '</div></section>' +
      '<section><h2>Ranking de aprobadas</h2><p class="detalle">Cuenta las ventas por el día en que se validaron, a nombre de quien las aprobó, aunque después se rechacen en cobro. Quienes empatan comparten lugar.</p><div class="dos-columnas">' +
      hijo(rankingPanel('Hoy', 'Aprobadas', ranking(bo, aprobadasDe(hoy, hoy)))) + hijo(rankingPanel(acumulado, 'Aprobadas', ranking(bo, aprobadasDe(ia, fa)))) + '</div></section>';

    const domiciliada = (c) => c.respuestas.generales.banco_seleccionado_por_backoffice && c.respuestas.generales.banco_seleccionado_por_backoffice !== 'no_domicilia';
    function domiciliacion(a, b) {
      const lista = bo.map(function (u) {
        const suyas = ventas.filter((c) => c.cobradorId === u.id && c.estatusBackOffice === 'cobrada' && entre(dia(c.fechaCobro), a, b));
        const dom = suyas.filter(domiciliada).length;
        return { nombre: u.nombre, cobradas: suyas.length, domiciliadas: dom, porcentaje: suyas.length ? Math.round(100 * dom / suyas.length) : null };
      }).sort((x, y) => (y.porcentaje || 0) - (x.porcentaje || 0) || y.domiciliadas - x.domiciliadas || x.nombre.localeCompare(y.nombre));
      lista.forEach((x, i) => { const ant = lista[i - 1]; x.posicion = ant && ant.porcentaje === x.porcentaje && ant.domiciliadas === x.domiciliadas ? ant.posicion : i + 1; });
      return lista;
    }
    h += '<section><h2>Ranking de domiciliación</h2><p class="detalle">De las ventas que cobró cada uno, cuántas tienen un banco elegido (sin contar "No domicilia"). Va por porcentaje y, si empatan, por quien domicilió más. Solo cuentan las ventas de las versiones del formulario que ya tienen el campo del banco.</p><div class="dos-columnas">' +
      hijo(rankingDomiciliacion('Hoy', domiciliacion(hoy, hoy))) + hijo(rankingDomiciliacion(acumulado, domiciliacion(ia, fa))) + '</div></section>';

    const sucursales = ventas.filter((c) => c.estatusBackOffice === 'cobrada' && entre(dia(c.fechaCobro), ia, fa) && domiciliada(c))
      .map((c) => (c.copiaCatalogo.sucursal && c.copiaCatalogo.sucursal.nombre) || 'Sin sucursal');
    h += '<section><h2>Domiciliadas por sucursal</h2><p class="detalle">' + V.textoDias(ia, fa) + ', por el día en que se cobraron. La sucursal es la que capturó el agente; se juntan aunque estén escritas con otras mayúsculas o acentos.</p>' +
      hijo(V.graficaMotivos('Sucursales', V.agrupar(sucursales, 10, 'Otras sucursales'), { singular: 'domiciliada', plural: 'domiciliadas', vacio: 'Sin ventas domiciliadas en estos días.' })) + '</section>';

    p.contenido.innerHTML = C.marcar('PanelBackOffice', h, hijos);
  }

  p.contenido.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-periodo]');
    if (b) {
      if (b.dataset.periodo === 'Rango' && periodo !== 'Rango') { const [a, z] = dias(D.campana(campanaId)); desde = a; hasta = z; }
      periodo = b.dataset.periodo;
      dibujar();
    } else if (ev.target.id === 'actualizar') dibujar();
  });
  p.contenido.addEventListener('change', function (ev) {
    if (ev.target.id === 'campana') { campanaId = ev.target.value ? Number(ev.target.value) : null; dibujar(); }
    else if (ev.target.id === 'desde') { desde = ev.target.value || null; dibujar(); }
    else if (ev.target.id === 'hasta') { hasta = ev.target.value || null; dibujar(); }
  });
  setInterval(function () { if (!document.hidden && !['desde', 'hasta'].includes(document.activeElement.id)) dibujar(); }, 20000);

  dibujar();
})();
