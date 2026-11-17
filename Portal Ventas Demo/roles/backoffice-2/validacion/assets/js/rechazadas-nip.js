/* ============================================================
   BANDEJA "RECHAZADAS POR NIP"
   Menú lateral, modo oscuro y auto-refresco de la tabla.
   ============================================================ */
const INTERVALO_REFRESCO_NIP = 20000; // 20 segundos

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.toggle');
    const modeSwitch = document.querySelector('.toggle-switch');

    if (toggle && sidebar) {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            sidebar.classList.toggle('close');
        });
    }

    if (modeSwitch) {
        modeSwitch.addEventListener('click', function () {
            modeSwitch.classList.toggle('active');
            document.body.classList.toggle('dark');
        });
    }

    setInterval(recargarTablaNip, INTERVALO_REFRESCO_NIP);
});

/* Vuelve a pedir la tabla con los mismos filtros de la página */
function recargarTablaNip() {
    const contenedor = document.getElementById('contenedor-tabla');

    if (!contenedor) {
        return;
    }

    fetch(contenedor.dataset.refreshUrl + window.location.search, { cache: 'no-store' })
        .then(function (respuesta) {
            // Sesión vencida o sin permiso: ir al login
            if (respuesta.status === 401 || respuesta.status === 403) {
                window.location.href = '../../loginn/login.html';
                return null;
            }

            return respuesta.ok ? respuesta.text() : null;
        })
        .then(function (html) {
            if (html !== null) {
                contenedor.innerHTML = html;
            }
        })
        .catch(function (error) {
            console.error('No se pudo actualizar la tabla:', error);
        });
}
