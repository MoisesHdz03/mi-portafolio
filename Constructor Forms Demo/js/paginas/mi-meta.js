/* Mi meta (MiMeta.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'miMeta', titulo: 'Mi meta', roles: ['Agente', 'Afiliado'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const campana = D.campana(yo.campanaId);
  const actual = R.periodoQueContiene(C.fechas.hoy(), campana.corte);
  let periodo = actual;
  let personal = null;
  let frecuencia = 'Diaria';

  function cargarPersonal() {
    const m = D.datos.metaPersonal[yo.id];
    personal = m ? m.meta : null;
    frecuencia = m ? m.frecuencia : 'Diaria';
  }
  cargarPersonal();

  function dibujar() {
    const esActual = R.clavePeriodo(periodo) === R.clavePeriodo(actual);
    const asignada = R.metaAgente(yo.id, periodo);
    const mia = D.datos.metaPersonal[yo.id];
    const sinCambios = mia && mia.meta === personal && mia.frecuencia === frecuencia;
    const aviso = frecuencia === 'Mensual' && personal && asignada && personal < asignada ? 'Tu meta personal es menor que la que te asignaron (' + C.numero(asignada) + ').' : null;
    const h = '<h1>Mi meta</h1>' +
      '<div class="periodo"><button data-periodo="anterior">&larr; Anterior</button><div class="nombre-periodo"><strong>' + R.nombrePeriodo(periodo) + '</strong>' +
      (esActual ? '<span class="etiqueta">periodo actual</span>' : '') + '<span class="detalle">' + R.rangoPeriodo(periodo) + '</span></div>' +
      '<button data-periodo="siguiente">Siguiente &rarr;</button>' + (esActual ? '' : '<button class="secundario" data-periodo="actual">Ir al periodo actual</button>') + '</div>' +
      '<div class="tarjetas"><section class="tarjeta"><h2>Meta asignada</h2>' +
      (asignada ? '<p class="cifra">' + C.numero(asignada) + '</p><p class="detalle">La pone tu supervisor para ' + e(campana.nombre) + '.</p>'
        : '<p class="cifra vacia">Sin meta</p><p class="detalle">Tu supervisor todavía no te asigna meta para este periodo.</p>') + '</section>' +
      '<section class="tarjeta personal"><h2>Mi meta personal</h2>' +
      (mia ? '<p class="cifra">' + R.describirMeta(mia.frecuencia, mia.meta) + '</p>' : '<p class="cifra vacia">Sin meta</p>') +
      '<div class="editar"><input type="number" min="1" max="100000" id="personal" value="' + (personal || '') + '" placeholder="Cuántas" />' +
      '<select id="frecuencia">' + Object.keys(R.FRECUENCIAS).map((k) => '<option value="' + k + '"' + (k === frecuencia ? ' selected' : '') + '>' + R.FRECUENCIAS[k] + '</option>').join('') + '</select>' +
      '<button id="guardar"' + (!personal || sinCambios ? ' disabled' : '') + '>Guardar</button>' + (mia ? '<button class="secundario" id="quitar">Quitar</button>' : '') + '</div>' +
      (aviso ? '<p class="aviso">' + e(aviso) + '</p>' : '') +
      '<p class="detalle">Las capturas que tú te propones hacer, aparte de la asignada; por ejemplo, para comisionar. Elige si es por día, por semana, por quincena o por mes. Sigue vigente hasta que la cambies y solo tú la ves.</p></section></div>';
    p.contenido.innerHTML = C.marcar('MiMeta', h);

    const entrada = document.getElementById('personal');
    entrada.addEventListener('input', () => { personal = entrada.value ? Number(entrada.value) : null; const pos = entrada.selectionStart; dibujar(); const n = document.getElementById('personal'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { /* number */ } });
    document.getElementById('frecuencia').addEventListener('change', (ev) => { frecuencia = ev.target.value; dibujar(); });
    document.getElementById('guardar').addEventListener('click', function () {
      if (!personal || personal < 1 || personal > 100000) { C.avisar('La meta debe estar entre 1 y 100,000, o quedar vacía.', 'error'); return; }
      D.datos.metaPersonal[yo.id] = { meta: personal, frecuencia };
      D.guardar();
      C.avisar('Tu meta personal es ' + R.describirMeta(frecuencia, personal) + '.');
      dibujar();
    });
    const quitar = document.getElementById('quitar');
    if (quitar) quitar.addEventListener('click', function () {
      delete D.datos.metaPersonal[yo.id];
      D.guardar();
      cargarPersonal();
      C.avisar('Quitaste tu meta personal.');
      dibujar();
    });
  }

  p.contenido.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-periodo]');
    if (!b) return;
    periodo = b.dataset.periodo === 'anterior' ? R.periodoAnterior(periodo, campana.corte) : b.dataset.periodo === 'siguiente' ? R.periodoSiguiente(periodo, campana.corte) : actual;
    dibujar();
  });
  dibujar();
})();
