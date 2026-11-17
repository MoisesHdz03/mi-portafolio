/* ============================================================
   TEMA (claro / oscuro) y estado del menú
   Se carga en el <head> para aplicarlos antes de pintar la página.
   Si el usuario no ha elegido tema, se usa el del sistema.
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

    const temaGuardado = leer('calidad.tema');
    const sistemaOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    raiz.setAttribute('data-tema', temaGuardado || (sistemaOscuro ? 'oscuro' : 'claro'));

    if (leer('calidad.menuCerrado') === '1') {
        raiz.classList.add('sidebar-cerrado');
    }
})();
