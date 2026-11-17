/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   Dibuja un formulario con el mismo HTML que los componentes
   RenderizadorFormulario, GrupoCampos, CampoFormulario y CampoArchivo,
   y lo mantiene al día mientras se escribe (condiciones y fórmulas).
   ============================================================ */
(function () {
  'use strict';
  const e = C.e;

  function texto(n, decimales) {
    return Number(n).toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  }

  /* ---------- CampoArchivo ---------- */
  function campoArchivo(c, valor, id, soloLectura) {
    const archivos = valor || [];
    let h = '<div class="archivos">';
    if (!archivos.length && soloLectura) h += '<span class="sin-archivos">Sin archivos</span>';
    archivos.forEach(function (a, i) {
      h += '<div class="archivo"><span class="icono" aria-hidden="true">' + (/\.pdf$/i.test(a.nombre) ? 'PDF' : 'IMG') + '</span>' +
        '<a href="#" data-ver-archivo title="Abrir en otra pestaña">' + e(a.nombre) + '</a><span class="tamano">' + Math.max(1, Math.round(a.tamano / 1024)) + ' KB</span>' +
        (soloLectura ? '' : '<button type="button" class="quitar" title="Quitar" aria-label="Quitar archivo" data-quitar-archivo="' + i + '">✕</button>') + '</div>';
    });
    if (!soloLectura && archivos.length < 2) {
      h += '<label class="boton-archivo">' + (archivos.length ? 'Agregar otro' : 'Adjuntar archivo') +
        '<input type="file" id="' + id + '" accept=".pdf,.jpg,.jpeg,.png" data-archivo /></label>' +
        '<small class="ayuda">PDF o imagen (JPG o PNG) de hasta 10 MB; máximo 2 archivos.</small>';
    }
    return C.marcar('CampoArchivo', h + '</div>');
  }

  /* ---------- CampoFormulario ---------- */
  function campoFormulario(c, ctx) {
    const { grupo, estado, error, idBase, soloLectura, catalogos, calculados, datosCatalogo } = ctx;
    const id = idBase + '-' + c.clave;
    const valor = grupo[c.clave];
    const v = valor == null ? '' : valor;
    const dis = soloLectura ? ' disabled' : '';
    const st = estado || { obligatorio: false };
    let h = '<div class="campo' + (error ? ' con-error' : '') + '">';
    let hijo = null;
    if (c.tipo !== 'Informativo') {
      h += '<label for="' + id + '">' + e(c.etiqueta) + (st.obligatorio ? '<span class="obligatorio" aria-hidden="true">*</span>' : '') + '</label>';
    }
    const datos = ' data-clave="' + e(c.clave) + '" data-id="' + id + '"';
    switch (c.tipo) {
      case 'TextoLargo':
        h += '<textarea id="' + id + '" rows="3" maxlength="' + (c.longitudMaxima || 4000) + '"' + datos + dis + '>' + e(v) + '</textarea>'; break;
      case 'Correo':
        h += '<input id="' + id + '" type="email" maxlength="256" value="' + e(v) + '"' + datos + dis + ' />'; break;
      case 'Entero': case 'Decimal': case 'Moneda': case 'Porcentaje':
        h += '<div class="con-adorno">' + (c.tipo === 'Moneda' ? '<span class="adorno">$</span>' : '') +
          '<input id="' + id + '" type="text" inputmode="' + (c.tipo === 'Entero' ? 'numeric' : 'decimal') + '" value="' + e(v) + '"' + datos + dis + ' />' +
          (c.tipo === 'Porcentaje' ? '<span class="adorno">%</span>' : '') + '</div>'; break;
      case 'Fecha':
        h += '<input id="' + id + '" type="date" value="' + e(v) + '"' + datos + dis + ' />'; break;
      case 'Hora':
        h += '<input id="' + id + '" type="time" value="' + e(v) + '"' + datos + dis + ' />'; break;
      case 'Lista':
        h += '<select id="' + id + '"' + datos + dis + '><option value="">Selecciona una opción</option>' +
          (c.opciones || []).map((o) => '<option value="' + e(o.valor) + '"' + (o.valor === v ? ' selected' : '') + (ctx.bloqueadas && ctx.bloqueadas.includes(o.valor) ? ' disabled' : '') + '>' + e(o.etiqueta) + '</option>').join('') + '</select>'; break;
      case 'Estado':
        h += '<select id="' + id + '"' + datos + dis + '><option value="">Selecciona un estado</option>' +
          Motor.ESTADOS.map((x) => '<option value="' + e(x) + '"' + (x === v ? ' selected' : '') + '>' + e(x) + '</option>').join('') + '</select>'; break;
      case 'OpcionUnica':
        h += '<div class="opciones">' + (c.opciones || []).map((o) => '<label class="opcion"><input type="radio" name="' + id + '" value="' + e(o.valor) + '"' +
          (v === o.valor ? ' checked' : '') + datos + dis + ' /> ' + e(o.etiqueta) + '</label>').join('') + '</div>'; break;
      case 'SiNo':
        h += '<div class="opciones">' + [['si', 'Sí'], ['no', 'No']].map(([val, t]) => '<label class="opcion"><input type="radio" name="' + id + '" value="' + val + '"' +
          (v === val ? ' checked' : '') + datos + dis + ' /> ' + t + '</label>').join('') + '</div>'; break;
      case 'OpcionMultiple': {
        const elegidas = Array.isArray(valor) ? valor : [];
        h += '<div class="opciones">' + (c.opciones || []).map((o) => '<label class="opcion"><input type="checkbox" value="' + e(o.valor) + '"' +
          (elegidas.includes(o.valor) ? ' checked' : '') + datos + ' data-multiple' + dis + ' /> ' + e(o.etiqueta) + '</label>').join('') + '</div>'; break;
      }
      case 'Calculado': {
        const n = calculados[c.clave];
        h += '<output id="' + id + '" class="calculado">' + (n == null ? '—' : (c.formato === 'Moneda' ? '$' : '') + texto(n, c.formato === 'Moneda' ? 2 : (Number.isInteger(n) ? 0 : 2))) + '</output>'; break;
      }
      case 'Informativo':
        h += '<p class="informativo">' + e(c.contenido) + '</p>'; break;
      case 'Catalogo': {
        const registros = catalogos(c.catalogo);
        const reg = registros.find((x) => String(x.valores.clave) === String(v));
        const desc = reg ? reg.valores.nombre : v;
        h += '<input id="' + id + '" type="text" list="' + id + '-sugerencias" autocomplete="off" placeholder="Escribe para buscar..." value="' + e(desc) + '"' + datos + ' data-catalogo="' + e(c.catalogo) + '"' + dis + ' />' +
          '<datalist id="' + id + '-sugerencias">' + registros.filter((x) => x.activo).map((x) => '<option value="' + e(x.valores.nombre) + '">' + e(x.valores.clave) + '</option>').join('') + '</datalist>';
        if (reg && !reg.activo && !soloLectura) h += '<small class="aviso">Esta opción ya no está disponible. Elige otra.</small>';
        break;
      }
      case 'DatoCatalogo': {
        const d = datosCatalogo[c.clave];
        h += '<output id="' + id + '" class="calculado">' + (d == null ? '—' : c.tipoColumna === 'Moneda' ? '$' + texto(d, 2) : texto(d, Number.isInteger(Number(d)) ? 0 : 2)) + '</output>'; break;
      }
      case 'Usuario': case 'NombreUsuario':
        h += '<output id="' + id + '" class="calculado" title="Se llena solo con quien captura">' + e(valor || 'Se llena con quien captura') + '</output>'; break;
      case 'Validador': case 'Cobrador':
        h += '<output id="' + id + '" class="calculado" title="Se llena solo en las bandejas de BackOffice">' +
          e(valor || (c.tipo === 'Validador' ? 'Se llena con quien valida' : 'Se llena con quien cobra')) + '</output>'; break;
      case 'Nip':
        h += '<output id="' + id + '" class="calculado" title="Se verifica en la bandeja de validación">Se verifica en la bandeja de validación</output>'; break;
      case 'Archivo':
        h += '{{hijo:0}}';
        hijo = campoArchivo(c, valor, id, soloLectura); break;
      default:
        h += '<input id="' + id + '" type="text" maxlength="' + (c.longitudMaxima || 250) + '" value="' + e(v) + '"' + datos + dis + ' />';
    }
    if (c.ayuda) h += '<small class="ayuda">' + e(c.ayuda) + '</small>';
    if (error) h += '<small class="mensaje-error" role="alert">' + e(error) + '</small>';
    return C.marcar('CampoFormulario', h + '</div>', hijo ? [hijo] : []);
  }

  /* ---------- GrupoCampos ---------- */
  function grupoCampos(seccion, ctx, estadoDe, errorDe) {
    const hijos = [];
    let h = '';
    seccion.filas.forEach(function (fila) {
      const visibles = fila.filter((c) => !c.desactivado && estadoDe(c.clave).visible);
      if (!visibles.length) return;
      h += '<div class="rejilla">';
      visibles.forEach(function (c) {
        h += '<div class="celda" style="--ancho: ' + Math.min(12, Math.max(1, c.ancho || 12)) + '">{{hijo:' + hijos.length + '}}</div>';
        hijos.push(campoFormulario(c, Object.assign({}, ctx, {
          estado: estadoDe(c.clave), error: errorDe(c.clave),
          soloLectura: ctx.soloLectura || (ctx.editables && !ctx.editables.includes(c.clave)),
        })));
      });
      h += '</div>';
    });
    return C.marcar('GrupoCampos', h, hijos);
  }

  /* ---------- RenderizadorFormulario ---------- */
  function dibujar(o) {
    const estado = Motor.evaluar(o.def, o.respuestas, o.opciones);
    const errores = o.errores || { campos: {}, secciones: {}, filas: {} };
    const filasFijas = o.soloLectura || !!o.editables;
    const ctxBase = { soloLectura: o.soloLectura, editables: o.editables, catalogos: o.opciones.catalogos, calculados: estado.calculados, datosCatalogo: estado.datosCatalogo, bloqueadas: o.bloqueadas };
    const hijos = [];
    let h = '<div class="formulario">';
    o.def.secciones.forEach(function (s) {
      if (!estado.secciones[s.clave]) return;
      h += '<section class="seccion"' + (s.color ? ' style="--color-seccion: ' + s.color + '"' : '') + '><h2>' + e(s.titulo) + '</h2>';
      if (s.descripcion) h += '<p class="descripcion">' + e(s.descripcion) + '</p>';
      if (errores.secciones[s.clave]) h += '<p class="mensaje-error" role="alert">' + e(errores.secciones[s.clave]) + '</p>';
      if (!s.repetible) {
        h += '{{hijo:' + hijos.length + '}}';
        hijos.push(grupoCampos(s, Object.assign({ grupo: o.respuestas.generales, idBase: 'campo' }, ctxBase),
          (clave) => estado.campos[clave] || { visible: true }, (clave) => errores.campos[clave]));
      } else {
        const filas = o.respuestas.repeticiones[s.clave] || (o.respuestas.repeticiones[s.clave] = []);
        while (filas.length < (s.minimo || 0)) filas.push({});
        filas.forEach(function (f, i) {
          h += '<div class="repeticion"><div class="encabezado-repeticion"><span>' + (i + 1) + '</span>' +
            (!filasFijas && filas.length > (s.minimo || 0) ? '<button type="button" class="quitar" data-quitar-fila="' + s.clave + '" data-indice="' + i + '">Quitar</button>' : '') + '</div>{{hijo:' + hijos.length + '}}</div>';
          const errFila = (errores.filas[s.clave] || [])[i] || {};
          hijos.push(grupoCampos(s, Object.assign({ grupo: f, idBase: s.clave + '-' + i, fila: { seccion: s.clave, indice: i } }, ctxBase),
            (clave) => ({ visible: true, obligatorio: (Motor.campo(o.def, clave) || {}).obligatorio === 'Siempre' }), (clave) => errFila[clave]));
        });
        if (!filasFijas && (s.maximo == null || filas.length < s.maximo)) h += '<button type="button" class="agregar" data-agregar-fila="' + s.clave + '">+ Agregar</button>';
      }
      h += '</section>';
    });
    return { html: C.marcar('RenderizadorFormulario', h + '</div>', hijos), estado };
  }

  /*
   * Monta el formulario en "contenedor" y lo redibuja en cada cambio.
   * o: { def, respuestas, opciones (motor), soloLectura, editables, errores, alCambiar }
   */
  function montar(contenedor, o) {
    function pintar() {
      const activo = document.activeElement;
      const idActivo = activo && contenedor.contains(activo) ? activo.id : null;
      const inicio = activo && 'selectionStart' in activo ? activo.selectionStart : null;
      const r = dibujar(o);
      contenedor.innerHTML = r.html;
      o.estado = r.estado;
      if (idActivo) {
        const nuevo = document.getElementById(idActivo);
        if (nuevo) { nuevo.focus(); try { if (inicio != null) nuevo.setSelectionRange(inicio, inicio); } catch (err) { /* nada */ } }
      }
    }

    function grupoDe(el) {
      const id = el.dataset.id || el.id || '';
      const m = id.match(/^([a-z_]+)-(\d+)-/);
      if (m && o.respuestas.repeticiones[m[1]]) return o.respuestas.repeticiones[m[1]][Number(m[2])];
      return o.respuestas.generales;
    }

    function cambiar(el) {
      const clave = el.dataset.clave;
      if (!clave) return;
      const g = grupoDe(el);
      if (el.dataset.multiple !== undefined) {
        const lista = Array.isArray(g[clave]) ? g[clave] : [];
        g[clave] = el.checked ? lista.concat(el.value) : lista.filter((x) => x !== el.value);
      } else if (el.dataset.catalogo) {
        const reg = o.opciones.catalogos(el.dataset.catalogo).find((x) => x.valores.nombre === el.value || String(x.valores.clave).toLowerCase() === el.value.trim().toLowerCase());
        g[clave] = reg ? reg.valores.clave : el.value;
      } else {
        g[clave] = el.value === '' ? null : el.value;
      }
      if (o.errores && o.errores.campos) delete o.errores.campos[clave];
      pintar();
      if (o.alCambiar) o.alCambiar();
    }

    contenedor.addEventListener('input', (ev) => { if (ev.target.matches('input[type="text"], input[type="email"], textarea')) cambiar(ev.target); });
    contenedor.addEventListener('change', function (ev) {
      const el = ev.target;
      if (el.matches('[data-archivo]')) {
        const archivo = el.files[0];
        if (!archivo) return;
        if (archivo.size > 10 * 1024 * 1024) { C.avisar('El archivo pesa más de 10 MB.', 'error'); return; }
        const clave = el.id.split('-').slice(-1)[0];
        const g = grupoDe(el);
        g[clave] = (g[clave] || []).concat([{ nombre: archivo.name, tamano: archivo.size }]);
        pintar();
        if (o.alCambiar) o.alCambiar();
        return;
      }
      if (!el.matches('input[type="text"], input[type="email"], textarea')) cambiar(el);
    });
    contenedor.addEventListener('click', function (ev) {
      const agregar = ev.target.closest('[data-agregar-fila]');
      const quitar = ev.target.closest('[data-quitar-fila]');
      const quitarArchivo = ev.target.closest('[data-quitar-archivo]');
      if (ev.target.closest('[data-ver-archivo]')) { ev.preventDefault(); C.avisar('En la demo los archivos adjuntos no se guardan; solo se muestra su nombre.'); return; }
      if (agregar) { o.respuestas.repeticiones[agregar.dataset.agregarFila].push({}); pintar(); if (o.alCambiar) o.alCambiar(); }
      if (quitar) { o.respuestas.repeticiones[quitar.dataset.quitarFila].splice(Number(quitar.dataset.indice), 1); pintar(); if (o.alCambiar) o.alCambiar(); }
      if (quitarArchivo) {
        const campo = quitarArchivo.closest('.campo').querySelector('label');
        const clave = campo ? campo.getAttribute('for').split('-').slice(-1)[0] : 'comprobante';
        (o.respuestas.generales[clave] || []).splice(Number(quitarArchivo.dataset.quitarArchivo), 1);
        pintar();
        if (o.alCambiar) o.alCambiar();
      }
    });

    pintar();
    return { pintar, opciones: o };
  }

  window.Formulario = { montar, dibujar };
})();
