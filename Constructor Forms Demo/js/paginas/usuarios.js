/* Usuarios (Usuario.razor) — en la demo es de consulta */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'usuarios', titulo: 'Usuarios', roles: ['Administrador', 'Gerente'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const soloLectura = yo.rol !== 'Administrador';
  const ROLES = ['Administrador', 'Gerente', 'Coordinador', 'Supervisor', 'Agente', 'Afiliado', 'BackOffice', 'Supervisor BackOffice'];
  const f = { texto: '', rol: '', campana: '', estado: '' };

  function lista() {
    const t = f.texto.trim().toLowerCase();
    return D.datos.usuarios.filter((u) => (!t || u.nombre.toLowerCase().includes(t) || u.usuario.toLowerCase().includes(t)) &&
      (!f.rol || u.rol === f.rol) && (!f.campana || u.campanaId === Number(f.campana)) &&
      (!f.estado || (f.estado === 'activos' ? u.activo : !u.activo))).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  function tabla() {
    const usuarios = lista();
    if (!usuarios.length) return '<p>No hay usuarios que coincidan con los filtros.</p>';
    return '<table class="tabla"><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Campaña</th><th>Supervisor</th><th>Estado</th>' + (soloLectura ? '' : '<th>Acciones</th>') + '</tr></thead><tbody>' +
      usuarios.map(function (u) {
        const agentes = D.datos.usuarios.filter((x) => x.supervisorId === u.id && x.activo).length;
        return '<tr' + (u.activo ? '' : ' class="inactivo"') + '><td>' + e(u.nombre) + '</td><td>' + e(u.usuario) + '</td><td>' + e(u.rol) +
          (agentes ? ' <span class="detalle">(' + (agentes === 1 ? '1 agente' : agentes + ' agentes') + ')</span>' : '') + '</td>' +
          '<td>' + e(u.campanaId ? D.campana(u.campanaId).nombre : '—') + '</td><td>' + e(u.supervisorId ? D.nombre(u.supervisorId) : '—') + '</td>' +
          '<td>' + (u.activo ? '<span class="etiqueta etiqueta-verde">Activo</span>' : '<span class="etiqueta etiqueta-gris">Desactivado</span>') + '</td>' +
          (soloLectura ? '' : '<td class="acciones"><button data-demo>Editar</button><button data-demo>Restablecer contraseña</button>' +
            (u.id === yo.id ? '' : '<button data-demo>' + (u.activo ? 'Desactivar' : 'Activar') + '</button>') + '</td>') + '</tr>';
      }).join('') + '</tbody></table>';
  }

  const opcion = (v, t, actual) => '<option value="' + v + '"' + (String(v) === String(actual) ? ' selected' : '') + '>' + e(t) + '</option>';
  p.contenido.innerHTML = C.marcar('Usuario', '<div class="encabezado-pagina"><h1>Usuarios</h1>' + (soloLectura ? '' : '<button class="principal" data-demo>Nuevo usuario</button>') + '</div>' +
    '<div class="filtros"><input placeholder="Buscar por nombre o usuario" data-f="texto" />' +
    '<select data-f="rol">' + opcion('', 'Todos los roles') + ROLES.map((r) => opcion(r, r)).join('') + '</select>' +
    '<select data-f="campana">' + opcion('', 'Todas las campañas') + D.datos.campanas.map((c) => opcion(c.id, c.nombre)).join('') + '</select>' +
    '<select data-f="estado">' + opcion('', 'Activos e inactivos') + opcion('activos', 'Solo activos') + opcion('inactivos', 'Solo inactivos') + '</select></div>' +
    '<div id="tabla-usuarios">' + tabla() + '</div>');

  const refrescar = () => { document.getElementById('tabla-usuarios').innerHTML = C.marcar('Usuario', tabla()); };
  p.contenido.addEventListener('input', (ev) => { if (ev.target.dataset.f) { f[ev.target.dataset.f] = ev.target.value; refrescar(); } });
  p.contenido.addEventListener('click', (ev) => { if (ev.target.closest('[data-demo]')) C.soloConsulta(); });
})();
