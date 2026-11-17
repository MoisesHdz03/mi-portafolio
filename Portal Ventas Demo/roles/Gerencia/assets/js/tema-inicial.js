/* ============================================================
   MODO OSCURO GUARDADO
   Se carga al inicio del <body> (partials/sidebar/dashboard.php)
   para que la página no aparezca blanca un instante antes de
   oscurecerse. El botón para cambiarlo está en assets/js/dashboard.js.
   ============================================================ */
(function () {
    try {
        // 'true' lo guarda el diseño nuevo; 'enabled', el menú clásico (reportes)
        const guardado = localStorage.getItem('darkMode');

        if (guardado === 'true' || guardado === 'enabled') {
            document.body.classList.add('dark-mode');
        }
    } catch (error) {
        /* sin almacenamiento: se queda en modo claro */
    }
})();
