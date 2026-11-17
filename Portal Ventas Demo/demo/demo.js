/* ============================================================
   DEMO DEL PORTAL (sin servidor)
   - Responde las peticiones que las páginas hacen al servidor
     (fetch y XMLHttpRequest/jQuery) con respuestas guardadas.
   - Los formularios no se envían y las acciones muestran un aviso.
   - Muestra una etiqueta "Demo" para cambiar de perfil.
   Todos los datos son ficticios.
   ============================================================ */
(function () {
  'use strict';

  const DATOS = window.DEMO || { ajax: {}, sucursales: {}, perfiles: {} };
  const scriptActual = document.currentScript;
  const RAIZ = new URL('../', scriptActual.src).href;   // carpeta de la demo
  window.DEMO_RAIZ = RAIZ;

  /* ---------- Respuestas simuladas ---------- */
  function clave(url) {
    const absoluta = new URL(url, location.href);
    let ruta = decodeURIComponent(absoluta.href.split('?')[0].split('#')[0]);
    const raiz = decodeURIComponent(RAIZ);
    if (ruta.startsWith(raiz)) ruta = ruta.slice(raiz.length);
    ruta = ruta.replace(/^roles\//i, '').toLowerCase();
    return { ruta: ruta, query: absoluta.search.replace(/^\?/, '').toLowerCase() };
  }

  function buscarRespuesta(url, cuerpo) {
    const { ruta, query } = clave(url);
    const nombre = ruta.split('/').pop();

    // Buscador de sucursales (formularios de captura)
    if (nombre === 'buscar_sucursal.php') {
      const numero = new URLSearchParams(typeof cuerpo === 'string' ? cuerpo : '').get('NumeroSucursal') || '';
      const sucursal = DATOS.sucursales[numero];
      const json = !sucursal ? { success: false, tipo: 'no_existe' }
        : sucursal[1] ? { success: true, nombre: sucursal[0] } : { success: false, tipo: 'deshabilitada' };
      return { tipo: 'json', cuerpo: JSON.stringify(json) };
    }

    const exacta = DATOS.ajax[query ? ruta + '?' + query : ruta] || DATOS.ajax[ruta];
    if (exacta) return exacta;

    // Misma página llamada desde otra carpeta (p. ej. password/obtener_password_vigente.php)
    const parecida = Object.keys(DATOS.ajax).find(function (k) { return k.split('?')[0].split('/').pop() === nombre; });
    if (parecida) return DATOS.ajax[parecida];

    return null;
  }

  function esDelPortal(url) {
    try {
      const absoluta = new URL(url, location.href);
      return absoluta.protocol === 'file:' || absoluta.origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  // fetch
  const fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (entrada, opciones) {
    const url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '';
    if (!esDelPortal(url) || !/\.php(\?|$)/i.test(url.split('#')[0])) {
      return fetchOriginal ? fetchOriginal(entrada, opciones) : Promise.reject(new Error('fetch no disponible'));
    }
    const respuesta = buscarRespuesta(url, opciones && opciones.body);
    if (!respuesta) {
      avisar('En la demo esta acción no se envía a ningún servidor.');
      return Promise.resolve(new Response(JSON.stringify({ success: false, ok: false, mensaje: 'Demo' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.resolve(new Response(respuesta.cuerpo, {
      status: 200,
      headers: { 'Content-Type': respuesta.tipo === 'json' ? 'application/json' : 'text/html; charset=utf-8' },
    }));
  };

  // XMLHttpRequest (lo usa jQuery)
  const XHROriginal = window.XMLHttpRequest;
  function XHRDemo() {
    const real = new XHROriginal();
    const falso = this;
    let simulado = false;
    let url = '';

    ['onload', 'onerror', 'onabort', 'onreadystatechange', 'ontimeout', 'onloadend'].forEach(function (evento) {
      falso[evento] = null;
    });
    falso.readyState = 0;
    falso.status = 0;
    falso.statusText = '';
    falso.responseText = '';
    falso.response = '';
    falso.responseType = '';
    falso.timeout = 0;
    falso.withCredentials = false;
    falso.upload = real.upload;

    falso.open = function (metodo, direccion) {
      url = direccion;
      simulado = esDelPortal(direccion) && /\.php(\?|$)/i.test(String(direccion).split('#')[0]);
      if (!simulado) {
        real.open.apply(real, arguments);
        ['onload', 'onerror', 'onabort', 'onreadystatechange', 'ontimeout', 'onloadend'].forEach(function (evento) {
          real[evento] = function (e) {
            ['readyState', 'status', 'statusText', 'responseText', 'response'].forEach(function (p) {
              try { falso[p] = real[p]; } catch (error) { /* propiedad no disponible */ }
            });
            if (falso[evento]) falso[evento](e);
          };
        });
      }
      falso.readyState = 1;
    };
    falso.setRequestHeader = function () { if (!simulado) real.setRequestHeader.apply(real, arguments); };
    falso.getAllResponseHeaders = function () {
      return simulado ? 'content-type: ' + (falso._tipo || 'text/html') + '\r\n' : real.getAllResponseHeaders();
    };
    falso.getResponseHeader = function (nombre) {
      return simulado ? (/content-type/i.test(nombre) ? falso._tipo : null) : real.getResponseHeader(nombre);
    };
    falso.overrideMimeType = function () {};
    falso.abort = function () { if (!simulado) real.abort(); };
    falso.addEventListener = function (evento, fn) { falso['on' + evento] = fn; };
    falso.send = function (cuerpo) {
      if (!simulado) { real.send(cuerpo); return; }
      const respuesta = buscarRespuesta(url, cuerpo);
      if (!respuesta) avisar('En la demo esta acción no se envía a ningún servidor.');
      setTimeout(function () {
        falso._tipo = respuesta && respuesta.tipo === 'json' ? 'application/json' : 'text/html';
        falso.status = 200;
        falso.statusText = 'OK';
        falso.responseText = falso.response = respuesta ? respuesta.cuerpo : JSON.stringify({ success: false, mensaje: 'Demo' });
        falso.readyState = 4;
        if (falso.onreadystatechange) falso.onreadystatechange();
        if (falso.onload) falso.onload();
        if (falso.onloadend) falso.onloadend();
      }, 120);
    };
  }
  XHRDemo.UNSENT = 0; XHRDemo.OPENED = 1; XHRDemo.HEADERS_RECEIVED = 2; XHRDemo.LOADING = 3; XHRDemo.DONE = 4;
  window.XMLHttpRequest = XHRDemo;

  /* ---------- Formularios y acciones ---------- */
  document.addEventListener('submit', function (evento) {
    const formulario = evento.target;
    if (!formulario || formulario.getAttribute('data-demo') !== '1') return;
    evento.preventDefault();
    const metodo = (formulario.getAttribute('method') || 'get').toLowerCase();
    avisar(metodo === 'post'
      ? 'Demo: los cambios no se guardan. En el portal real esta acción se guarda en la base de datos.'
      : 'Demo: la página muestra un ejemplo de resultados con datos ficticios.');
  }, true);

  document.addEventListener('click', function (evento) {
    const enlace = evento.target.closest && evento.target.closest('a[href$="#demo"]');
    if (!enlace) return;
    evento.preventDefault();
    avisar('Demo: esta función está disponible en el portal real (exportar, guardar o cambiar datos).');
  }, true);

  /* ---------- Aviso y etiqueta ---------- */
  let temporizador = null;
  function avisar(texto) {
    let aviso = document.getElementById('demoAviso');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'demoAviso';
      aviso.className = 'demo-aviso';
      aviso.setAttribute('role', 'status');
      (document.body || document.documentElement).appendChild(aviso);
    }
    aviso.textContent = texto;
    aviso.classList.add('visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { aviso.classList.remove('visible'); }, 3600);
  }
  window.demoAvisar = avisar;

  document.addEventListener('DOMContentLoaded', function () {
    const etiqueta = document.createElement('a');
    etiqueta.className = 'demo-etiqueta';
    etiqueta.href = RAIZ + 'index.html';
    etiqueta.title = 'Volver al inicio de sesión para elegir otro perfil';
    etiqueta.innerHTML = '<span class="demo-etiqueta__punto"></span><b>DEMO</b><span>Datos ficticios · Cambiar perfil</span>';
    document.body.appendChild(etiqueta);
  });
})();
