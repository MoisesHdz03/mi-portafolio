/* Campañas (Campanas.razor) — en la demo es de consulta */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'campanas', titulo: 'Campañas', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const admin = p.usuario.rol === 'Administrador';
  const b = (texto, attrs) => admin ? '<button data-demo' + (attrs || '') + '>' + texto + '</button>' : '';

  let h = '<h1>Campañas</h1>';
  if (admin) h += '<div class="formulario-linea"><input placeholder="Nombre de la nueva campaña" maxlength="100" /><button data-demo>Agregar campaña</button></div>';
  D.datos.campanas.forEach(function (c) {
    const tieneFolios = c.consecutivo > 0;
    h += '<section class="campana' + (c.activa ? '' : ' inactiva') + '"><div class="encabezado"><h2>' + e(c.nombre) + '</h2>' +
      (c.activa ? '' : '<span class="etiqueta">Desactivada</span>') +
      (c.prefijo ? '<span class="folio">Folio: ' + e(c.prefijo) + '-000001</span>' : '<span class="etiqueta etiqueta-aviso" title="Los agentes no podrán enviar capturas hasta que la campaña tenga prefijo.">Sin prefijo de folio</span>') +
      b('Prefijo', tieneFolios ? ' disabled title="La campaña ya tiene capturas con folio; el prefijo no se puede cambiar."' : '') +
      '<span class="folio" title="Día en que empieza cada periodo de metas">Corte: ' + (c.corte === 1 ? 'mes de calendario' : 'día ' + c.corte) + '</span>' + b('Corte') +
      (c.usaBackOffice ? '<span class="etiqueta etiqueta-backoffice" title="Puede tener usuarios Afiliado y BackOffice, bandejas y NIP">BackOffice con NIP</span>' : '') +
      b(c.usaBackOffice ? 'Quitar BackOffice' : 'Usar BackOffice') + b('Descripción') + b('Renombrar') + b(c.activa ? 'Desactivar' : 'Activar') + '</div>' +
      (c.descripcion ? '<p class="descripcion">' + e(c.descripcion) + '</p>' : '<p class="descripcion sin-descripcion">Sin descripción.</p>') +
      '<ul class="subcampanas">' + c.subcampanas.map((s) => '<li' + (s.activa ? '' : ' class="inactiva"') + '><span class="nombre">' + e(s.nombre) + '</span>' +
        (s.activa ? '' : '<span class="etiqueta">Desactivada</span>') + b('Renombrar') + b(s.activa ? 'Desactivar' : 'Activar') + '</li>').join('') +
      '<li>' + (c.activa ? b('+ Agregar subcampaña') : '') + '</li></ul></section>';
  });
  p.contenido.innerHTML = C.marcar('Campanas', h);
  p.contenido.addEventListener('click', (ev) => { if (ev.target.closest('[data-demo]')) C.soloConsulta(); });
})();
