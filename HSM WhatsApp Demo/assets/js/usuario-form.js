/* ============================================================
   Crear / editar usuario (create_user.html y edit_user.html)
   En edit_user.html la contraseña es opcional (vacía = se conserva),
   igual que update_user.php.
   ============================================================ */
(function () {
  'use strict';
  const sesion = App.iniciar('users', { soloFull: true });
  if (!sesion) return;

  const editar = document.body.dataset.modo === 'editar';
  const datos = HSM.datos();
  const usuario = editar ? HSM.usuario(App.param('id')) : null;
  const campo = (id) => document.getElementById(id);
  const error = campo('error');

  if (editar) {
    if (!usuario) {
      document.querySelector('.main-content').insertAdjacentHTML('beforeend', '<div class="alerta-error mt-3">Usuario no encontrado</div>');
      campo('formUsuario').hidden = true;
      return;
    }
    campo('name').value = usuario.name;
    campo('username').value = usuario.username;
    campo('role').value = usuario.role;
    campo('password').required = false;
    campo('ayudaPassword').hidden = false;
    campo('subtitulo').textContent = 'Usuario #' + usuario.id + ' · ' + usuario.username;
  }

  campo('formUsuario').addEventListener('submit', function (ev) {
    ev.preventDefault();
    error.hidden = true;
    if (!this.reportValidity()) return;

    const nombre = campo('name').value.trim();
    const nombreUsuario = campo('username').value.trim();
    const password = campo('password').value.trim();
    const rol = campo('role').value;

    const repetido = datos.usuarios.find((u) => u.username.toLowerCase() === nombreUsuario.toLowerCase() && (!usuario || u.id !== usuario.id));
    if (repetido) {
      error.textContent = 'El usuario "' + nombreUsuario + '" ya existe.';
      error.hidden = false;
      return;
    }

    if (editar) {
      usuario.name = nombre;
      usuario.username = nombreUsuario;
      usuario.role = rol;
      if (password !== '') usuario.password = password;
      if (usuario.id === sesion.id) HSM.iniciarSesion(usuario);
      App.avisarDespues('Se actualizó el usuario <b>' + App.e(nombreUsuario) + '</b>.');
    } else {
      datos.usuarios.push({
        id: datos.siguiente.usuario++, name: nombre, username: nombreUsuario, password: password, role: rol,
        status: 1, last_login: null, created_at: HSM.fechaSql(new Date()),
      });
      App.avisarDespues('Se creó el usuario <b>' + App.e(nombreUsuario) + '</b>. Ya puede iniciar sesión.');
    }
    HSM.guardar();
    location.href = 'users.html';
  });
})();
