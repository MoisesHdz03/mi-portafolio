/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   MainLayout + MenuLateral: el mismo HTML y el mismo menú por rol.
   Cada página llama a Layout.iniciar({ ... }) y recibe el <main>.
   ============================================================ */
(function () {
  'use strict';

  const ENLACES = {
    inicio: ['inicio.html', 'inicio', 'Inicio'],
    campanas: ['campanas.html', 'campanas', 'Campañas'],
    usuarios: ['usuarios.html', 'usuarios', 'Usuarios'],
    bitacora: ['bitacora.html', 'bitacora', 'Bitácora'],
    formularios: ['formularios.html', 'formularios', 'Formularios'],
    catalogos: ['catalogos.html', 'catalogos', 'Catálogos'],
    supervision: ['supervision.html', 'supervision', 'Supervisión'],
    metas: ['metas.html', 'metas', 'Metas'],
    estadisticas: ['estadisticas.html', 'estadisticas', 'Estadísticas'],
    capturas: ['capturas.html', 'ventas', 'Capturas'],
    bandejas: ['bandejas.html', 'bandejas', 'Bandejas'],
    panel: ['panel-backoffice.html', 'panel', 'Panel BackOffice'],
    panelSolo: ['panel-backoffice.html', 'panel', 'Panel'],
    sinNip: ['contrasena-sin-nip.html', 'candado', 'Contraseña sin NIP'],
    miCampana: ['mi-campana.html', 'campanas', 'Mi campaña'],
    capturar: ['captura-inicio.html', 'capturar', 'Capturar'],
    miMeta: ['mi-meta.html', 'metas', 'Mi meta'],
    consultarNip: ['consultar-nip.html', 'buscar', 'Consultar NIP'],
    misAgentes: ['mis-agentes.html', 'usuarios', 'Mis agentes'],
  };

  const MENU = {
    Administrador: ['inicio', 'campanas', 'usuarios', 'bitacora', 'formularios', 'catalogos', 'supervision', 'metas', 'estadisticas', 'capturas', 'bandejas', 'panel', 'sinNip'],
    Gerente: ['inicio', 'campanas', 'usuarios', 'bitacora', 'formularios', 'catalogos', 'supervision', 'metas', 'estadisticas', 'capturas', 'bandejas', 'panel'],
    Coordinador: ['inicio', 'miCampana', 'supervision', 'metas', 'estadisticas', 'capturas'],
    Agente: ['inicio', 'capturar', 'miMeta'],
    Afiliado: ['inicio', 'capturar', 'miMeta'],
    BackOffice: ['inicio', 'bandejas'],
    'Supervisor BackOffice': ['inicio', 'panelSolo', 'consultarNip', 'bandejas'],
    Supervisor: ['inicio', 'supervision', 'misAgentes', 'metas'],
  };

  function usuarioActual() {
    const s = D.sesion();
    return s ? D.usuario(s.id) : null;
  }

  /*
   * o: { pagina (clave del menú activo), titulo, roles (permitidos) }
   * Devuelve { usuario, contenido (el <main>) } o null si redirige.
   */
  function iniciar(o) {
    const usuario = usuarioActual();
    if (!usuario) { location.replace('index.html'); return null; }
    if (o.roles && !o.roles.includes(usuario.rol)) { location.replace('inicio.html'); return null; }
    R.sembrarMetas();
    document.title = (o.titulo ? o.titulo + ' - ' : '') + 'Constructor Forms';

    const enlaces = MENU[usuario.rol].map(function (clave) {
      const [href, ic, texto] = ENLACES[clave];
      const activo = clave === o.pagina || (o.pagina === 'panel' && clave === 'panelSolo');
      return '<a href="' + href + '" title="' + C.e(texto) + '"' + (activo ? ' class="active" aria-current="page"' : '') + '>' + C.icono(ic) + '<span class="menu-texto">' + C.e(texto) + '</span></a>';
    }).join('');

    document.body.insertAdjacentHTML('afterbegin',
      '<div class="contenedor" data-rol="' + R.rolCss(usuario.rol) + '">' +
      '<input type="checkbox" id="menu-abierto" class="menu-interruptor" aria-hidden="true" tabindex="-1" />' +
      '<header class="barra-movil"><label for="menu-abierto" class="boton-menu" aria-label="Abrir o cerrar el menú">☰</label><span>Constructor Forms</span></header>' +
      '<nav class="menu-lateral" aria-label="Menú principal">' +
      '<div class="marca"><span class="marca-icono" aria-hidden="true">CF</span><span class="menu-texto">Constructor Forms<span class="rol-actual">' + C.e(usuario.rol) + '</span></span></div>' +
      '<div class="menu-controles">' +
      '<button type="button" data-accion="menu-iconos" title="Cambiar entre menú completo y solo iconos" aria-label="Cambiar entre menú completo y solo iconos"><span class="si-completo">' + C.icono('contraer') + '</span><span class="si-iconos">' + C.icono('expandir') + '</span></button>' +
      '<button type="button" data-accion="menu-ocultar" title="Ocultar el menú" aria-label="Ocultar el menú">' + C.icono('ocultar') + '</button></div>' +
      enlaces +
      '<div class="menu-pie"><span class="usuario-nombre">' + C.e(usuario.usuario) + '</span>' +
      '<button type="button" data-accion="tema" title="Cambiar entre automático, claro y oscuro">' + C.icono('tema') + '<span class="menu-texto">Tema: <span data-texto-tema>Automático</span></span></button>' +
      '<a href="#" title="Cambiar contraseña" data-demo-contrasena>' + C.icono('llave') + '<span class="menu-texto">Cambiar contraseña</span></a>' +
      '<form data-salir><button type="submit" class="salir" title="Cerrar sesión">' + C.icono('salir') + '<span class="menu-texto">Cerrar sesión</span></button></form>' +
      '</div></nav>' +
      '<button type="button" class="boton-mostrar-menu" data-accion="menu-mostrar" title="Mostrar el menú" aria-label="Mostrar el menú">' + C.icono('mostrar') + '</button>' +
      '<main class="contenido"></main></div>');

    document.querySelector('[data-salir]').addEventListener('submit', function (ev) {
      ev.preventDefault();
      D.cerrarSesion();
      location.href = 'index.html';
    });
    document.querySelector('[data-demo-contrasena]').addEventListener('click', function (ev) {
      ev.preventDefault();
      C.avisar('En la demo las contraseñas no se cambian. En el sistema, aquí se cambia la contraseña con la actual y la nueva.');
    });

    // Etiqueta de la demo
    document.body.insertAdjacentHTML('beforeend',
      '<div class="demo-etiqueta"><b>DEMO</b><span>' + C.e(usuario.nombre) + '</span>' +
      '<a href="index.html" data-cambiar-usuario>Cambiar de usuario</a><button type="button" data-restablecer>Restablecer datos</button></div>');
    document.querySelector('[data-cambiar-usuario]').addEventListener('click', () => D.cerrarSesion());
    document.querySelector('[data-restablecer]').addEventListener('click', function () {
      if (!confirm('¿Restablecer la demo? Se pierden las capturas, correcciones y cambios que hiciste.')) return;
      D.restablecer();
      C.avisarDespues('Se restablecieron los datos de la demo.');
      location.reload();
    });

    if (window.constructorTema) window.constructorTema.aplicar();
    C.mostrarAvisoPendiente();
    return { usuario, contenido: document.querySelector('main.contenido') };
  }

  window.Layout = { iniciar, usuarioActual, MENU };
})();
