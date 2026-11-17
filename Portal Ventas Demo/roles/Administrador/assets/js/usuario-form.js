/* ============================================================
   CREAR USUARIO (Users/NewUser.php)
   Mostrar u ocultar la contraseña y validación del formulario.
   (El menú lateral y el modo oscuro están en JS/admin.js)
   ============================================================ */
const LARGO_MINIMO_PASSWORD = 6;

document.addEventListener('DOMContentLoaded', function () {
    iniciarMostrarPassword();
    iniciarValidacion();
});

/* El ojo muestra u oculta la contraseña */
function iniciarMostrarPassword() {
    const boton = document.getElementById('togglePassword');
    const campo = document.getElementById('password');

    if (!boton || !campo) {
        return;
    }

    boton.addEventListener('click', function () {
        campo.type = campo.type === 'password' ? 'text' : 'password';

        const icono = boton.querySelector('i');
        icono.classList.toggle('fa-eye');
        icono.classList.toggle('fa-eye-slash');
    });
}

function iniciarValidacion() {
    const formulario = document.querySelector('form[data-validar-nuevo]');

    if (!formulario) {
        return;
    }

    formulario.addEventListener('submit', function (evento) {
        const valor = (id) => document.getElementById(id).value.trim();

        if (!valor('Nombre') || !valor('usuario') || !valor('password') || !valor('role') || !valor('Estatus')) {
            evento.preventDefault();
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        if (valor('password').length < LARGO_MINIMO_PASSWORD) {
            evento.preventDefault();
            alert('La contraseña debe tener al menos ' + LARGO_MINIMO_PASSWORD + ' caracteres.');
        }
    });
}
