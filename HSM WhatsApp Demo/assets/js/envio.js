/* ============================================================
   HSM WHATSAPP · DEMO
   Simulación del envío de un grupo (send_pending_messages.php)
   y de los estados que Twilio reporta por webhook
   (enviado → entregado → leído, o error) y las respuestas.
   ============================================================ */
(function () {
  'use strict';

  const PROB_ERROR = 0.05;
  const PROB_LEIDO = 0.68;
  const PROB_RESPUESTA = 0.4;

  function elegir(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function marcarEnviado(envio) {
    const ahora = HSM.fechaSql(new Date());
    envio.twilio_sid = HSM.sid('MM');
    if (Math.random() < PROB_ERROR) {
      envio.status = 'failed';
      envio.failed_at = ahora;
      envio.response_message = elegir(HSM.errores);
    } else {
      envio.status = 'sent';
      envio.sent_at = ahora;
    }
  }

  function marcarEntregado(envio) {
    if (envio.status !== 'sent') return;
    if (Math.random() < 0.95) {
      envio.status = 'delivered';
      envio.delivered_at = HSM.fechaSql(new Date());
    }
  }

  function marcarLeido(envio) {
    if (envio.status !== 'delivered' || Math.random() > PROB_LEIDO) return;
    envio.status = 'read';
    envio.read_at = HSM.fechaSql(new Date());

    if (Math.random() < PROB_RESPUESTA) {
      const datos = HSM.datos();
      const campana = HSM.campana(envio.campaign_id);
      const cliente = HSM.cliente(envio.client_id);
      const botones = (campana.actions || []).filter((a) => a.type === 'QUICK_REPLY');
      const esBoton = botones.length > 0 && Math.random() < 0.8;
      const boton = esBoton ? elegir(botones).title : null;
      datos.respuestas.push({
        id: datos.siguiente.respuesta++, shipment_id: envio.id, message_sid: HSM.sid('SM'), original_message_sid: envio.twilio_sid,
        response_type: esBoton ? 'button' : 'text', response_text: esBoton ? boton : elegir(HSM.respuestasTexto),
        button_text: boton, button_payload: boton ? boton.toUpperCase().replace(/[^A-Z]+/g, '_') : null,
        from_number: 'whatsapp:+52' + cliente.phone, profile_name: cliente.name.split(' ')[0], created_at: HSM.fechaSql(new Date()),
      });
    }
  }

  function cerrarGrupo(grupo) {
    const envios = HSM.enviosDeGrupo(grupo.id);
    const fallidos = envios.filter((x) => x.status === 'failed').length;
    grupo.status = fallidos === 0 ? 'COMPLETED' : fallidos === envios.length ? 'FAILED' : 'PARTIAL';
    grupo.completed_at = HSM.fechaSql(new Date());
  }

  /* Termina de inmediato un envío que quedó a medias (p. ej. si se cerró la página) */
  function completarSinAnimacion(grupo) {
    if (grupo.status !== 'SENDING') return;
    const envios = HSM.enviosDeGrupo(grupo.id);
    envios.forEach((x) => { if (x.status === 'pending' || x.status === 'sending') marcarEnviado(x); });
    envios.forEach(marcarEntregado);
    envios.forEach(marcarLeido);
    cerrarGrupo(grupo);
    HSM.guardar();
  }

  /*
   * Envío animado. alAvanzar(fase, hechos, total) se llama en cada paso
   * para que la página actualice tarjetas, barra y tabla.
   */
  function enviarGrupo(grupo, alAvanzar, alTerminar) {
    const envios = HSM.enviosDeGrupo(grupo.id).filter((x) => x.status === 'pending');
    grupo.status = 'SENDING';
    grupo.started_at = HSM.fechaSql(new Date());
    envios.forEach((x) => { x.status = 'sending'; });
    HSM.guardar();

    const total = envios.length;
    const duracion = Math.min(Math.max(total * 45, 1800), 6000);
    const porPaso = Math.max(1, Math.ceil(total / (duracion / 90)));
    let hechos = 0;
    alAvanzar('enviando', 0, total);

    const intervalo = setInterval(function () {
      envios.slice(hechos, hechos + porPaso).forEach(marcarEnviado);
      hechos = Math.min(total, hechos + porPaso);
      alAvanzar('enviando', hechos, total);

      if (hechos >= total) {
        clearInterval(intervalo);
        HSM.guardar();
        // Webhook: entregados y leídos llegan después
        setTimeout(function () {
          envios.forEach(marcarEntregado);
          HSM.guardar();
          alAvanzar('entregando', total, total);
          setTimeout(function () {
            envios.forEach(marcarLeido);
            cerrarGrupo(grupo);
            HSM.guardar();
            alAvanzar('terminado', total, total);
            if (alTerminar) alTerminar();
          }, 1600);
        }, 1200);
      }
    }, 90);
  }

  window.Envio = { enviarGrupo, completarSinAnimacion };
})();
