/* Constructor de formularios en solo lectura (Constructor.razor + Lienzo.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'formularios', titulo: 'Constructor', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const f = D.formulario(C.param('formulario'));
  const version = f ? (f.versiones.find((v) => v.estado === 'Borrador') || D.versionPublicada(f)) : null;
  if (!f || !version) {
    p.contenido.innerHTML = C.marcar('Constructor', '<p>Este formulario no tiene un borrador para editar.</p><a href="formularios.html">Volver a formularios</a>');
    return;
  }
  document.title = f.nombre + ' - Constructor Forms';
  const def = version.definicion;
  const campana = D.campana(f.campanaId);
  const publicada = D.versionPublicada(f);
  const clavesPublicadas = new Set(publicada ? Motor.campos(publicada.definicion).map((c) => c.clave) : []);

  const NOMBRES = {
    TextoCorto: 'Texto corto', TextoLargo: 'Texto largo', Correo: 'Correo', Entero: 'Número entero', Decimal: 'Número decimal', Moneda: 'Moneda', Porcentaje: 'Porcentaje',
    Fecha: 'Fecha', Hora: 'Hora', FechaHora: 'Fecha y hora', Lista: 'Lista desplegable', OpcionUnica: 'Opción única', OpcionMultiple: 'Opción múltiple', SiNo: 'Sí / No',
    Estado: 'Estado de la República', Calculado: 'Calculado', Informativo: 'Texto informativo', Catalogo: 'Catálogo', DatoCatalogo: 'Dato de catálogo', Archivo: 'Archivo adjunto',
    Usuario: 'Usuario', NombreUsuario: 'Nombre de usuario', Validador: 'Validó', Cobrador: 'Cobró', Nip: 'NIP',
  };
  const PALETA = [
    ['Texto', ['TextoCorto', 'TextoLargo', 'Correo']], ['Números', ['Entero', 'Decimal', 'Moneda', 'Porcentaje']], ['Fechas', ['Fecha', 'Hora', 'FechaHora']],
    ['Opciones', ['Lista', 'OpcionUnica', 'OpcionMultiple', 'SiNo', 'Estado']], ['Especiales', ['Calculado', 'Informativo', 'Archivo']],
    ['Quien captura', ['Usuario', 'NombreUsuario']], ['Catálogos', ['Catalogo', 'DatoCatalogo']],
  ].concat(campana.usaBackOffice ? [['BackOffice', ['Validador', 'Cobrador', 'Nip']]] : []);
  const nombreTipo = (t) => NOMBRES[t] || t;

  let seleccionado = null; // { tipo: 'seccion'|'campo', clave }
  let vistaPrevia = false;
  let respuestasPrevia = { generales: {}, repeticiones: {} };
  let erroresPrevia = null;

  function lienzo() {
    let h = '';
    def.secciones.forEach(function (s) {
      const sel = seleccionado && seleccionado.tipo === 'seccion' && seleccionado.clave === s.clave;
      h += '<section data-seccion="' + s.clave + '" class="seccion' + (sel ? ' seleccionado' : '') + '" style="--color-seccion: ' + (s.color || '#1f3a5f') + '"><header>' +
        '<span class="titulo-seccion">' + e(s.titulo || 'Sección sin título') + '</span>' + (s.soloBackOffice ? '<span class="marca">Solo BackOffice</span>' : '') +
        (s.repetible ? '<span class="marca">Repetible</span>' : '') + (s.condicion ? '<span class="marca">Condicional</span>' : '') + '</header>';
      s.filas.forEach(function (fila, i) {
        h += '<div class="rejilla" data-fila="' + i + '">' + fila.map(function (c) {
          const clases = ['campo'];
          if (seleccionado && seleccionado.tipo === 'campo' && seleccionado.clave === c.clave) clases.push('seleccionado');
          if (c.desactivado) clases.push('desactivado');
          if (c.condicion) clases.push('condicional');
          const obligatorio = c.obligatorio === 'Siempre' || c.obligatorio === 'ConCondicion';
          return '<div data-ancho="' + c.ancho + '" data-desactivado="' + !!c.desactivado + '" data-campo="' + c.clave + '" draggable="false" class="' + clases.join(' ') + '" style="--ancho: ' + Math.min(12, Math.max(1, c.ancho || 12)) + '">' +
            '<span class="etiqueta-campo">' + e(c.etiqueta || nombreTipo(c.tipo)) + (obligatorio ? ' <span class="obligatorio">*</span>' : '') + '</span>' +
            '<span class="tipo">' + nombreTipo(c.tipo) + (c.desactivado ? ' · desactivado' : '') +
            (clavesPublicadas.has(c.clave) ? ' <span class="publicado" title="Ya se publicó: su clave y su tipo no cambian">publicado</span>' : '') +
            (c.editableBackOffice ? ' <span class="corregible" title="BackOffice puede editarlo en sus bandejas">BackOffice</span>' : '') +
            (c.esEstatusValidacion ? ' <span class="corregible" title="Mueve la venta entre las bandejas">estatus de validación</span>' : '') +
            (c.esEstatusBackOffice ? ' <span class="corregible" title="Mueve la venta entre las bandejas">estatus de BackOffice</span>' : '') +
            (c.corregible ? ' <span class="corregible" title="El supervisor puede corregirlo en las capturas enviadas">corregible</span>' : '') + '</span></div>';
        }).join('') + '</div>';
      });
      h += '</section>';
    });
    return C.marcar('Lienzo', h);
  }

  function textoCondicion(cond) {
    if (!cond) return null;
    const op = { Igual: 'es', Distinto: 'no es', Mayor: 'es mayor que', Menor: 'es menor que', MayorOIgual: 'es mayor o igual a', MenorOIgual: 'es menor o igual a', Vacio: 'está vacío', NoVacio: 'tiene valor' };
    return cond.reglas.map(function (r) {
      const campo = Motor.campo(def, r.campo);
      const valor = campo && r.valor != null ? Motor.texto(campo, r.valor) || r.valor : r.valor;
      return '"' + (campo ? campo.etiqueta : r.campo) + '" ' + (op[r.operador] || r.operador) + (valor != null && !['Vacio', 'NoVacio'].includes(r.operador) ? ' "' + valor + '"' : '');
    }).join(cond.union === 'Todas' ? ' y ' : ' o ');
  }

  function propiedades() {
    if (!seleccionado) return '<p class="detalle">Selecciona una sección o un campo para ver sus propiedades.</p>';
    const fila = (k, v) => v == null || v === '' ? '' : '<p><span class="detalle">' + e(k) + '</span><br />' + e(v) + '</p>';
    if (seleccionado.tipo === 'seccion') {
      const s = def.secciones.find((x) => x.clave === seleccionado.clave);
      return '<h3>Sección</h3>' + fila('Título', s.titulo) + fila('Clave', s.clave) + fila('Descripción', s.descripcion) + fila('Color', s.color) +
        (s.repetible ? fila('Repetible', 'De ' + (s.minimo || 0) + ' a ' + (s.maximo == null ? 'sin límite' : s.maximo) + ' filas') : '') +
        (s.soloBackOffice ? fila('Solo BackOffice', 'Sí: la llenan Validación y Cobro') : '') + fila('Se muestra si', textoCondicion(s.condicion));
    }
    const c = Motor.campo(def, seleccionado.clave);
    const obligatorio = { Siempre: 'Siempre', ConCondicion: 'Con condición: ' + textoCondicion(c.condicionObligatorio) }[c.obligatorio] || 'Nunca';
    return '<h3>' + e(c.etiqueta || nombreTipo(c.tipo)) + '</h3>' + fila('Tipo', nombreTipo(c.tipo)) + fila('Clave', c.clave) + fila('Ancho', c.ancho + ' de 12') +
      (Motor.SIN_CAPTURA.includes(c.tipo) ? '' : fila('Obligatorio', obligatorio)) + fila('Ayuda', c.ayuda) + fila('Validador', c.validador) +
      fila('Fórmula', c.formula) + fila('Catálogo', c.catalogo) + fila('Dato', c.dato) + fila('Columna', c.columna) +
      (c.opciones ? fila('Opciones', c.opciones.map((o) => o.etiqueta).join(', ')) : '') + fila('Se muestra si', textoCondicion(c.condicion)) +
      (c.corregible ? fila('Supervisor', 'Lo puede corregir en las capturas enviadas') : '') + (c.editableBackOffice ? fila('BackOffice', 'Lo puede editar en sus bandejas') : '');
  }

  function dibujar() {
    let h = '<div class="constructor"><header class="barra"><a class="volver" href="formularios.html">← Formularios</a>' +
      '<div class="titulo"><strong>' + e(f.nombre) + '</strong><span class="detalle">' + (version.estado === 'Borrador' ? 'Borrador ' : 'Versión ') + version.numero + '</span></div>' +
      '<span class="estado-guardado">Solo lectura</span><button type="button">Sin errores</button>' +
      '<button type="button" id="previa">' + (vistaPrevia ? 'Volver al diseño' : 'Vista previa') + '</button>' +
      '</header><div class="aviso-candado" role="status">Demo: el constructor se ve en solo lectura. Puedes seleccionar secciones y campos para ver sus propiedades, y probar la vista previa.</div>' +
      '<div class="columnas"><aside class="paleta"><h3>Paleta</h3><p class="detalle">Arrastra un tipo al lienzo, o haz clic para agregarlo a la sección seleccionada.</p>' +
      PALETA.map(([g, tipos]) => '<h4>' + g + '</h4>' + tipos.map((t) => '<div class="elemento-paleta inactivo" role="button" tabindex="-1" draggable="false">' + nombreTipo(t) + '</div>').join('')).join('') +
      '<button type="button" class="agregar-seccion" disabled>+ Nueva sección</button></aside><main class="lienzo"><div class="indicador-soltar"></div>';
    if (vistaPrevia) {
      h += '<div class="barra-previa"><button type="button" id="validar-previa">Validar como lo haría el servidor</button>' +
        (erroresPrevia ? '<span class="' + (erroresPrevia.total ? 'con-errores' : 'sin-errores') + '">' + (erroresPrevia.total ? (erroresPrevia.total === 1 ? '1 error' : erroresPrevia.total + ' errores') : 'Sin errores ✓') + '</span>' : '') +
        '</div><div id="previa-formulario"></div>';
    } else h += '{{hijo:0}}';
    h += '</main><aside class="propiedades">' + propiedades() + '</aside></div></div>';
    p.contenido.innerHTML = C.marcar('Constructor', h, vistaPrevia ? [] : [lienzo()]);
    if (vistaPrevia) {
      Formulario.montar(document.getElementById('previa-formulario'), {
        def, respuestas: respuestasPrevia, errores: erroresPrevia || undefined,
        opciones: { catalogos: R.catalogosDe(campana.id), usuario: { usuario: 'vista.previa', nombre: 'Vista previa' }, hoy: C.fechas.hoy() },
      });
    }
  }

  p.contenido.addEventListener('click', function (ev) {
    if (ev.target.id === 'previa') { vistaPrevia = !vistaPrevia; erroresPrevia = null; dibujar(); return; }
    if (ev.target.id === 'validar-previa') {
      erroresPrevia = Motor.validar(def, JSON.parse(JSON.stringify(respuestasPrevia)), { catalogos: R.catalogosDe(campana.id), hoy: C.fechas.hoy() }).errores;
      dibujar();
      return;
    }
    const campo = ev.target.closest('[data-campo]');
    const seccion = ev.target.closest('[data-seccion]');
    if (campo) { seleccionado = { tipo: 'campo', clave: campo.dataset.campo }; dibujar(); }
    else if (seccion) { seleccionado = { tipo: 'seccion', clave: seccion.dataset.seccion }; dibujar(); }
  });
  dibujar();
})();
