/* Bandejas de BackOffice (Bandejas.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'bandejas', titulo: 'Bandejas', roles: ['Administrador', 'Gerente', 'BackOffice', 'Supervisor BackOffice'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const esAdministrador = yo.rol === 'Administrador' || yo.rol === 'Gerente';
  const esGerente = yo.rol === 'Gerente';
  const POR_PAGINA = 20;
  const conBackOffice = D.datos.campanas.filter((c) => c.activa && c.usaBackOffice);

  let campanaId = esAdministrador ? (Number(C.param('campana')) || (conBackOffice.length === 1 ? conBackOffice[0].id : null)) : yo.campanaId;
  let bandeja = R.BANDEJAS.some((b) => b.clave === C.param('bandeja')) ? C.param('bandeja') : 'validacion';
  let folio = '';
  let pagina = 1;

  function dibujar() {
    let h = '<h1>Bandejas</h1>';
    if (esAdministrador) {
      h += '<label class="selector-campana">Campaña <select id="campana"><option value="">Elige una campaña con BackOffice</option>' +
        conBackOffice.map((c) => '<option value="' + c.id + '"' + (c.id === campanaId ? ' selected' : '') + '>' + e(c.nombre) + '</option>').join('') + '</select></label>';
    }
    const campana = campanaId ? D.campana(campanaId) : null;
    if (!campana || !campana.usaBackOffice) {
      h += '<p class="detalle">' + (esAdministrador ? 'Elige una campaña para ver sus bandejas.' : 'Tu campaña no usa BackOffice o no tienes una campaña asignada. Pídele al administrador que lo revise.') + '</p>';
      p.contenido.innerHTML = C.marcar('Bandejas', h);
      return;
    }
    const ventas = R.enviadas().filter((c) => c.campanaId === campana.id);
    const conteos = {};
    R.BANDEJAS.forEach((b) => { conteos[b.clave] = 0; });
    ventas.forEach((c) => { const b = R.bandejaDe(c); if (b) conteos[b]++; });
    const texto = folio.trim().toUpperCase();
    const filas = ventas.filter((c) => R.bandejaDe(c) === bandeja && (!texto || c.folio.includes(texto)))
      .sort((a, b) => new Date(a.enviada) - new Date(b.enviada));
    const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
    pagina = Math.min(pagina, paginas);

    h += '<div class="pestanas" role="tablist" aria-label="Bandejas de ' + e(campana.nombre) + '">' +
      R.BANDEJAS.map((b) => '<button type="button" role="tab" aria-selected="' + (b.clave === bandeja) + '"' + (b.clave === bandeja ? ' class="activa"' : '') + ' data-bandeja="' + b.clave + '">' +
        e(b.nombre) + ' <span class="conteo">' + conteos[b.clave] + '</span></button>').join('') + '</div>' +
      '<div class="filtros"><label>Folio <input id="folio" value="' + e(folio) + '" placeholder="Buscar por folio" /></label>' +
      '<button type="button" class="secundario" id="actualizar">Actualizar</button><span class="detalle">Se actualiza sola cada 20 segundos</span></div>';

    if (!filas.length) h += '<p>' + (texto ? 'No hay ventas con ese folio en esta bandeja.' : 'No hay ventas en esta bandeja.') + '</p>';
    else {
      const validacion = bandeja === 'validacion';
      const rechazadaBo = bandeja === 'rechazadas-backoffice';
      h += '<p class="detalle">La que lleva más tiempo esperando sale primero. Fechas en hora de la Ciudad de México.</p><div class="contenedor-tabla"><table class="tabla"><thead><tr><th>Folio</th><th>Enviada</th><th>Agente</th>' +
        (validacion ? '' : '<th>Validó</th>') + (rechazadaBo ? '<th>Cobró</th>' : '') + '<th></th></tr></thead><tbody>' +
        filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map(function (c) {
          const agente = D.usuario(c.agenteId);
          const tomada = c.apartadaPor && c.apartadaPor !== yo.id ? D.nombre(c.apartadaPor) : null;
          return '<tr><td class="folio">' + e(c.folio) + (c.rechazadaPorNip ? ' <span class="etiqueta etiqueta-aviso" title="Se rechazó sola al agotar los intentos del NIP">rechazada por NIP</span>' : '') + '</td>' +
            '<td class="fecha">' + C.fechas.fechaHora(c.enviada) + '</td><td>' + e(agente.nombre) +
            (agente.rol === 'Afiliado' ? ' <span class="etiqueta" title="La subió un afiliado: para aprobarla se pide NIP">afiliado</span>' : '') + '</td>' +
            (validacion ? '' : '<td>' + e(c.validadorId ? D.nombre(c.validadorId) : '—') + '</td>') +
            (rechazadaBo ? '<td>' + e(c.cobradorId ? D.nombre(c.cobradorId) : '—') + '</td>' : '') +
            '<td class="accion">' + (tomada ? '<span class="detalle">La está trabajando ' + e(tomada) + '</span>' : esGerente ? '' : '<a href="venta.html?id=' + c.id + '">Trabajar</a>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      if (paginas > 1) {
        h += '<div class="paginacion"><button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>Página ' + pagina + ' de ' + paginas + '</span>' +
          '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button></div>';
      }
    }
    p.contenido.innerHTML = C.marcar('Bandejas', h);
  }

  p.contenido.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-bandeja]');
    const pag = ev.target.closest('[data-pag]');
    if (b) { bandeja = b.dataset.bandeja; pagina = 1; history.replaceState(null, '', 'bandejas.html?bandeja=' + bandeja + (esAdministrador && campanaId ? '&campana=' + campanaId : '')); dibujar(); }
    else if (pag) { pagina = Number(pag.dataset.pag); dibujar(); }
    else if (ev.target.id === 'actualizar') { D.recargar && D.recargar(); dibujar(); }
  });
  p.contenido.addEventListener('change', function (ev) {
    if (ev.target.id === 'campana') { campanaId = ev.target.value ? Number(ev.target.value) : null; pagina = 1; dibujar(); }
  });
  p.contenido.addEventListener('input', function (ev) {
    if (ev.target.id !== 'folio') return;
    folio = ev.target.value;
    pagina = 1;
    dibujar();
    const n = document.getElementById('folio');
    n.focus();
    n.setSelectionRange(folio.length, folio.length);
  });
  // Como la real: se vuelve a leer cada 20 segundos mientras la pestaña está visible
  setInterval(function () { if (!document.hidden && document.activeElement.id !== 'folio') dibujar(); }, 20000);

  dibujar();
})();
