/* Contraseña sin NIP (ContrasenaSinNip.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'sinNip', titulo: 'Contraseña sin NIP', roles: ['Administrador'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const visibles = {};
  let copiada = null;
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Vence al terminar el domingo de la semana en que se generó (hora de la Ciudad de México)
  function vence(generada) {
    const dia = C.fechas.dia(generada);
    const [y, m, d] = dia.split('-').map(Number);
    const semana = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return C.fechas.sumarDias(dia, semana === 0 ? 0 : 7 - semana);
  }
  const vigente = (x) => x && x.contrasena && C.fechas.hoy() <= vence(x.generada);

  function generar() {
    const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ', min = 'abcdefghijkmnpqrstuvwxyz', dig = '23456789';
    const todos = may + min + dig;
    const al = (s) => s[Math.floor(Math.random() * s.length)];
    const c = [al(may), al(min), al(dig)];
    while (c.length < 10) c.push(al(todos));
    return c.sort(() => Math.random() - 0.5).join('');
  }

  function dibujar() {
    const campanas = D.datos.campanas.filter((c) => c.activa && c.usaBackOffice);
    let h = '<h1>Contraseña sin NIP</h1><p class="detalle">Con esta contraseña, el Supervisor BackOffice aprueba las ventas de afiliado a las que no se les puede enviar el NIP. Hay una por campaña, vence el domingo a las 23:59 sin importar el día en que se genere, y generar otra anula la anterior.</p>';
    if (!campanas.length) h += '<p>No hay campañas activas que usen BackOffice.</p>';
    else {
      h += '<div class="contenedor-tabla"><table class="tabla"><thead><tr><th>Campaña</th><th>Estado</th><th>Contraseña</th><th></th></tr></thead><tbody>' +
        campanas.map(function (c) {
          const x = D.datos.contrasenaSinNip[c.id];
          const v = vigente(x);
          let estado = '<span>Sin contraseña vigente</span>';
          if (v) {
            const fin = vence(x.generada);
            const [yy, mm, dd] = fin.split('-').map(Number);
            estado = '<span>Vigente hasta el ' + DIAS[new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay()] + ' ' + dd + ' de ' + R.MESES[mm - 1] + ' a las 23:59</span>' +
              '<span class="detalle bloque">Generada por ' + e(D.nombre(x.generadaPor)) + ' el ' + C.fechas.fechaHora(x.generada) + '</span>';
          }
          return '<tr><td>' + e(c.nombre) + '</td><td>' + estado + '</td><td>' + (visibles[c.id] ? '<code class="contrasena">' + e(visibles[c.id]) + '</code>' : v ? '<span class="detalle">Oculta</span>' : '<span class="detalle">—</span>') + '</td>' +
            '<td class="acciones">' + (visibles[c.id] ? '<button type="button" data-copiar="' + c.id + '">' + (copiada === c.id ? '¡Copiada!' : 'Copiar') + '</button>' : v ? '<button type="button" class="secundario" data-ver="' + c.id + '">Mostrar</button>' : '') +
            '<button type="button" class="' + (v ? 'secundario' : 'principal') + '" data-generar="' + c.id + '">' + (v ? 'Generar otra' : 'Generar') + '</button></td></tr>';
        }).join('') + '</tbody></table></div><p class="detalle">Mostrarla o generarla queda registrado en la bitácora, nunca con la contraseña.</p>';
    }
    p.contenido.innerHTML = C.marcar('ContrasenaSinNip', h);
  }

  p.contenido.addEventListener('click', function (ev) {
    const ver = ev.target.closest('[data-ver]');
    const gen = ev.target.closest('[data-generar]');
    const cop = ev.target.closest('[data-copiar]');
    if (ver) {
      const c = D.campana(Number(ver.dataset.ver));
      visibles[c.id] = D.datos.contrasenaSinNip[c.id].contrasena;
      D.registrar(yo.id, 'Ver contraseña sin NIP', 'Campaña', c.nombre, []);
      D.guardar();
      C.avisar('Contraseña lista para copiar.');
      dibujar();
    } else if (gen) {
      const c = D.campana(Number(gen.dataset.generar));
      if (vigente(D.datos.contrasenaSinNip[c.id]) && !confirm('La contraseña actual de ' + c.nombre + ' dejará de servir de inmediato. ¿Generar otra?')) return;
      const nueva = generar();
      D.datos.contrasenaSinNip[c.id] = { contrasena: nueva, generada: new Date().toISOString(), generadaPor: yo.id };
      visibles[c.id] = nueva;
      D.registrar(yo.id, 'Generar contraseña sin NIP', 'Campaña', c.nombre, []);
      D.guardar();
      C.avisar('Contraseña generada. Cópiala y pásasela al Supervisor BackOffice.');
      dibujar();
    } else if (cop) {
      const id = Number(cop.dataset.copiar);
      navigator.clipboard.writeText(visibles[id]).then(() => { copiada = id; dibujar(); setTimeout(() => { copiada = null; dibujar(); }, 2000); },
        () => C.avisar('No se pudo copiar automáticamente. Selecciona la contraseña y cópiala a mano.', 'error'));
    }
  });
  dibujar();
})();
