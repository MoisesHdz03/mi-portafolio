/* Catálogos (Catalogos.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'catalogos', titulo: 'Catálogos', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const admin = p.usuario.rol === 'Administrador';
  let campanaId = '';

  function tabla() {
    const lista = D.datos.catalogos.filter((c) => !campanaId || c.campanaId === Number(campanaId));
    if (!lista.length) return '<p>No hay catálogos. Crea el primero con el botón "Nuevo catálogo".</p>';
    return '<table class="tabla"><thead><tr><th>Catálogo</th><th>Campaña</th><th class="numero">Columnas</th><th class="numero">Registros activos</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' +
      lista.map(function (c) {
        const activo = c.activo !== false;
        return '<tr><td><a href="detalle-catalogo.html?id=' + c.id + '">' + e(c.nombre) + '</a></td><td>' + e(D.campana(c.campanaId).nombre) + '</td>' +
          '<td class="numero">' + c.columnas.length + '</td><td class="numero">' + C.numero(c.registros.filter((r) => r.activo).length) + '</td>' +
          '<td><span class="etiqueta ' + (activo ? 'etiqueta-verde' : 'etiqueta-gris') + '">' + (activo ? 'Activo' : 'Desactivado') + '</span></td>' +
          '<td class="acciones"><a href="detalle-catalogo.html?id=' + c.id + '"><button type="button">Abrir</button></a>' + (admin ? '<button data-demo>' + (activo ? 'Desactivar' : 'Activar') + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  const opcion = (v, t) => '<option value="' + v + '">' + e(t) + '</option>';
  p.contenido.innerHTML = C.marcar('Catalogos', '<div class="encabezado-pagina"><h1>Catálogos</h1>' + (admin ? '<button class="principal" data-demo>Nuevo catálogo</button>' : '') + '</div>' +
    '<div class="filtros"><select id="campana">' + opcion('', 'Todas las campañas') + D.datos.campanas.map((c) => opcion(c.id, c.nombre)).join('') + '</select></div><div id="tabla">' + tabla() + '</div>');
  p.contenido.addEventListener('change', (ev) => { if (ev.target.id === 'campana') { campanaId = ev.target.value; document.getElementById('tabla').innerHTML = C.marcar('Catalogos', tabla()); } });
  p.contenido.addEventListener('click', (ev) => { if (ev.target.closest('[data-demo]')) C.soloConsulta(); });
})();
