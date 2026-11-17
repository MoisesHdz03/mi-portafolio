/* Bitácora (Bitacora.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'bitacora', titulo: 'Bitácora', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const POR_PAGINA = 25;
  const f = { desde: '', hasta: '', usuario: '', accion: '', entidad: '' };
  const abiertos = new Set();
  let pagina = 1;

  const unicos = (k) => [...new Set(D.datos.bitacora.map((b) => b[k]))].sort((a, b) => a.localeCompare(b));
  const opcion = (v, t) => '<option value="' + e(v) + '">' + e(t) + '</option>';

  function resultados() {
    const total = D.datos.bitacora.filter(function (b) {
      const d = C.fechas.dia(b.fecha);
      return (!f.desde || d >= f.desde) && (!f.hasta || d <= f.hasta) && (!f.usuario || b.usuarioId === Number(f.usuario)) &&
        (!f.accion || b.accion === f.accion) && (!f.entidad || b.entidad === f.entidad);
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    let h = '';
    if (f.desde && f.hasta && f.desde > f.hasta) h += '<p class="advertencia">La fecha "Desde" es posterior a "Hasta", así que no habrá resultados.</p>';
    if (!total.length) return h + '<p>No hay registros con estos filtros.</p>';
    const paginas = Math.max(1, Math.ceil(total.length / POR_PAGINA));
    pagina = Math.min(pagina, paginas);
    h += '<p class="detalle">' + C.numero(total.length) + ' ' + (total.length === 1 ? 'registro' : 'registros') + '. Fechas en hora de la Ciudad de México.</p>' +
      '<table class="tabla"><thead><tr><th>Fecha</th><th>Quién</th><th>Acción</th><th>Tipo</th><th>Afectado</th><th></th></tr></thead><tbody>';
    total.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).forEach(function (b) {
      const abierto = abiertos.has(b.id);
      h += '<tr><td class="fecha">' + C.fechas.fechaHora(b.fecha) + '</td><td>' + e(b.usuarioId ? D.nombre(b.usuarioId) : 'Sistema') + '</td><td>' + e(b.accion) + '</td><td>' + e(b.entidad) + '</td>' +
        '<td>' + e(b.nombre || '—') + '</td><td>' + (b.cambios.length ? '<button data-detalle="' + b.id + '">' + (abierto ? 'Ocultar' : 'Ver detalle') + '</button>' : '') + '</td></tr>';
      if (b.cambios.length && abierto) {
        const hayCambios = b.cambios.some((x) => x.antes != null);
        h += '<tr class="fila-detalle"><td colspan="6"><table class="cambios"><thead><tr><th>Campo</th>' + (hayCambios ? '<th>Antes</th><th>Después</th>' : '<th>Valor</th>') + '</tr></thead><tbody>' +
          b.cambios.map((x) => '<tr' + (x.antes != null ? ' class="cambio"' : '') + '><td class="campo">' + e(x.campo) + '</td>' + (hayCambios ? '<td class="antes">' + e(x.antes == null ? '—' : x.antes) + '</td>' : '') +
            '<td class="despues">' + e(x.despues == null ? '—' : x.despues) + '</td></tr>').join('') + '</tbody></table>' +
          '<details class="original"><summary>Ver datos originales</summary><pre>' + e(JSON.stringify(b.cambios.reduce(function (o, x) { o.Antes[x.campo] = x.antes; o.Despues[x.campo] = x.despues; return o; }, { Antes: {}, Despues: {} }), null, 2)) + '</pre></details></td></tr>';
      }
    });
    h += '</tbody></table><div class="paginacion"><button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>Página ' + pagina + ' de ' + paginas + '</span>' +
      '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button></div>';
    return h;
  }

  const usuarios = [...new Set(D.datos.bitacora.map((b) => b.usuarioId))].map(D.usuario).sort((a, b) => a.nombre.localeCompare(b.nombre));
  p.contenido.innerHTML = C.marcar('Bitacora', '<h1>Bitácora</h1><div class="filtros">' +
    '<label>Desde <input type="date" data-f="desde" /></label><label>Hasta <input type="date" data-f="hasta" /></label>' +
    '<label>Usuario <select data-f="usuario">' + opcion('', 'Todos') + usuarios.map((u) => opcion(u.id, u.nombre)).join('') + '</select></label>' +
    '<label>Acción <select data-f="accion">' + opcion('', 'Todas') + unicos('accion').map((a) => opcion(a, a)).join('') + '</select></label>' +
    '<label>Tipo <select data-f="entidad">' + opcion('', 'Todos') + unicos('entidad').map((a) => opcion(a, a)).join('') + '</select></label></div>' +
    '<div id="resultados">' + resultados() + '</div>');

  const refrescar = () => { document.getElementById('resultados').innerHTML = C.marcar('Bitacora', resultados()); };
  p.contenido.addEventListener('change', (ev) => { if (ev.target.dataset.f) { f[ev.target.dataset.f] = ev.target.value; pagina = 1; refrescar(); } });
  p.contenido.addEventListener('click', function (ev) {
    const d = ev.target.closest('[data-detalle]');
    const pag = ev.target.closest('[data-pag]');
    if (d) { const id = Number(d.dataset.detalle); if (abiertos.has(id)) abiertos.delete(id); else abiertos.add(id); refrescar(); }
    else if (pag) { pagina = Number(pag.dataset.pag); refrescar(); }
  });
})();
