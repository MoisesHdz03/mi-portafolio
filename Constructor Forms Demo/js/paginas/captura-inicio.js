/* Capturar: inicio del agente (InicioCaptura.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'capturar', titulo: 'Capturar', roles: ['Agente', 'Afiliado'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const campana = D.campana(yo.campanaId);
  const hoy = C.fechas.hoy();
  const mias = () => D.datos.capturas.filter((c) => c.agenteId === yo.id);

  function avance(titulo, rango, enviadas, meta, dias) {
    const faltan = Math.max(0, meta - enviadas);
    let h = '<section class="avance"><p><strong>' + e(titulo) + '</strong> <span class="detalle">' + e(rango) + '</span></p>' +
      '<p>Llevas <strong>' + C.numero(enviadas) + '</strong> de <strong>' + C.numero(meta) + '</strong>.</p>{{hijo:0}}';
    if (enviadas >= meta) h += '<p class="cumplida-texto">¡Meta cumplida!</p>';
    else if (dias === 1) h += '<p class="faltan">Te faltan <strong>' + C.numero(faltan) + '</strong> hoy.</p>';
    else if (dias > 1) h += '<p class="faltan">Te faltan ' + C.numero(faltan) + ': <strong>' + C.numero(R.faltanPorDia(meta, enviadas, dias)) + ' por día</strong> en los ' + dias + ' días que quedan.</p>';
    return { html: h + '</section>', hijo: V.barra(enviadas, meta) };
  }

  const enviadas = mias().filter((c) => c.estado === 'Enviada');
  const hoyEnviadas = enviadas.filter((c) => R.diaDe(c) === hoy).length;
  const periodo = R.periodoQueContiene(hoy, campana.corte);
  const metaAsignada = R.metaAgente(yo.id, periodo);
  const personal = D.datos.metaPersonal[yo.id];

  const tarjetas = [];
  if (metaAsignada) {
    tarjetas.push(avance('Meta de ' + R.nombrePeriodo(periodo), R.rangoPeriodo(periodo), R.enPeriodo(enviadas, periodo).length, metaAsignada, R.diasRestantes(periodo, hoy)));
  }
  if (personal) {
    const rango = R.rangoPersonal(personal.frecuencia, hoy, campana.corte);
    const cuenta = enviadas.filter((c) => { const d = R.diaDe(c); return d >= rango.inicio && d <= rango.fin; }).length;
    const dias = hoy > rango.fin ? 0 : C.fechas.diasEntre(hoy < rango.inicio ? rango.inicio : hoy, rango.fin) + 1;
    tarjetas.push(avance('Tu meta personal: ' + R.describirMeta(personal.frecuencia, personal.meta),
      personal.frecuencia === 'Diaria' ? 'hoy' : 'del ' + R.textoDia(rango.inicio) + ' al ' + R.textoDia(rango.fin), cuenta, personal.meta, dias));
  }

  const formularios = D.datos.formularios.filter((f) => f.campanaId === yo.campanaId && f.activo && D.versionPublicada(f));
  const borradores = mias().filter((c) => c.estado === 'Borrador').sort((a, b) => new Date(b.guardada) - new Date(a.guardada));

  const hijos = [V.descripcionCampana(campana)];
  let h = '<h1>Capturar</h1>{{hijo:0}}' +
    '<section class="avance"><p>Hoy llevas <strong>' + hoyEnviadas + '</strong> ' + (hoyEnviadas === 1 ? 'captura enviada' : 'capturas enviadas') + '.</p>' +
    (!tarjetas.length ? '<p class="detalle">Todavía no tienes metas. Tu supervisor te asigna la del periodo y tú puedes proponerte la tuya en <a href="mi-meta.html">Mi meta</a>.</p>' : '') + '</section>';

  h += '<div class="metas">';
  tarjetas.forEach(function (t) {
    // la tarjeta es un fragmento de esta página con la Barra como hijo
    const indice = hijos.length;
    hijos.push(V.barra(0, 0));
    h += t.html.replace('{{hijo:0}}', '{{hijo:' + indice + '}}');
    hijos[indice] = t.hijo;
  });
  h += '</div>';

  h += '<section><h2>Formularios</h2>' + (formularios.length
    ? '<div class="formularios">' + formularios.map((f) => '<a class="tarjeta" href="capturar.html?formulario=' + f.id + '"><strong>' + e(f.nombre) + '</strong><span>Capturar →</span></a>').join('') + '</div>'
    : '<p>No tienes formularios para capturar. Si crees que es un error, avisa a tu supervisor.</p>') + '</section>';

  if (borradores.length) {
    h += '<section><h2>Borradores</h2><table class="tabla"><thead><tr><th>Formulario</th><th>Guardado</th><th></th></tr></thead><tbody>' +
      borradores.map((b) => '<tr><td>' + e(D.formulario(b.formularioId).nombre) + ' <span class="detalle">versión ' + b.version + '</span></td>' +
        '<td class="fecha">' + C.fechas.fechaHora(b.guardada) + '</td><td><a href="capturar.html?borrador=' + b.id + '">Continuar</a></td></tr>').join('') +
      '</tbody></table></section>';
  }

  h += '<section><h2>Mis capturas enviadas</h2><div class="filtros">' +
    '<label>Día <input type="date" id="filtro-dia" value="' + hoy + '" /></label>' +
    '<label>Folio <input type="search" id="filtro-folio" placeholder="Buscar en todos los días" /></label></div><div id="lista-enviadas"></div></section>';

  p.contenido.innerHTML = C.marcar('InicioCaptura', h, hijos);

  let pagina = 1;
  function dibujarLista() {
    const dia = document.getElementById('filtro-dia').value;
    const folio = document.getElementById('filtro-folio').value.trim().toUpperCase();
    document.getElementById('filtro-dia').disabled = !!folio;
    const lista = enviadas.filter((c) => (folio ? c.folio.includes(folio) : R.diaDe(c) === dia)).sort((a, b) => new Date(b.enviada) - new Date(a.enviada));
    const paginas = Math.max(1, Math.ceil(lista.length / 20));
    pagina = Math.min(pagina, paginas);
    let x;
    if (!lista.length) x = '<p>' + (folio ? 'No hay capturas con ese folio.' : 'No enviaste capturas ese día.') + '</p>';
    else {
      x = '<table class="tabla"><thead><tr><th>Folio</th><th>Formulario</th><th>Subcampaña</th><th>Enviada</th><th></th></tr></thead><tbody>' +
        lista.slice((pagina - 1) * 20, pagina * 20).map(function (c) {
          const est = R.estadoVenta(c);
          const sub = campana.subcampanas.find((s) => s.id === c.subcampanaId);
          return '<tr><td class="folio">' + e(c.folio) + (est ? ' <span class="etiqueta ' + est.clase + '">' + est.texto + '</span>' : '') + '</td>' +
            '<td>' + e(D.formulario(c.formularioId).nombre) + '</td><td>' + e(sub ? sub.nombre : '—') + '</td>' +
            '<td class="fecha">' + C.fechas.fechaHora(c.enviada) + '</td><td><a href="captura-detalle.html?id=' + c.id + '">Ver</a></td></tr>';
        }).join('') + '</tbody></table>';
      if (paginas > 1) {
        x += '<div class="paginacion"><button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>Página ' + pagina + ' de ' + paginas + '</span>' +
          '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button></div>';
      }
    }
    document.getElementById('lista-enviadas').innerHTML = C.marcar('InicioCaptura', x);
  }
  document.getElementById('filtro-dia').addEventListener('change', () => { pagina = 1; dibujarLista(); });
  document.getElementById('filtro-folio').addEventListener('input', () => { pagina = 1; dibujarLista(); });
  document.getElementById('lista-enviadas').addEventListener('click', (ev) => { const b = ev.target.closest('[data-pag]'); if (b) { pagina = Number(b.dataset.pag); dibujarLista(); } });
  dibujarLista();
})();
