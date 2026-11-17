/* Inicio de sesión (Login.razor con LayoutCuenta) + accesos de demostración por rol */
(function () {
  'use strict';
  if (D.sesion() && D.usuario(D.sesion().id)) { location.replace('inicio.html'); return; }

  const ACCESOS = [
    ['admin.demo', 'Administrador', 'Todo: campañas, usuarios, formularios'],
    ['gerente.demo', 'Gerente', 'Consulta y descarga'],
    ['coordinador.demo', 'Coordinador', 'Su campaña completa'],
    ['supervisor.demo', 'Supervisor', 'Su equipo y correcciones'],
    ['agente.demo', 'Agente', 'Captura y metas'],
    ['afiliado.demo', 'Afiliado', 'Captura con NIP'],
    ['backoffice.demo', 'BackOffice', 'Bandejas de validación y cobro'],
    ['supbackoffice.demo', 'Supervisor BackOffice', 'Panel y Consultar NIP'],
  ];

  const ahora = new Date();
  const html =
    '<div class="acceso">' +
    '<section class="presentacion" aria-label="Qué es Constructor Forms">' +
    '<span class="burbuja burbuja-1" aria-hidden="true"></span><span class="burbuja burbuja-2" aria-hidden="true"></span><span class="burbuja burbuja-3" aria-hidden="true"></span>' +
    '<div class="marca-acceso aparece" style="--orden: 0"><span class="marca-icono" aria-hidden="true">CF</span>Constructor Forms</div>' +
    '<div class="reloj aparece" style="--orden: 1"><p class="saludo"><span data-saludo>Hola</span> <span class="mano" aria-hidden="true">👋</span></p>' +
    '<p class="hora" data-reloj-hora>' + C.fechas.hora(ahora) + '</p><p class="fecha" data-reloj-fecha></p></div>' +
    '<div class="texto aparece" style="--orden: 2"><h2>Cada captura, de principio a fin, en un solo lugar.</h2>' +
    '<p>Los agentes capturan, BackOffice valida y cobra, y supervisores, coordinadores y gerentes siguen las metas y estadísticas al momento.</p></div>' +
    '<p class="rotador aparece" style="--orden: 3">Hoy toca <span class="palabras" aria-hidden="true"><span>capturar</span><span>validar</span><span>cobrar</span><span>cumplir la meta</span><span>capturar</span></span>' +
    '<span class="lectores">capturar, validar, cobrar y cumplir la meta</span></p>' +
    '</section>' +
    '<main class="lado-formulario">' +
    '<button type="button" class="boton-tema-acceso" data-accion="tema" title="Cambiar entre automático, claro y oscuro">' + C.icono('tema') + '<span data-texto-tema>Automático</span></button>' +
    '<div class="tarjeta-acceso aparece" style="--orden: 1">' +
    '<h1>Iniciar sesión</h1><p class="detalle">Entra con el usuario que te dio tu administrador.</p>' +
    '<p class="caja-error" role="alert" id="error-login" hidden></p>' +
    '<form id="form-login" novalidate>' +
    '<div class="campo-acceso"><label for="usuario">Usuario</label><input id="usuario" autocomplete="username" placeholder="tu.usuario" /></div>' +
    '<div class="campo-acceso"><label for="contrasena">Contraseña</label><input id="contrasena" type="password" autocomplete="current-password" placeholder="••••••••" /></div>' +
    '<button type="submit" class="principal enviar-acceso">Entrar <span class="flecha" aria-hidden="true">→</span></button>' +
    '</form>' +
    '{{hijo:0}}' +
    '</div>' +
    '<p class="pie-acceso">Constructor Forms · Hora de la Ciudad de México</p>' +
    '</main></div>';

  // Los accesos de la demo no son del sistema: van sin el identificador del Login (los estiliza demo.css)
  const accesos = '<div class="demo-accesos"><h2>Accesos de demostración</h2><div class="demo-accesos-lista">' +
    ACCESOS.map(([u, rol, detalle]) => '<button type="button" data-usuario="' + u + '">' + C.e(rol) + '<small>' + C.e(detalle) + '</small></button>').join('') +
    '</div><p>Contraseña de todos: <b>Demo1234</b>. Todos los datos son ficticios.</p></div>';

  document.body.insertAdjacentHTML('afterbegin', C.marcar('Login', html, [accesos]));
  if (window.constructorTema) window.constructorTema.aplicar();

  const usuario = document.getElementById('usuario');
  const contrasena = document.getElementById('contrasena');
  const error = document.getElementById('error-login');

  document.querySelectorAll('[data-usuario]').forEach((b) => b.addEventListener('click', function () {
    usuario.value = b.dataset.usuario;
    contrasena.value = 'Demo1234';
    error.hidden = true;
    document.getElementById('form-login').requestSubmit();
  }));

  document.getElementById('form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    const u = D.datos.usuarios.find((x) => x.usuario.toLowerCase() === usuario.value.trim().toLowerCase());
    if (!usuario.value.trim() || !contrasena.value) {
      error.textContent = 'Escribe tu usuario y tu contraseña.';
      error.hidden = false;
      return;
    }
    if (!u || contrasena.value !== 'Demo1234') {
      error.textContent = 'Usuario o contraseña incorrectos.';
      error.hidden = false;
      return;
    }
    if (!u.activo) {
      error.textContent = 'Tu usuario está desactivado. Habla con tu administrador.';
      error.hidden = false;
      return;
    }
    u.ultimoAcceso = new Date().toISOString();
    D.guardar();
    D.iniciarSesion(u.id);
    location.href = u.rol === 'Agente' || u.rol === 'Afiliado' ? 'captura-inicio.html' : 'inicio.html';
  });
})();
