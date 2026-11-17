/* ============================================================
   ESTRUCTURA COMÚN: menú lateral, tema y botones con "cargando"
   ============================================================ */
(function () {
    const raiz = document.documentElement;

    function guardar(clave, valor) {
        try {
            localStorage.setItem(clave, valor);
        } catch (error) {
            /* sin almacenamiento: sólo dura mientras la página esté abierta */
        }
    }

    // ---- Tema claro / oscuro ----
    const botonTema = document.getElementById('cambiarTema');
    if (botonTema) {
        botonTema.addEventListener('click', function () {
            const nuevo = raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
            raiz.setAttribute('data-tema', nuevo);
            guardar('calidad.tema', nuevo);
        });
    }

    // ---- Menú: contraer en escritorio ----
    const botonColapsar = document.getElementById('colapsarMenu');
    if (botonColapsar) {
        botonColapsar.addEventListener('click', function () {
            const cerrado = raiz.classList.toggle('sidebar-cerrado');
            guardar('calidad.menuCerrado', cerrado ? '1' : '0');
        });
    }

    // ---- Menú: abrir / cerrar en móvil ----
    const botonMenu = document.getElementById('abrirMenu');
    const capa = document.getElementById('capaOscura');

    function cerrarMenuMovil() {
        raiz.classList.remove('menu-abierto');
        if (botonMenu) {
            botonMenu.setAttribute('aria-expanded', 'false');
        }
    }

    if (botonMenu) {
        botonMenu.setAttribute('aria-expanded', 'false');
        botonMenu.addEventListener('click', function () {
            const abierto = raiz.classList.toggle('menu-abierto');
            botonMenu.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        });
    }
    if (capa) {
        capa.addEventListener('click', cerrarMenuMovil);
    }
    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            cerrarMenuMovil();
        }
    });

    // ---- Botón "cargando" al enviar un formulario ----
    document.querySelectorAll('form[data-cargando]').forEach(function (formulario) {
        formulario.addEventListener('submit', function () {
            const boton = formulario.querySelector('button[type="submit"]');
            if (boton) {
                boton.classList.add('cargando');
            }
        });
    });

    // Al volver con "Atrás" el navegador puede restaurar el botón girando
    window.addEventListener('pageshow', function () {
        document.querySelectorAll('.boton.cargando').forEach(function (boton) {
            boton.classList.remove('cargando');
        });
    });
})();
