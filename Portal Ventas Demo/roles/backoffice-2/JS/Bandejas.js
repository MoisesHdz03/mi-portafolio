document.addEventListener('DOMContentLoaded', function () {
    /* ============================================================
    TOGGLE DEL SIDEBAR
    ============================================================ */
    const body = document.querySelector('body');
    const sidebar = body.querySelector('.sidebar');
    const toggle = body.querySelector('.toggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Toggle normal (escritorio/tablet): colapsar a íconos
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('close');
        });
    }

    // Toggle móvil: abrir/cerrar el sidebar como cajón deslizable
    function abrirSidebarMovil() {
        sidebar.classList.add('mobile-open');
        sidebarOverlay.classList.add('visible');
    }

    function cerrarSidebarMovil() {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('visible');
    }

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            if (sidebar.classList.contains('mobile-open')) {
                cerrarSidebarMovil();
            } else {
                abrirSidebarMovil();
            }
        });

        // Cerrar el sidebar al tocar el fondo oscuro (overlay)
        sidebarOverlay.addEventListener('click', cerrarSidebarMovil);

        // Cerrar el sidebar automáticamente al elegir una opción del menú (en móvil)
        const navLinks = sidebar.querySelectorAll('.nav-link a, .bottom-content a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 640) {
                    cerrarSidebarMovil();
                }
            });
        });
    }

    /* ============================================================
       MODO OSCURO PERSISTENTE (localStorage)
       ============================================================ */
    const modeSwitch = body.querySelector('.toggle-switch');
    const modeText = body.querySelector('.mode-text');
    const DARK_MODE_KEY = 'bandejas_dark_mode';

    function aplicarModoOscuro(activar) {
        if (activar) {
            body.classList.add('dark');
            if (modeText) modeText.innerText = 'Modo claro';
        } else {
            body.classList.remove('dark');
            if (modeText) modeText.innerText = 'Modo oscuro';
        }
    }

    // Al cargar la página: leer preferencia guardada (si existe)
    const preferenciaGuardada = localStorage.getItem(DARK_MODE_KEY);
    if (preferenciaGuardada === 'true') {
        aplicarModoOscuro(true);
    } else if (preferenciaGuardada === 'false') {
        aplicarModoOscuro(false);
    }

    // Al hacer click en el switch: cambiar y guardar la nueva preferencia
    if (modeSwitch) {
        modeSwitch.addEventListener('click', () => {
            const activarOscuro = !body.classList.contains('dark');
            aplicarModoOscuro(activarOscuro);
            localStorage.setItem(DARK_MODE_KEY, activarOscuro ? 'true' : 'false');
        });
    }

    /* ============================================================
       RELOJ EN VIVO (fecha y hora)
       ============================================================ */
    const clockDate = document.getElementById('clockDate');
    const clockTime = document.getElementById('clockTime');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    function actualizarReloj() {
        if (!clockDate || !clockTime) return;

        const ahora = new Date();

        const diaSemana = diasSemana[ahora.getDay()];
        const dia = ahora.getDate();
        const mes = meses[ahora.getMonth()];

        clockDate.innerText = `${diaSemana}, ${dia} de ${mes}`;

        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const segundos = String(ahora.getSeconds()).padStart(2, '0');

        clockTime.innerText = `${horas}:${minutos}:${segundos}`;
    }

    if (clockDate && clockTime) {
        actualizarReloj();
        setInterval(actualizarReloj, 1000);
    }

    /* ============================================================
    AUTO-REFRESCO DE LA TABLA (vía AJAX, sin recargar la página)
    ============================================================ */
    const contenedorTabla = document.getElementById('contenedor-tabla');
    const REFRESH_INTERVAL = 60000; // 1 minuto

        function refrescarTabla() {
        if (!contenedorTabla) return;

        const endpoint = contenedorTabla.dataset.refreshUrl;
        if (!endpoint) return; // si la página no definió su endpoint, no hace nada

        const params = new URLSearchParams(window.location.search);
        const url = endpoint + '?' + params.toString();

        fetch(url)
            .then(response => {
                if (response.status === 403) {
                    window.location.href = '../../loginn/login.html';
                    return null;
                }
                return response.text();
            })
            .then(html => {
                if (html !== null) {
                    contenedorTabla.innerHTML = html;
                    console.log('✅ Tabla actualizada correctamente:', new Date().toLocaleTimeString());
                }
            })
            .catch(error => {
                console.error('Error al refrescar la tabla:', error);
            });
    }

    if (contenedorTabla) {
        setInterval(refrescarTabla, REFRESH_INTERVAL);
    }
});