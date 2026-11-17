/* Captura enviada, vista del agente (DetalleCaptura.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'capturar', titulo: 'Captura', roles: ['Agente', 'Afiliado'] });
  if (!p) return;
  const e = C.e;
  const c = D.captura(C.param('id'));
  if (!c || c.agenteId !== p.usuario.id || c.estado !== 'Enviada') {
    p.contenido.innerHTML = C.marcar('DetalleCaptura', '<p class="migas"><a href="captura-inicio.html">Capturar</a> / ...</p><p>La captura no existe o no es tuya. <a href="captura-inicio.html">Volver</a></p>');
    return;
  }
  document.title = c.folio + ' - Constructor Forms';
  const f = D.formulario(c.formularioId);
  const def = D.version(f, c.version).definicion;
  const campana = D.campana(c.campanaId);
  const sub = campana.subcampanas.find((s) => s.id === c.subcampanaId);

  const historial = V.historial(c, true);
  let h = '<p class="migas"><a href="captura-inicio.html">Capturar</a> / ' + e(c.folio) + '</p>' +
    '<div class="encabezado"><h1>' + e(c.folio) + '</h1><p class="detalle">' + e(f.nombre) + ' · versión ' + c.version +
    (sub ? '<span> · ' + e(sub.nombre) + '</span>' : '') + ' · enviada el ' + C.fechas.corta(c.enviada) + ' a las ' + C.fechas.hora(c.enviada) + '</p>' +
    (historial ? '<p class="corregida">Se corrigió después de enviarla. Abajo puedes ver qué se cambió y por qué.</p>'
      : '<p class="aviso">Las capturas enviadas no se pueden modificar. Si hay un error, avisa a tu supervisor con el folio.</p>') + '</div>' +
    '{{hijo:0}}<div id="formulario-detalle"></div>{{hijo:1}}';
  p.contenido.innerHTML = C.marcar('DetalleCaptura', h, [V.estadoVenta(c, 'Estado de tu captura'), historial]);

  Formulario.montar(document.getElementById('formulario-detalle'), {
    def, respuestas: JSON.parse(JSON.stringify(c.respuestas)), soloLectura: true,
    opciones: V.opcionesMotor(c, null, { conservarCopia: true }),
  });
})();
