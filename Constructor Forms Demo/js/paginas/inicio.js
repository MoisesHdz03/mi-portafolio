/* Inicio (Home.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'inicio', titulo: 'Inicio' });
  if (!p) return;
  p.contenido.innerHTML =
    '<section class="tarjeta bienvenida"><h1>Hola, ' + C.e(p.usuario.usuario) + '</h1>' +
    '<p class="detalle"><span class="etiqueta">' + C.e(p.usuario.rol) + '</span> Usa el menú de la izquierda para ir a tus pantallas.</p></section>';
})();
