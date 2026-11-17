/* Mis agentes (MisAgentes.razor + ModalEditarAgente.razor) */
(function () {
  'use strict';
  const p = Layout.iniciar({ pagina: 'misAgentes', titulo: 'Mis agentes', roles: ['Supervisor'] });
  if (!p) return;
  const e = C.e;
  const yo = p.usuario;
  const campana = D.campana(yo.campanaId);
  const supervisadas = campana.subcampanas.filter((s) => (yo.supervisa || []).includes(s.id));

  const agentes = () => D.datos.usuarios.filter((u) => u.supervisorId === yo.id && u.activo && (u.rol === 'Agente' || u.rol === 'Afiliado'))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const nombres = (ids) => ids.map((id) => campana.subcampanas.find((s) => s.id === id)).filter(Boolean).map((s) => s.nombre);
  const nombresSubcampanas = (a) => a.subcampanas.length ? nombres(a.subcampanas.filter((id) => supervisadas.some((s) => s.id === id))).join(', ') : 'Toda la campaña';

  function dibujar() {
    const lista = agentes();
    let h = '<h1>Mis agentes</h1>';
    if (!lista.length) h += '<p>No tienes agentes a tu cargo. El administrador te los asigna desde la pantalla de usuarios.</p>';
    else {
      h += '<table class="tabla"><thead><tr><th>Agente</th><th>Usuario</th><th>Subcampañas</th><th></th></tr></thead><tbody>' +
        lista.map((a) => '<tr><td>' + e(a.nombre) + '</td><td>' + e(a.usuario) + '</td><td>' + e(nombresSubcampanas(a)) + '</td><td><button data-editar="' + a.id + '">Editar</button></td></tr>').join('') +
        '</tbody></table><p class="detalle">Las metas de tus agentes se ponen por periodo en <a href="metas.html">Metas</a>.</p>';
    }
    p.contenido.innerHTML = C.marcar('MisAgentes', h);
  }

  function editar(agente) {
    let cuerpo = '';
    if (supervisadas.length) {
      cuerpo = '<fieldset><legend>Subcampañas</legend>' + supervisadas.map((s) => '<label class="casilla"><input type="checkbox" value="' + s.id + '"' + (agente.subcampanas.includes(s.id) ? ' checked' : '') + ' /> ' +
        e(s.nombre) + (s.activa ? '' : ' <span class="detalle">(desactivada)</span>') + '</label>').join('') +
        '<small>Si no eliges ninguna, el agente verá los formularios de toda la campaña.</small></fieldset>';
    }
    C.modal({
      componente: 'ModalEditarAgente', titulo: agente.nombre, cuerpo,
      botones: [{ texto: 'Cancelar' }, { texto: 'Guardar', clase: 'principal', accion: function (cerrar, capa) {
        const nuevas = [...capa.querySelectorAll('input[type="checkbox"]:checked')].map((x) => Number(x.value)).sort();
        const antes = nombres(agente.subcampanas).join(', ') || 'Toda la campaña';
        const despues = nombres(nuevas).join(', ') || 'Toda la campaña';
        agente.subcampanas = nuevas;
        if (antes !== despues) D.registrar(yo.id, 'Editar', 'Usuario', agente.nombre, [{ campo: 'Subcampañas', antes, despues }]);
        D.guardar();
        C.avisar('Se actualizó a ' + agente.nombre + '.');
        dibujar();
      } }],
    });
  }

  p.contenido.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-editar]');
    if (b) editar(D.usuario(Number(b.dataset.editar)));
  });
  dibujar();
})();
