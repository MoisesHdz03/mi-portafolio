/* ============================================================
   INICIO DE SESIÓN DE LA DEMO
   Se elige un perfil; "Ingresar" abre su página principal.
   (No hay servidor: usuario y contraseña son de ejemplo.)
   ============================================================ */
(function () {
  'use strict';

  const PERFILES = [
    ['admin', 'Administrador'],
    ['gerencia', 'Gerencia'],
    ['supervisor', 'Supervisor'],
    ['coordinador', 'Coordinador'],
    ['calidad', 'Calidad'],
    ['backoffice', 'Backoffice (Validación, Backoffice y Cobrador)'],
    ['agente', 'Agente de ventas'],
    ['comisionista', 'Comisionista'],
    ['analista', 'Analista'],
  ];
  const disponibles = (window.DEMO && window.DEMO.perfiles) || {};

  document.addEventListener('DOMContentLoaded', function () {
    const lista = document.getElementById('perfilDemo');
    const usuario = document.getElementById('usuario');
    const password = document.getElementById('password');
    const formulario = document.getElementById('formDemo');

    PERFILES.forEach(function ([clave, texto]) {
      if (!disponibles[clave]) return;
      const opcion = document.createElement('option');
      opcion.value = clave;
      opcion.textContent = texto;
      lista.appendChild(opcion);
    });

    function llenar() {
      const perfil = disponibles[lista.value];
      usuario.value = perfil ? perfil.usuario : '';
      password.value = 'demo1234';
    }

    // Si se escribe un usuario de la demo, se elige su perfil
    usuario.addEventListener('change', function () {
      const encontrado = Object.keys(disponibles).find(function (k) {
        return disponibles[k].usuario.toLowerCase() === usuario.value.trim().toLowerCase();
      });
      if (encontrado) lista.value = encontrado;
    });

    lista.addEventListener('change', llenar);
    llenar();

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      const perfil = disponibles[lista.value];
      if (!perfil) return;
      const boton = document.getElementById('enviar');
      boton.value = 'Ingresando...';
      boton.disabled = true;
      setTimeout(function () { window.location.href = perfil.pagina; }, 350);
    });
  });
})();
