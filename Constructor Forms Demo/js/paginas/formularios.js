/* Formularios (Formularios.razor + ModalVersiones.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'formularios', titulo: 'Formularios', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const admin = p.usuario.rol === 'Administrador';
  let campanaId = '';

  function tabla() {
    const lista = D.datos.formularios.filter((f) => !campanaId || f.campanaId === Number(campanaId));
    if (!lista.length) return '<p>No hay formularios. Crea el primero con el botón "Nuevo formulario".</p>';
    return '<table class="tabla"><thead><tr><th>Formulario</th><th>Campaña</th><th>Alcance</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' +
      lista.map(function (f) {
        const campana = D.campana(f.campanaId);
        const publicada = f.versiones.find((v) => v.estado === 'Publicada');
        const borrador = f.versiones.find((v) => v.estado === 'Borrador');
        return '<tr><td>' + e(f.nombre) + '</td><td>' + e(campana.nombre) + '</td><td>' +
          e(f.subcampanas.length ? f.subcampanas.map((id) => campana.subcampanas.find((s) => s.id === id).nombre).join(', ') : 'Toda la campaña') + '</td><td>' +
          (publicada ? '<span class="etiqueta etiqueta-verde">Versión ' + publicada.numero + '</span>' : borrador ? '<span class="etiqueta etiqueta-gris">Sin publicar</span>' : '<span class="etiqueta etiqueta-gris">Retirado</span>') +
          (borrador ? ' <span class="etiqueta etiqueta-naranja">Borrador ' + borrador.numero + '</span>' : '') + '</td><td class="acciones">' +
          (admin ? '<a class="boton" href="constructor.html?formulario=' + f.id + '"><button type="button">Editar</button></a>' + (borrador ? '<button data-demo>Publicar</button>' : '') +
            (borrador && borrador.numero > 1 ? '<button data-demo>Descartar borrador</button>' : '') + (publicada ? '<button data-demo>Retirar</button>' : '') + '<button data-demo>Datos</button>'
            : '<a href="constructor.html?formulario=' + f.id + '"><button type="button">Ver</button></a>') +
          '<button data-historial="' + f.id + '">Historial</button></td></tr>';
      }).join('') + '</tbody></table>';
  }

  function historial(f) {
    const clase = { Publicada: 'etiqueta-verde', Borrador: 'etiqueta-naranja', Retirada: 'etiqueta-gris' };
    const cuerpo = '<ul class="versiones">' + f.versiones.slice().reverse().map(function (v) {
      const siguiente = f.versiones.find((x) => x.numero > v.numero && x.publicada);
      return '<li><div class="encabezado"><strong>Versión ' + v.numero + '</strong> <span class="etiqueta ' + clase[v.estado] + '">' + v.estado + '</span></div>' +
        '<small>Creada el ' + C.fechas.fechaHora(v.creada) + ' por ' + e(D.nombre(v.autor)) + '</small>' +
        (v.publicada ? '<small>Publicada el ' + C.fechas.fechaHora(v.publicada) + ' por ' + e(D.nombre(v.autor)) + '</small>' : '') +
        (v.estado === 'Retirada' && siguiente ? '<small>Retirada el ' + C.fechas.fechaHora(siguiente.publicada) + ' por ' + e(D.nombre(v.autor)) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
    C.modal({ componente: 'ModalVersiones', titulo: 'Versiones de ' + f.nombre, cuerpo, botones: [{ texto: 'Cerrar' }] });
  }

  const opcion = (v, t) => '<option value="' + v + '">' + e(t) + '</option>';
  p.contenido.innerHTML = C.marcar('Formularios', '<div class="encabezado-pagina"><h1>Formularios</h1>' + (admin ? '<button class="principal" data-demo>Nuevo formulario</button>' : '') + '</div>' +
    '<div class="filtros"><select id="campana">' + opcion('', 'Todas las campañas') + D.datos.campanas.map((c) => opcion(c.id, c.nombre)).join('') + '</select></div><div id="tabla">' + tabla() + '</div>');
  p.contenido.addEventListener('change', (ev) => { if (ev.target.id === 'campana') { campanaId = ev.target.value; document.getElementById('tabla').innerHTML = C.marcar('Formularios', tabla()); } });
  p.contenido.addEventListener('click', function (ev) {
    const h = ev.target.closest('[data-historial]');
    if (h) historial(D.formulario(Number(h.dataset.historial)));
    else if (ev.target.closest('[data-demo]')) C.soloConsulta();
  });
})();
