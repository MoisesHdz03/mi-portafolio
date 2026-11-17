/* ============================================================
   TEMA (claro / oscuro) y estado del menú lateral
   Se carga en el <head> para aplicarlos antes de pintar la página
   (sin destello blanco). Si no se ha elegido tema, se usa el del sistema.
   ============================================================ */
(function () {
    const raiz = document.documentElement;

    function leer(clave) {
        try {
            return localStorage.getItem(clave);
        } catch (error) {
            return null;
        }
    }

    const guardado = leer('supervisor.tema');
    const sistemaOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    raiz.setAttribute('data-tema', guardado || (sistemaOscuro ? 'oscuro' : 'claro'));

    if (leer('supervisor.menuCerrado') === '1') {
        raiz.classList.add('sidebar-cerrado');
    }
})();
