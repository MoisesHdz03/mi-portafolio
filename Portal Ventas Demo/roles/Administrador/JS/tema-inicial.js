/* ============================================================
   MODO OSCURO GUARDADO
   Se carga al inicio del <body> (partials/sidebar/dashboard.php)
   para que la página no aparezca clara un instante antes de
   oscurecerse. El botón para cambiarlo está en JS/admin.js.
   data-bs-theme hace que la ventana de Bootstrap siga el mismo tema.
   ============================================================ */
(function () {
    try {
        // 'true' lo guarda el diseño nuevo; 'enabled', los menús clásicos
        const guardado = localStorage.getItem('darkMode');

        if (guardado === 'true' || guardado === 'enabled') {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        }
    } catch (error) {
        /* sin almacenamiento: se queda en modo claro */
    }
})();
