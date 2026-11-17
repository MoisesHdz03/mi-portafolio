/* Consultar NIP (ConsultarNip.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'consultarNip', titulo: 'Consultar NIP', roles: ['Supervisor BackOffice'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  let folio = '';
  let resultado = null;

  function consultar() {
    const texto = folio.trim().toUpperCase();
    if (!texto) return { error: 'Escribe el folio de la venta.' };
    const venta = R.enviadas().find((c) => c.campanaId === yo.campanaId && c.folio === texto);
    if (!venta) return { error: 'No hay una venta con el folio ' + texto + ' en tu campaña.' };
    if (D.usuario(venta.agenteId).rol !== 'Afiliado') return { error: 'La venta ' + venta.folio + ' no es de un afiliado: no necesita NIP.' };
    if (venta.nipVerificado) return { error: 'El NIP de la venta ' + venta.folio + ' ya se verificó.' };
    const nip = D.datos.nips[venta.id];
    if (!nip || !nip.codigo) return { error: 'La venta ' + venta.folio + ' no tiene un NIP vigente. Primero hay que enviarlo desde la venta.' };
    if (new Date(nip.vence) < new Date()) return { error: 'El NIP de la venta ' + venta.folio + ' ya venció. Hay que enviar uno nuevo desde la venta.' };
    // Cada consulta queda en la bitácora
    D.registrar(yo.id, 'Consultar NIP', 'Captura', venta.folio, []);
    D.guardar();
    return { folio: venta.folio, nip: nip.codigo, vence: nip.vence, telefono: '****' + nip.telefono.slice(-4), enviadoPor: D.nombre(nip.enviadoPor) };
  }

  function dibujar() {
    let h = '<h1>Consultar NIP</h1><p class="detalle">Para los clientes a los que no les llega el SMS. Solo se muestra el NIP vigente de una venta de afiliado de tu campaña, y cada consulta queda registrada en la bitácora.</p>' +
      '<form class="consulta" id="consulta"><label>Folio de la venta <input id="folio" value="' + e(folio) + '" placeholder="TEL-000001" autocomplete="off" /></label><button type="submit" class="principal">Consultar</button></form>';
    if (resultado && resultado.error) h += '<p class="aviso-consulta" role="alert">' + e(resultado.error) + '</p>';
    else if (resultado) {
      h += '<section class="resultado" aria-label="NIP de la venta ' + e(resultado.folio) + '"><span class="etiqueta-nip">NIP de la venta ' + e(resultado.folio) + '</span>' +
        '<strong class="nip">' + e(resultado.nip) + '</strong><span class="detalle">Vale hasta las ' + C.fechas.hora(resultado.vence) + ' · enviado a ' + e(resultado.telefono) + ' por ' + e(resultado.enviadoPor) + '</span></section>';
    }
    if (!Object.values(D.datos.nips).some((n) => n.codigo && new Date(n.vence) > new Date())) {
      h += '<p class="detalle">Demo: primero envía un NIP desde una venta de afiliado en la bandeja de Validación; aquí se consulta con su folio.</p>';
    }
    p.contenido.innerHTML = C.marcar('ConsultarNip', h);
    const entrada = document.getElementById('folio');
    entrada.addEventListener('input', () => { folio = entrada.value; });
    document.getElementById('consulta').addEventListener('submit', function (ev) {
      ev.preventDefault();
      resultado = consultar();
      dibujar();
    });
  }
  dibujar();
})();
