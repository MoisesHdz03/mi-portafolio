/* ============================================================
   HSM WHATSAPP · DEMO
   Estructura común: sesión, menú lateral, avisos y utilidades.
   Cada página llama a App.iniciar('clave') y dibuja su contenido.
   ============================================================ */
(function () {
  'use strict';

  const MENU = [
    { clave: 'campaigns', url: 'campaigns.html', icono: 'bi-megaphone', texto: 'Campañas' },
    { clave: 'create_campaign', url: 'create_campaign.html', icono: 'bi-plus-square', texto: 'Nueva Campaña' },
    { clave: 'upload_csv', url: 'upload_csv.html', icono: 'bi-filetype-csv', texto: 'Subir CSV' },
    { clave: 'shipment_batches', url: 'shipment_batches.html', icono: 'bi-collection', texto: 'Grupos de envío' },
    { clave: 'shipments', url: 'shipments.html', icono: 'bi-send', texto: 'Envíos' },
    { clave: 'users', url: 'users.html', icono: 'bi-people', texto: 'Usuarios', soloFull: true },
  ];

  const ROLES = { full_admin: 'Administrador Full', admin: 'Administrador' };

  /* ---------- Utilidades ---------- */
  function e(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fecha(valor, conHora) {
    if (!valor) return '';
    const d = new Date(String(valor).replace(' ', 'T'));
    if (isNaN(d)) return e(valor);
    const p = (n) => String(n).padStart(2, '0');
    const dia = p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
    const hora = p(d.getHours()) + ':' + p(d.getMinutes());
    return conHora === false ? dia : '<span class="fecha">' + dia + '<small>' + hora + ' h</small></span>';
  }

  function param(nombre) {
    return new URLSearchParams(location.search).get(nombre);
  }

  const ESTADO_GRUPO = {
    PENDING: ['estado-ambar', 'Pendiente'],
    SENDING: ['estado-azul', 'Enviando'],
    COMPLETED: ['estado-verde', 'Completado'],
    PARTIAL: ['estado-ambar', 'Completado con errores'],
    FAILED: ['estado-rojo', 'Fallido'],
  };

  const ESTADO_ENVIO = {
    pending: ['estado-ambar', 'Pendiente'],
    sending: ['estado-azul', 'Enviando'],
    sent: ['estado-azul', 'Enviado'],
    delivered: ['estado-verde', 'Entregado'],
    read: ['estado-cian', 'Leído'],
    failed: ['estado-rojo', 'Error'],
  };

  function etiqueta(mapa, valor) {
    const [clase, texto] = mapa[valor] || ['estado-gris', valor];
    return '<span class="estado ' + clase + '">' + e(texto) + '</span>';
  }

  /* ---------- Avisos ---------- */
  let temporizador = null;
  function avisar(texto, tipo) {
    let aviso = document.getElementById('avisoFlotante');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'avisoFlotante';
      aviso.className = 'aviso-flotante';
      aviso.setAttribute('role', 'status');
      document.body.appendChild(aviso);
    }
    aviso.className = 'aviso-flotante' + (tipo === 'error' ? ' error' : '');
    aviso.innerHTML = '<i class="bi ' + (tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle') + '"></i><div>' + texto + '</div>';
    requestAnimationFrame(() => aviso.classList.add('visible'));
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('visible'), 4000);
  }

  // Aviso que se muestra al llegar a la siguiente página (después de guardar)
  function avisarDespues(texto, tipo) {
    try { sessionStorage.setItem('hsmdemo.aviso', JSON.stringify({ texto, tipo })); } catch (err) { /* nada */ }
  }

  /* ---------- Tabla con búsqueda y páginas ---------- */
  function tablaPaginada(opciones) {
    // opciones: { filas: [], dibujar(fila) -> '<tr>', cuerpo, buscador, filtro, conteo, paginacion, porPagina, coincide(fila, texto, filtro), columnas }
    let pagina = 1;
    const porPagina = opciones.porPagina || 25;

    function filtradas() {
      const texto = (opciones.buscador && opciones.buscador.value || '').trim().toLowerCase();
      const filtro = opciones.filtro ? opciones.filtro.value : '';
      return opciones.filas.filter((f) => opciones.coincide(f, texto, filtro));
    }

    function dibujar() {
      const lista = filtradas();
      const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
      pagina = Math.min(pagina, paginas);
      const desde = (pagina - 1) * porPagina;
      const visibles = lista.slice(desde, desde + porPagina);

      opciones.cuerpo.innerHTML = visibles.length
        ? visibles.map(opciones.dibujar).join('')
        : '<tr><td colspan="' + opciones.columnas + '" class="tabla-vacia"><i class="bi bi-search"></i>' + e(opciones.vacio || 'No hay registros que coincidan.') + '</td></tr>';

      if (opciones.conteo) {
        opciones.conteo.textContent = lista.length.toLocaleString('es-MX') + ' ' + (lista.length === 1 ? 'registro' : 'registros');
      }

      if (opciones.paginacion) {
        if (paginas <= 1) {
          opciones.paginacion.hidden = true;
        } else {
          opciones.paginacion.hidden = false;
          opciones.paginacion.innerHTML =
            '<span>Mostrando ' + (desde + 1) + '–' + (desde + visibles.length) + ' de ' + lista.length.toLocaleString('es-MX') + '</span>' +
            '<div class="btn-group">' +
            '<button class="btn btn-light btn-sm" data-pag="' + (pagina - 1) + '"' + (pagina === 1 ? ' disabled' : '') + ' aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>' +
            '<button class="btn btn-light btn-sm" disabled>' + pagina + ' / ' + paginas + '</button>' +
            '<button class="btn btn-light btn-sm" data-pag="' + (pagina + 1) + '"' + (pagina === paginas ? ' disabled' : '') + ' aria-label="Siguiente"><i class="bi bi-chevron-right"></i></button>' +
            '</div>';
        }
      }
    }

    if (opciones.buscador) opciones.buscador.addEventListener('input', () => { pagina = 1; dibujar(); });
    if (opciones.filtro) opciones.filtro.addEventListener('change', () => { pagina = 1; dibujar(); });
    if (opciones.paginacion) {
      opciones.paginacion.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-pag]');
        if (!b || b.disabled) return;
        pagina = Number(b.dataset.pag);
        dibujar();
      });
    }
    dibujar();
    return { redibujar: (filas) => { if (filas) opciones.filas = filas; dibujar(); } };
  }

  /* ---------- Página ---------- */
  function iniciar(clave, opciones) {
    opciones = opciones || {};
    const sesion = HSM.sesion();
    if (!sesion) {
      location.replace('index.html');
      return null;
    }
    if (opciones.soloFull && sesion.role !== 'full_admin') {
      document.body.innerHTML = '<div style="padding:40px;font-family:Arial">Acceso denegado</div>';
      return null;
    }

    // Menú lateral
    const iniciales = sesion.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const enlaces = MENU
      .filter((m) => !m.soloFull || sesion.role === 'full_admin')
      .map((m) => '<li><a href="' + m.url + '" class="' + (m.clave === clave ? 'activo' : '') + '"' + (m.clave === clave ? ' aria-current="page"' : '') + '>' +
        '<i class="bi ' + m.icono + '"></i>' + e(m.texto) + '</a></li>')
      .join('');

    const menu = document.createElement('nav');
    menu.className = 'sidebar';
    menu.id = 'sidebar';
    menu.setAttribute('aria-label', 'Menú principal');
    menu.innerHTML =
      '<div class="sidebar-title"><span class="sidebar-logo"><i class="bi bi-whatsapp"></i></span><div>WhatsApp HSM<small>Envío masivo</small></div></div>' +
      '<ul class="sidebar-menu">' + enlaces +
      '<li><a href="index.html" data-salir><i class="bi bi-box-arrow-left"></i>Cerrar Sesión</a></li></ul>' +
      '<div class="sidebar-usuario"><span class="sidebar-avatar">' + e(iniciales) + '</span>' +
      '<div class="sidebar-usuario-texto"><strong>' + e(sesion.name) + '</strong><span>' + e(ROLES[sesion.role] || sesion.role) + '</span></div></div>';
    document.body.prepend(menu);

    menu.querySelector('[data-salir]').addEventListener('click', () => HSM.cerrarSesion());

    // Barra para pantallas chicas
    const contenido = document.querySelector('.main-content');
    const barra = document.createElement('div');
    barra.className = 'barra-movil';
    barra.innerHTML = '<button type="button" aria-label="Abrir menú"><i class="bi bi-list"></i></button><span>WhatsApp HSM</span>';
    contenido.prepend(barra);
    barra.querySelector('button').addEventListener('click', (ev) => { ev.stopPropagation(); menu.classList.toggle('abierto'); });
    document.addEventListener('click', (ev) => {
      if (menu.classList.contains('abierto') && !menu.contains(ev.target)) menu.classList.remove('abierto');
    });

    // Etiqueta de demo
    const demo = document.createElement('div');
    demo.className = 'demo-etiqueta';
    demo.innerHTML = '<b>DEMO</b><span>Datos ficticios</span>·<button type="button">Restablecer datos</button>';
    document.body.appendChild(demo);
    demo.querySelector('button').addEventListener('click', () => {
      if (!confirm('¿Restablecer la demo? Se perderán los cambios que hiciste (grupos, envíos y usuarios).')) return;
      HSM.restablecer();
      avisarDespues('Se restablecieron los datos de la demo.');
      location.href = 'campaigns.html';
    });

    // Aviso pendiente de la página anterior
    try {
      const pendiente = JSON.parse(sessionStorage.getItem('hsmdemo.aviso') || 'null');
      if (pendiente) {
        sessionStorage.removeItem('hsmdemo.aviso');
        setTimeout(() => avisar(pendiente.texto, pendiente.tipo), 150);
      }
    } catch (err) { /* nada */ }

    return sesion;
  }

  window.App = { iniciar, avisar, avisarDespues, e, fecha, param, etiqueta, ESTADO_GRUPO, ESTADO_ENVIO, ROLES, tablaPaginada };
})();
