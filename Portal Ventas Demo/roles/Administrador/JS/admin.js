/* ============================================================
   MENÚ LATERAL DEL DISEÑO "DASHBOARD" (Ver Ventas)
   - En pantallas chicas el menú se abre encima del contenido.
   - En pantallas grandes se oculta y el contenido se expande.
   ============================================================ */
const ANCHO_MOVIL = 1024;

function elementosMenu() {
    return {
        sidebar: document.getElementById('sidebar'),
        contenido: document.getElementById('mainContent'),
        botonMenu: document.querySelector('.menu-toggle'),
    };
}

/* Botón de las tres rayas */
function toggleSidebar() {
    const { sidebar, contenido } = elementosMenu();

    if (window.innerWidth <= ANCHO_MOVIL) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('closed');
        contenido.classList.toggle('expanded');
    }
}

/* ============================================================
   MODO OSCURO
   - Se guarda en localStorage ('darkMode') y se aplica al cargar
     en JS/tema-inicial.js.
   - Al cambiarlo, el tema nuevo crece en círculo desde el botón hasta
     cubrir la pantalla (View Transitions), igual que en Gerencia y
     Supervisor. Sin esa función, los colores se desvanecen.
   ============================================================ */
const DURACION_CAMBIO_TEMA = 650;

// Tema elegido; se actualiza al momento del clic (aunque la animación siga en curso)
let temaOscuro = false;

function actualizarBotonTema(boton, oscuro) {
    boton.querySelector('i').className = oscuro ? 'fas fa-sun' : 'fas fa-moon';
    boton.querySelector('span').textContent = oscuro ? 'Modo Claro' : 'Modo Oscuro';
    boton.setAttribute('aria-pressed', oscuro ? 'true' : 'false');
}

function cambiarTema(boton) {
    temaOscuro = !temaOscuro;

    try {
        localStorage.setItem('darkMode', temaOscuro ? 'true' : 'false');
    } catch (error) {
        /* sin almacenamiento: dura sólo mientras la página esté abierta */
    }

    // Siempre aplica la última elección, aunque se hayan dado varios clics seguidos
    const aplicar = function () {
        document.body.classList.toggle('dark-mode', temaOscuro);
        document.documentElement.setAttribute('data-bs-theme', temaOscuro ? 'dark' : 'light');
        actualizarBotonTema(boton, temaOscuro);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        aplicar();
        return;
    }

    if (!document.startViewTransition) {
        document.documentElement.classList.add('tema-en-transicion');
        aplicar();
        setTimeout(function () {
            document.documentElement.classList.remove('tema-en-transicion');
        }, DURACION_CAMBIO_TEMA);
        return;
    }

    // Círculo que crece desde el botón hasta la esquina más lejana
    const caja = boton.getBoundingClientRect();
    const x = caja.left + caja.width / 2;
    const y = caja.top + caja.height / 2;
    const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transicion = document.startViewTransition(aplicar);

    transicion.ready.then(function () {
        document.documentElement.animate(
            { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radio + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: DURACION_CAMBIO_TEMA, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
    }).catch(function () {
        /* El navegador canceló la animación (p. ej. pestaña oculta): el tema ya se aplicó */
    });
    transicion.finished.catch(function () {});
    transicion.updateCallbackDone.catch(function () {});
}

document.addEventListener('DOMContentLoaded', function () {
    const botonTema = document.querySelector('.theme-toggle');

    if (!botonTema) {
        return;
    }

    temaOscuro = document.body.classList.contains('dark-mode');
    actualizarBotonTema(botonTema, temaOscuro);
    botonTema.addEventListener('click', function () { cambiarTema(botonTema); });
});

/* Al cambiar el tamaño de la ventana se ajusta el menú */
window.addEventListener('resize', function () {
    const { sidebar, contenido } = elementosMenu();

    if (window.innerWidth > ANCHO_MOVIL) {
        sidebar.classList.remove('open');

        if (!sidebar.classList.contains('closed')) {
            contenido.classList.remove('expanded');
        }
    } else {
        sidebar.classList.remove('closed');
        contenido.classList.add('expanded');
    }
});

/* En pantallas chicas, un clic fuera del menú lo cierra */
document.addEventListener('click', function (evento) {
    const { sidebar, botonMenu } = elementosMenu();

    if (window.innerWidth <= ANCHO_MOVIL
        && sidebar.classList.contains('open')
        && !sidebar.contains(evento.target)
        && !botonMenu.contains(evento.target)) {
        sidebar.classList.remove('open');
    }
});
