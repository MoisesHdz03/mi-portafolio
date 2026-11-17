/* ============================================================
   CONSTRUCTOR FORMS · DEMO
   Componentes que comparten varias pantallas, con su mismo HTML:
   Barra, EstadoVenta, HistorialCorrecciones y DescripcionCampana.
   ============================================================ */
(function () {
  'use strict';
  const e = C.e;
  const enFecha = (iso) => 'el ' + C.fechas.corta(iso) + ' a las ' + C.fechas.hora(iso);

  /* Barra de avance (Barra.razor) */
  function barra(valor, meta) {
    const pct = meta > 0 ? Math.min(100, Math.floor(valor * 100 / meta)) : 0;
    return C.marcar('Barra', '<span class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + meta + '" aria-valuenow="' + valor + '" title="' + valor + ' de ' + meta + '">' +
      '<span class="relleno' + (valor >= meta && meta > 0 ? ' cumplida' : '') + '" style="width: ' + pct + '%"></span></span>');
  }

  /* De qué trata la campaña (DescripcionCampana.razor) */
  function descripcionCampana(campana) {
    return campana && campana.descripcion ? C.marcar('DescripcionCampana', '<p class="descripcion-campana">' + e(campana.descripcion) + '</p>') : '';
  }

  /* Estado de la venta para quien no ve la sección de BackOffice (EstadoVenta.razor) */
  function estadoVenta(c, titulo) {
    const campana = D.campana(c.campanaId);
    if (!campana.usaBackOffice || c.estado !== 'Enviada') return '';
    const g = c.respuestas.generales;
    const motivoV = c.estatusValidacion === 'rechazada'
      ? (c.rechazadaPorNip ? 'Intentos de NIP agotados' : textoOpcion(c, 'motivo_de_rechazo_validacion')) : null;
    const motivoB = c.estatusBackOffice === 'rechazada' ? textoOpcion(c, 'motivo_de_rechazo_backoffice') : null;
    let h = '<section class="estado-venta" aria-labelledby="titulo-estado-venta"><h2 id="titulo-estado-venta">' + e(titulo || 'Estado de la captura') + '</h2><div class="etapas">';
    h += '<div class="etapa"><h3>Validación</h3>';
    if (!c.estatusValidacion) h += '<p><span class="etiqueta etiqueta-neutra">Por validar</span></p>';
    else {
      h += '<p><span class="etiqueta ' + (c.estatusValidacion === 'aprobada' ? 'etiqueta-exito' : 'etiqueta-error') + '">' + (c.estatusValidacion === 'aprobada' ? 'Aprobada' : 'Rechazada') + '</span> ' + enFecha(c.fechaValidacion) + '</p>';
      if (c.aprobadaSinNip) h += '<p class="motivo"><span class="detalle">Aprobada sin NIP</span></p>';
      if (motivoV) h += '<p class="motivo"><span class="detalle">Motivo:</span> ' + e(motivoV) + '</p>';
    }
    h += '</div>';
    if (c.estatusValidacion === 'aprobada' || c.estatusBackOffice) {
      h += '<div class="etapa"><h3>Cobro</h3>';
      if (!c.estatusBackOffice) h += '<p><span class="etiqueta etiqueta-aviso">Por cobrar</span></p>';
      else {
        h += '<p><span class="etiqueta ' + (c.estatusBackOffice === 'cobrada' ? 'etiqueta-exito' : 'etiqueta-error') + '">' + (c.estatusBackOffice === 'cobrada' ? 'Cobrada' : 'Rechazada') + '</span> ' + enFecha(c.fechaCobro) + '</p>';
        if (motivoB) h += '<p class="motivo"><span class="detalle">Motivo:</span> ' + e(motivoB) + '</p>';
      }
      h += '</div>';
    }
    void g;
    return C.marcar('EstadoVenta', h + '</div></section>');
  }

  function textoOpcion(c, clave) {
    const f = D.formulario(c.formularioId);
    const def = D.version(f, c.version).definicion;
    const campo = Motor.campo(def, clave);
    return campo ? Motor.texto(campo, c.respuestas.generales[clave]) || 'Sin motivo' : 'Sin motivo';
  }

  /* Historial de correcciones (HistorialCorrecciones.razor) */
  function historial(c, ocultarBackOffice) {
    const def = D.version(D.formulario(c.formularioId), c.version).definicion;
    const deBackOffice = new Set();
    def.secciones.filter((s) => s.soloBackOffice).forEach((s) => s.filas.forEach((f) => f.forEach((x) => deBackOffice.add(x.clave))));
    const lista = (c.correcciones || []).map((k) => Object.assign({}, k, { cambios: k.cambios.filter((x) => !(ocultarBackOffice && deBackOffice.has(x.campo))) }))
      .filter((k) => k.cambios.length || !ocultarBackOffice);
    if (!lista.length) return '';
    let h = '<section class="historial"><h2>Historial de correcciones</h2><ol>';
    lista.slice().reverse().forEach(function (k) {
      h += '<li class="correccion"><p class="encabezado"><strong>' + e(D.nombre(k.usuarioId)) + '</strong> <span class="detalle">el ' + C.fechas.corta(k.fecha) + ' a las ' + C.fechas.hora(k.fecha) + '</span></p>' +
        '<p class="motivo">“' + e(k.motivo) + '”</p>';
      if (k.cambios.length) {
        h += '<table class="cambios"><thead><tr><th>Campo</th><th>Antes</th><th>Después</th></tr></thead><tbody>' +
          k.cambios.map((x) => '<tr><td>' + e(x.etiqueta) + (x.fila != null ? ' <span class="detalle">(' + e(x.seccion) + ', fila ' + (x.fila + 1) + ')</span>' : '') + '</td>' +
            '<td class="antes">' + e(x.antes == null || x.antes === '' ? '(vacío)' : x.antes) + '</td><td class="despues">' + e(x.despues == null || x.despues === '' ? '(vacío)' : x.despues) + '</td></tr>').join('') +
          '</tbody></table>';
      }
      h += '</li>';
    });
    return C.marcar('HistorialCorrecciones', h + '</ol></section>');
  }

  /* Opciones del motor para una captura (catálogos de su campaña y la copia guardada) */
  function opcionesMotor(c, usuario, extra) {
    return Object.assign({
      catalogos: R.catalogosDe(c.campanaId),
      copia: c.copiaCatalogo,
      hoy: c.enviada ? C.fechas.dia(c.enviada) : C.fechas.hoy(),
      usuario: usuario ? { usuario: usuario.usuario, nombre: usuario.nombre } : null,
    }, extra || {});
  }

  /* Qué cambió entre lo guardado y lo nuevo, campo por campo, con el texto como se ve (ReglasCorreccion.Cambios) */
  function cambios(def, antes, despues, campanaId) {
    function textoDe(campo, valor) {
      if (campo.tipo === 'Catalogo' && valor) {
        const reg = R.catalogosDe(campanaId)(campo.catalogo).find((k) => String(k.valores.clave) === String(valor));
        return reg ? reg.valores.nombre : String(valor);
      }
      return Motor.texto(campo, valor);
    }
    const lista = [];
    Motor.campos(def).forEach(function (campo) {
      if (campo.tipo === 'Informativo') return;
      if (campo.seccion.repetible) {
        const fa = antes.repeticiones[campo.seccion.clave] || [];
        const fd = despues.repeticiones[campo.seccion.clave] || [];
        for (let i = 0; i < Math.max(fa.length, fd.length); i++) {
          const a = textoDe(campo, (fa[i] || {})[campo.clave]);
          const d = textoDe(campo, (fd[i] || {})[campo.clave]);
          if (a !== d) lista.push({ campo: campo.clave, etiqueta: campo.etiqueta, seccion: campo.seccion.titulo, fila: i, antes: a || null, despues: d || null });
        }
        return;
      }
      const a = textoDe(campo, antes.generales[campo.clave]);
      const d = textoDe(campo, despues.generales[campo.clave]);
      if (a !== d) lista.push({ campo: campo.clave, etiqueta: campo.etiqueta, antes: a || null, despues: d || null });
    });
    return lista;
  }

  /* Copia de catálogo: si se eligió otra opción, se guarda como está hoy */
  function actualizarCopia(def, c, limpias) {
    Motor.campos(def).filter((x) => x.tipo === 'Catalogo' && limpias.generales[x.clave]).forEach(function (x) {
      if (c.copiaCatalogo[x.clave] && c.copiaCatalogo[x.clave].clave === limpias.generales[x.clave]) return;
      const reg = R.catalogosDe(c.campanaId)(x.catalogo).find((k) => String(k.valores.clave) === String(limpias.generales[x.clave]));
      if (reg) c.copiaCatalogo[x.clave] = Object.assign({}, reg.valores);
    });
  }

  /* Barras por día en SVG (GraficaPorDia.razor). dias: [{dia: 'YYYY-MM-DD', cantidad}] */
  function graficaPorDia(dias, o) {
    o = Object.assign({ descripcion: 'Capturas enviadas por día', singular: 'captura', plural: 'capturas', diasDelPeriodo: 0, meta: null, hoy: C.fechas.hoy() }, o || {});
    if (!dias.length) return C.marcar('GraficaPorDia', '<p class="vacio">El periodo todavía no empieza.</p>');
    const W = 720, H = 220, MI = 40, MD = 8, MS = 10, MB = 26;
    const N = (v) => String(Math.round(v * 100) / 100);
    const ritmo = o.meta > 0 && o.diasDelPeriodo > 0 ? o.meta / o.diasDelPeriodo : null;
    let mayor = Math.max(Math.max.apply(null, dias.map((d) => d.cantidad)), Math.ceil(ritmo || 0));
    let maximo = 4;
    if (mayor > 4) {
      const paso = Math.pow(10, Math.floor(Math.log10(mayor)));
      maximo = mayor;
      for (const f of [1, 2, 2.5, 5, 10]) { if (f * paso >= mayor) { maximo = Math.ceil(f * paso); break; } }
    }
    const Y = (v) => H - MB - v / maximo * (H - MB - MS);
    const ancho = (W - MI - MD) / dias.length;
    const cada = Math.max(1, Math.ceil(dias.length / 16));
    const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    let h = '<svg class="grafica" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(o.descripcion) + '">';
    [0, Math.floor(maximo / 2), maximo].forEach(function (l) {
      h += '<g><line class="guia" x1="' + MI + '" x2="' + (W - MD) + '" y1="' + N(Y(l)) + '" y2="' + N(Y(l)) + '"></line><text class="eje" x="' + (MI - 6) + '" y="' + N(Y(l) + 4) + '" text-anchor="end">' + l + '</text></g>';
    });
    dias.forEach(function (d, i) {
      const x = MI + i * ancho + ancho * 0.15;
      const y = Y(d.cantidad);
      const [yy, mm, dd] = d.dia.split('-').map(Number);
      const semana = DIAS[new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay()];
      h += '<rect class="barra' + (d.dia === o.hoy ? ' hoy' : '') + '" x="' + N(x) + '" y="' + N(y) + '" width="' + N(ancho * 0.7) + '" height="' + N(H - MB - y) + '"><title>' +
        semana + ' ' + dd + ' de ' + R.MESES[mm - 1] + ': ' + d.cantidad + ' ' + (d.cantidad === 1 ? o.singular : o.plural) + '</title></rect>';
      if (i === 0 || i % cada === 0) h += '<g><text class="eje" x="' + N(x + ancho * 0.35) + '" y="' + (H - MB + 16) + '" text-anchor="middle">' + dd + '</text></g>';
    });
    if (ritmo) h += '<line class="ritmo" x1="' + MI + '" x2="' + (W - MD) + '" y1="' + N(Y(ritmo)) + '" y2="' + N(Y(ritmo)) + '"></line>';
    h += '<line class="base" x1="' + MI + '" x2="' + (W - MD) + '" y1="' + (H - MB) + '" y2="' + (H - MB) + '"></line></svg>';
    if (ritmo) h += '<p class="leyenda"><span class="muestra-ritmo"></span> Ritmo parejo para la meta: ' + (Math.round(ritmo * 10) / 10).toLocaleString('es-MX') + ' por día</p>';
    return C.marcar('GraficaPorDia', h);
  }

  /* Lista de conteos con barras (GraficaMotivos.razor). motivos: [{motivo, cantidad}] ya ordenados */
  function graficaMotivos(titulo, motivos, o) {
    o = Object.assign({ singular: 'rechazo', plural: 'rechazos', vacio: 'Sin rechazos en estos días.' }, o || {});
    let h = '<div class="motivos"><h3>' + e(titulo) + '</h3>';
    if (!motivos.length) return C.marcar('GraficaMotivos', h + '<p class="vacio">' + e(o.vacio) + '</p></div>');
    const total = motivos.reduce((t, m) => t + m.cantidad, 0);
    const max = Math.max.apply(null, motivos.map((m) => m.cantidad));
    const contar = (n) => n === 1 ? '1 ' + o.singular : C.numero(n) + ' ' + o.plural;
    h += '<ol>' + motivos.map(function (m) {
      const pct = Math.round(100 * m.cantidad / total);
      return '<li title="' + e(m.motivo) + ': ' + contar(m.cantidad) + ' de ' + total + ' (' + pct + ' %)"><span class="nombre">' + e(m.motivo) + '</span>' +
        '<span class="valor">' + C.numero(m.cantidad) + ' <span class="porcentaje">' + pct + ' %</span></span><span class="barra" style="width: ' + (Math.round(10000 * m.cantidad / max) / 100) + '%" aria-hidden="true"></span></li>';
    }).join('') + '</ol><p class="total">' + contar(total) + ' en total</p></div>';
    return C.marcar('GraficaMotivos', h);
  }

  /* Cuenta y ordena de más a menos; lo que pasa de "visibles" se junta en "otros" */
  function agrupar(nombres, visibles, otros) {
    const conteo = new Map();
    nombres.forEach((n) => conteo.set(n, (conteo.get(n) || 0) + 1));
    const lista = [...conteo].map(([motivo, cantidad]) => ({ motivo, cantidad })).sort((a, b) => b.cantidad - a.cantidad || a.motivo.localeCompare(b.motivo));
    if (lista.length <= visibles) return lista;
    const resto = lista.slice(visibles).reduce((t, m) => t + m.cantidad, 0);
    return lista.slice(0, visibles).concat([{ motivo: otros, cantidad: resto }]);
  }

  /* Días entre dos fechas (YYYY-MM-DD) */
  function listaDias(inicio, fin) {
    const dias = [];
    for (let d = inicio; d <= fin; d = C.fechas.sumarDias(d, 1)) dias.push(d);
    return dias;
  }

  /* "el 17 de noviembre" o "del 26 de octubre al 17 de noviembre" (Periodos.TextoDias) */
  const textoDias = (inicio, fin) => inicio === fin ? 'el ' + R.textoDia(inicio) : 'del ' + R.textoDia(inicio) + ' al ' + R.textoDia(fin);

  window.V = { barra, descripcionCampana, estadoVenta, historial, opcionesMotor, textoOpcion, enFecha, cambios, actualizarCopia, graficaPorDia, graficaMotivos, agrupar, listaDias, textoDias };
})();
