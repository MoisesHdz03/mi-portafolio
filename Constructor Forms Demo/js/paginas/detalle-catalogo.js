/* Detalle de un catálogo (DetalleCatalogo.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'catalogos', titulo: 'Catálogo', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const admin = p.usuario.rol === 'Administrador';
  const cat = D.datos.catalogos.find((c) => c.id === Number(C.param('id')));
  if (!cat) {
    p.contenido.innerHTML = C.marcar('DetalleCatalogo', '<p class="migas"><a href="catalogos.html">Catálogos</a> / ...</p><p>El catálogo no existe.</p>');
    return;
  }
  document.title = cat.nombre + ' - Constructor Forms';
  const POR_PAGINA = 25;
  const TIPOS = { Texto: 'Texto', Numero: 'Número', Fecha: 'Fecha' };
  const actualizado = (function () { const b = D.datos.bitacora.filter((x) => x.accion === 'Cargar Excel').pop(); return b ? b.fecha : new Date().toISOString(); })();
  const activo = cat.activo !== false;
  const clave = cat.columnas.find((c) => c.esClave);
  let busqueda = '';
  let inactivos = false;
  let pagina = 1;

  const mostrar = (col, v) => v == null || v === '' ? '' : col.tipo === 'Numero' ? Number(v).toLocaleString('es-MX') : col.tipo === 'Fecha' ? v.split('-').reverse().join('/') : String(v);

  function registros() {
    const t = busqueda.trim().toLowerCase();
    const lista = cat.registros.filter((r) => (inactivos || r.activo) && (!t || Object.values(r.valores).some((v) => String(v).toLowerCase().includes(t))));
    if (!lista.length) return '<p>' + (t ? 'No hay registros que coincidan.' : 'El catálogo todavía no tiene registros. Carga un Excel para agregarlos.') + '</p>';
    const visibles = cat.columnas.filter((c) => c.activa);
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    pagina = Math.min(pagina, paginas);
    return '<p class="detalle">' + C.numero(lista.length) + ' ' + (lista.length === 1 ? 'registro' : 'registros') + '.</p><div class="desplazable"><table class="tabla"><thead><tr>' +
      visibles.map((c) => '<th>' + e(c.titulo) + '</th>').join('') + (inactivos ? '<th>Estado</th>' : '') + '<th>Actualizado</th></tr></thead><tbody>' +
      lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((r) => '<tr' + (r.activo ? '' : ' class="inactiva"') + '>' +
        visibles.map((c) => '<td' + (c.tipo === 'Numero' ? ' class="numero"' : '') + '>' + e(mostrar(c, r.valores[c.clave])) + '</td>').join('') +
        (inactivos ? '<td>' + (r.activo ? 'Activo' : 'Desactivado') + '</td>' : '') + '<td class="fecha">' + C.fechas.fechaHora(actualizado) + '</td></tr>').join('') +
      '</tbody></table></div><div class="paginacion"><button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>Página ' + pagina + ' de ' + paginas + '</span>' +
      '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button></div>';
  }

  let h = '<p class="migas"><a href="catalogos.html">Catálogos</a> / ' + e(cat.nombre) + '</p>' +
    '<div class="encabezado-pagina"><div><h1>' + e(cat.nombre) + ' <span class="etiqueta ' + (activo ? 'etiqueta-verde' : 'etiqueta-gris') + '">' + (activo ? 'Activo' : 'Desactivado') + '</span></h1>' +
    '<p class="detalle">Campaña: ' + e(D.campana(cat.campanaId).nombre) + '</p></div><div class="acciones">' +
    (admin ? '<button data-demo>Renombrar</button><button data-demo>' + (activo ? 'Desactivar' : 'Activar') + '</button>' : '') +
    '<button class="principal" id="descargar">Descargar Excel</button></div></div>' +
    '<section class="seccion"><h2>Columnas</h2><table class="tabla"><thead><tr><th>Título</th><th>Tipo</th><th>Clave interna</th><th>Uso</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' +
    cat.columnas.map((c) => '<tr' + (c.activa ? '' : ' class="inactiva"') + '><td>' + e(c.titulo) + '</td><td>' + TIPOS[c.tipo] + '</td><td><code>' + e(c.clave) + '</code></td><td>' +
      (c.esClave ? '<span class="etiqueta etiqueta-azul">Clave</span>' : '') + (c.esDescripcion ? '<span class="etiqueta etiqueta-azul">Descripción</span>' : '') + '</td>' +
      '<td>' + (c.activa ? 'Activa' : 'Desactivada') + '</td><td class="acciones">' +
      (admin ? '<button data-demo>Renombrar</button>' + (!c.esClave && !c.esDescripcion ? '<button data-demo>' + (c.activa ? 'Desactivar' : 'Activar') + '</button>' : '') +
        (c.activa && !c.esClave && !c.esDescripcion && c.tipo === 'Texto' ? '<button data-demo>Usar como descripción</button>' : '') + (c.esDescripcion ? '<button data-demo>Quitar descripción</button>' : '') : '') +
      '</td></tr>').join('') + '</tbody></table>';
  if (admin) {
    h += '<div class="en-linea agregar"><input maxlength="100" placeholder="Título de la nueva columna" /><select><option>Texto</option><option>Número</option><option>Fecha</option></select><button data-demo>+ Agregar columna</button></div>' +
      '<p class="detalle">El tipo de una columna no se puede cambiar después. Las columnas no se borran: se desactivan y conservan sus datos.</p></section>' +
      '<section class="seccion"><h2>Cargar Excel</h2><p class="detalle">El Excel debe traer en la primera fila los títulos de las columnas activas. Los registros se emparejan por <strong>' + e(clave.titulo) +
      '</strong>: los que ya existen se actualizan, los nuevos se agregan y los que no vengan se desactivan. Antes de aplicar verás un resumen. Usa "Descargar Excel" para obtener el formato con los datos actuales.</p>' +
      '<label class="boton-archivo" data-demo>Elegir Excel</label>';
  }
  h += '</section><section class="seccion"><h2>Registros</h2><div class="en-linea filtros"><input type="search" id="buscar" placeholder="Buscar por clave o por cualquier dato" />' +
    '<label class="casilla"><input type="checkbox" id="inactivos" /> Mostrar desactivados</label></div><div id="registros">' + registros() + '</div></section>';
  p.contenido.innerHTML = C.marcar('DetalleCatalogo', h);

  const refrescar = () => { document.getElementById('registros').innerHTML = C.marcar('DetalleCatalogo', registros()); };
  p.contenido.addEventListener('input', function (ev) {
    if (ev.target.id === 'buscar') { busqueda = ev.target.value; pagina = 1; refrescar(); }
    if (ev.target.id === 'inactivos') { inactivos = ev.target.checked; pagina = 1; refrescar(); }
  });
  p.contenido.addEventListener('click', function (ev) {
    const pag = ev.target.closest('[data-pag]');
    if (pag) { pagina = Number(pag.dataset.pag); refrescar(); }
    else if (ev.target.closest('[data-demo]')) { ev.preventDefault(); C.soloConsulta(); }
    else if (ev.target.id === 'descargar') {
      const columnas = cat.columnas.filter((c) => c.activa);
      C.descargarCsv(cat.clave + '.csv', [columnas.map((c) => c.titulo)].concat(cat.registros.filter((r) => r.activo).map((r) => columnas.map((c) => r.valores[c.clave]))));
      C.avisar('En la demo se descarga como CSV (la app real genera un Excel).');
    }
  });
})();
