/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   Base: marcado por componente, utilidades, avisos y modales.

   El CSS de los componentes (css/componentes.css) es el mismo que
   compila Blazor: cada regla lleva el identificador del componente
   (b-xxxxxxxxxx). Para que aplique igual, el HTML de cada componente
   se marca con ese identificador (C.marcar).
   ============================================================ */
(function () {
  'use strict';

  const COMPONENTES = {
    Avisos: 'b-d6mmhtfbn1', DescripcionCampana: 'b-zouuvjib0c', Modal: 'b-ongwv0a12d', Reparto: 'b-2ekpuaxwpj',
    EditorFormula: 'b-5j8tn964xl', Lienzo: 'b-j5s1gi8jav', PropiedadesCampo: 'b-8p2c1swemy', PropiedadesSeccion: 'b-lpu0ttsekm',
    GraficaMotivos: 'b-2spfsu5mvi', GraficaPorDia: 'b-5tbyn6uh4i', RankingDomiciliacion: 'b-zhamiy8cj5', RankingPanel: 'b-u6kwkha2to',
    CampoArchivo: 'b-wo3w16ovrl', CampoFormulario: 'b-gdlhlokgm3', GrupoCampos: 'b-3d3hgn5ofi', RenderizadorFormulario: 'b-6z5m1jekw5',
    LayoutCuenta: 'b-kechgas4cm', MainLayout: 'b-8dvyflfuj7', Bitacora: 'b-bo77ui4c3c', Campanas: 'b-xtxslz9ubn',
    Catalogos: 'b-pdl9f9qezp', Constructor: 'b-k60185c6l1', ContrasenaSinNip: 'b-878s3nauun', DetalleCatalogo: 'b-poi8ht5txp',
    Formularios: 'b-27345lpjaw', FormularioUsuario: 'b-qai0be7gle', ModalContrasenaTemporal: 'b-wdguboheuo',
    ModalDatosFormulario: 'b-pxvdkm8cbn', ModalDesactivar: 'b-ra6g8dobqv', ModalErroresFormulario: 'b-6ew3ig2qqn',
    ModalVersiones: 'b-21wycy7wnb', NuevoCatalogo: 'b-oj7n1nc9bq', Usuario: 'b-pkvj1onjyn', Captura: 'b-tnwnzl7brz',
    DetalleCaptura: 'b-9u64k6hyrr', InicioCaptura: 'b-46yalbff01', MiMeta: 'b-s1yc7jp4gp', Bandejas: 'b-u9hb733yit',
    ConsultarNip: 'b-ts8er5ix0q', PanelBackOffice: 'b-n1o4zusdrw', VentaBackOffice: 'b-kkaii1y4vk', MiCampana: 'b-q7ja7qiime',
    Login: 'b-932ojerh16', PanelEstadisticas: 'b-vzkti0vvbk', Ventas: 'b-ljcq3vdqbo', Metas: 'b-0qcag0nicf',
    CapturaSupervision: 'b-1w6p650e7m', MisAgentes: 'b-pdecvwq8yn', ModalEditarAgente: 'b-ii92fiabgm',
    PanelSupervision: 'b-6dd88e25i6', Barra: 'b-wytc2tmh2o', EstadoVenta: 'b-inzddjkcmd',
    HistorialCorrecciones: 'b-euxjb8h5k3', TableroEquipo: 'b-p3l5lu1l6e',
  };

  /*
   * Marca con el identificador del componente cada etiqueta de apertura del HTML.
   * Los componentes hijos se pasan ya marcados dentro de {{hijo:n}} para no
   * marcarlos dos veces (Blazor tampoco marca el HTML de los hijos).
   */
  function marcar(componente, html, hijos) {
    const id = COMPONENTES[componente];
    let marcado = id ? html.replace(/<([a-zA-Z][a-zA-Z0-9-]*)(?=[\s>/])/g, '<$1 ' + id) : html;
    (hijos || []).forEach(function (hijo, i) {
      marcado = marcado.split('{{hijo:' + i + '}}').join(hijo);
    });
    return marcado;
  }

  function e(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function param(nombre) {
    return new URLSearchParams(location.search).get(nombre);
  }

  /* ---------- Fechas en hora de la Ciudad de México ---------- */
  const ZONA = 'America/Mexico_City';
  const fmtFecha = new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtHora = new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' });
  const fmtLargo = new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' });
  const fmtCorto = new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, day: 'numeric', month: 'short' });

  const fechas = {
    /** "AAAA-MM-DD" del día en hora de México. */
    dia: (d) => fmtDia.format(d instanceof Date ? d : new Date(d)),
    hoy: () => fmtDia.format(new Date()),
    corta: (d) => fmtFecha.format(d instanceof Date ? d : new Date(d)),
    hora: (d) => fmtHora.format(d instanceof Date ? d : new Date(d)),
    fechaHora: (d) => fmtFecha.format(new Date(d)) + ' ' + fmtHora.format(new Date(d)),
    larga: (d) => { const t = fmtLargo.format(new Date(d)); return t.charAt(0).toUpperCase() + t.slice(1); },
    diaMes: (diaIso) => fmtCorto.format(new Date(diaIso + 'T12:00:00-06:00')),
    sumarDias: (diaIso, n) => { const d = new Date(diaIso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); },
    diasEntre: (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000),
  };

  const numero = (n, dec) => Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  const moneda = (n) => '$' + numero(n, 2);

  /* ---------- Íconos (los mismos trazos de IconoMenu.razor) ---------- */
  const TRAZOS = {
    inicio: '<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
    campanas: '<path d="M4 10v4h3l11 5V5L7 10H4zM8 14v5h3v-3.6"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-3-1.7-5-4-5.7"/>',
    bitacora: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2.5h6v3H9zM9 11h6M9 15h6"/>',
    formularios: '<path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7"/>',
    catalogos: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
    supervision: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    metas: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    estadisticas: '<path d="M3 20h18M6 20V11M12 20V4M18 20v-7"/>',
    ventas: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    bandejas: '<path d="M3 13l3-9h12l3 9v7H3zM3 13h5l2 3h4l2-3h5"/>',
    panel: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    capturar: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
    llave: '<circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5L20 3M16 7l3 3"/>',
    salir: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    tema: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z"/>',
    contraer: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>',
    expandir: '<path d="M13 6l6 6-6 6M5 6l6 6-6 6"/>',
    ocultar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M16 9l-3 3 3 3"/>',
    mostrar: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  const icono = (nombre) => '<svg class="menu-icono" viewBox="0 0 24 24" aria-hidden="true">' + (TRAZOS[nombre] || '') + '</svg>';

  /* ---------- Avisos (Avisos.razor) ---------- */
  function avisar(texto, tipo) {
    let caja = document.getElementById('avisos-demo');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'avisos-demo';
      document.body.appendChild(caja);
    }
    const exito = tipo !== 'error';
    const aviso = document.createElement('div');
    aviso.innerHTML = marcar('Avisos',
      '<div class="aviso ' + (exito ? 'aviso-exito' : 'aviso-error') + '" role="status"><span class="aviso-icono" aria-hidden="true">' + (exito ? '✓' : '!') + '</span>' +
      '<span class="aviso-mensaje">' + texto + '</span><button type="button" class="aviso-cerrar" aria-label="Cerrar">×</button></div>');
    if (!caja.firstElementChild) caja.innerHTML = marcar('Avisos', '<div class="avisos"></div>');
    const lista = caja.firstElementChild;
    const nodo = aviso.firstElementChild;
    lista.appendChild(nodo);
    const quitar = () => nodo.remove();
    nodo.querySelector('.aviso-cerrar').addEventListener('click', quitar);
    setTimeout(quitar, 4500);
  }

  // Aviso que se muestra al llegar a la siguiente página
  function avisarDespues(texto, tipo) {
    try { sessionStorage.setItem('constructor-demo-aviso', JSON.stringify({ texto, tipo })); } catch (err) { /* nada */ }
  }
  function mostrarAvisoPendiente() {
    try {
      const a = JSON.parse(sessionStorage.getItem('constructor-demo-aviso') || 'null');
      if (a) { sessionStorage.removeItem('constructor-demo-aviso'); setTimeout(() => avisar(a.texto, a.tipo), 120); }
    } catch (err) { /* nada */ }
  }

  /* ---------- Modal (Modal.razor) ---------- */
  /*
   * Igual que Modal.razor: el fondo y la caja son del componente Modal; lo de
   * adentro (título, texto y .botones) es de la página que lo abre (opciones.componente).
   */
  function modal(opciones) {
    // opciones: { componente, titulo, cuerpo (html), botones: [{texto, clase, accion(cerrar, capa)}] }
    const capa = document.createElement('div');
    const botones = (opciones.botones || [{ texto: 'Cerrar', clase: '' }]);
    const contenido = marcar(opciones.componente || '',
      '<h2 id="titulo-modal-demo">' + e(opciones.titulo) + '</h2>' + (opciones.cuerpo || '') +
      '<div class="botones">' + botones.map((b, i) => '<button type="button" class="' + (b.clase || '') + '" data-boton="' + i + '">' + e(b.texto) + '</button>').join('') + '</div>',
      opciones.hijos);
    capa.innerHTML = marcar('Modal',
      '<div class="fondo-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-demo">{{hijo:0}}</div></div>', [contenido]);
    document.body.appendChild(capa);
    const cerrar = () => capa.remove();
    capa.querySelector('.fondo-modal').addEventListener('click', (ev) => { if (ev.target === ev.currentTarget) cerrar(); });
    document.addEventListener('keydown', function esc(ev) { if (ev.key === 'Escape') { cerrar(); document.removeEventListener('keydown', esc); } });
    capa.querySelectorAll('[data-boton]').forEach((b) => b.addEventListener('click', () => {
      const def = botones[Number(b.dataset.boton)];
      if (def.accion) { if (def.accion(cerrar, capa) !== false) cerrar(); } else cerrar();
    }));
    if (opciones.alAbrir) opciones.alAbrir(capa, cerrar);
    const primero = capa.querySelector('input, select, textarea');
    if (primero) primero.focus();
    return { capa, cerrar };
  }

  /* ---------- Descarga de archivos (en lugar de los Excel del servidor) ---------- */
  function descargarCsv(nombre, filas) {
    const csv = '﻿' + filas.map((f) => f.map((v) => {
      v = v == null ? '' : String(v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* Botones de administración que en la demo solo se muestran (las pantallas de administración son de consulta) */
  function soloConsulta() {
    avisar('En la demo esta pantalla es de consulta: los cambios de administración se hacen en la app real.', 'error');
  }

  window.C = { marcar, e, param, fechas, numero, moneda, icono, avisar, avisarDespues, mostrarAvisoPendiente, modal, descargarCsv, soloConsulta };
})();
