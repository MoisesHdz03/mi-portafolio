/* Mi campaña, vista del coordinador (MiCampana.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'miCampana', titulo: 'Mi campaña', roles: ['Coordinador'] });
  if (!p) return;
  const e = C.e;
  const c = p.usuario.campanaId ? D.campana(p.usuario.campanaId) : null;
  if (!c) {
    p.contenido.innerHTML = C.marcar('MiCampana', '<h1>Mi campaña</h1><p>No tienes una campaña asignada. Pídele al administrador que te asigne una.</p>');
    return;
  }
  const activos = D.datos.usuarios.filter((u) => u.campanaId === c.id && u.activo);
  const supervisores = activos.filter((u) => u.rol === 'Supervisor').sort((a, b) => a.nombre.localeCompare(b.nombre));
  const agentes = activos.filter((u) => u.rol === 'Agente' || u.rol === 'Afiliado').sort((a, b) => a.nombre.localeCompare(b.nombre));
  const sinSupervisor = agentes.filter((a) => !a.supervisorId).length;
  const nombres = (ids, vacio) => ids.length ? ids.map((id) => (c.subcampanas.find((s) => s.id === id) || {}).nombre).filter(Boolean).join(', ') : vacio;
  let filtro = '';

  function tablaAgentes() {
    const lista = agentes.filter((a) => !filtro || (filtro === 'sin' ? !a.supervisorId : a.supervisorId === Number(filtro)));
    if (!lista.length) return '<p>No hay agentes que coincidan con el filtro.</p>';
    return '<table class="tabla"><thead><tr><th>Agente</th><th>Usuario</th><th>Supervisor</th><th>Subcampañas</th></tr></thead><tbody>' +
      lista.map((a) => '<tr><td>' + e(a.nombre) + '</td><td>' + e(a.usuario) + '</td><td>' + (a.supervisorId ? e(D.nombre(a.supervisorId)) : '<span class="etiqueta etiqueta-naranja">Sin supervisor</span>') + '</td>' +
        '<td>' + e(nombres(a.subcampanas, 'Toda la campaña')) + '</td></tr>').join('') + '</tbody></table>';
  }

  let h = '<h1>' + e(c.nombre) + (c.activa ? '' : ' <span class="etiqueta etiqueta-gris">Desactivada</span>') + '</h1><div class="resumen">' +
    '<div class="tarjeta"><span class="numero">' + supervisores.length + '</span><span>' + (supervisores.length === 1 ? 'supervisor' : 'supervisores') + '</span></div>' +
    '<div class="tarjeta"><span class="numero">' + agentes.length + '</span><span>' + (agentes.length === 1 ? 'agente' : 'agentes') + '</span></div>' +
    '<div class="tarjeta' + (sinSupervisor ? ' tarjeta-alerta' : '') + '"><span class="numero">' + sinSupervisor + '</span><span>sin supervisor</span></div></div>';
  if (c.subcampanas.length) h += '<h2>Subcampañas</h2><p>' + c.subcampanas.map((s) => '<span class="etiqueta ' + (s.activa ? 'etiqueta-azul' : 'etiqueta-gris') + '">' + e(s.nombre) + '</span>').join(' ') + '</p>';
  h += '<h2>Supervisores</h2>' + (supervisores.length ? '<table class="tabla"><thead><tr><th>Supervisor</th><th>Usuario</th><th>Subcampañas que supervisa</th><th>Agentes</th></tr></thead><tbody>' +
    supervisores.map((s) => '<tr><td>' + e(s.nombre) + '</td><td>' + e(s.usuario) + '</td><td>' + e(nombres(s.supervisa || [], 'Ninguna')) + '</td><td>' + agentes.filter((a) => a.supervisorId === s.id).length + '</td></tr>').join('') +
    '</tbody></table>' : '<p>Esta campaña no tiene supervisores activos.</p>');
  h += '<div class="encabezado-seccion"><h2>Agentes</h2><select id="filtro"><option value="">Todos los supervisores</option><option value="sin">Sin supervisor</option>' +
    supervisores.map((s) => '<option value="' + s.id + '">' + e(s.nombre) + '</option>').join('') + '</select></div><div id="agentes">' + tablaAgentes() + '</div>';
  p.contenido.innerHTML = C.marcar('MiCampana', h);
  document.getElementById('filtro').addEventListener('change', function (ev) {
    filtro = ev.target.value;
    document.getElementById('agentes').innerHTML = C.marcar('MiCampana', tablaAgentes());
  });
})();
