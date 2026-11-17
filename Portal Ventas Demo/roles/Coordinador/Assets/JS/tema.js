/* ============================================================
   TEMA (claro / oscuro) y estado del menú lateral
   Se carga en el <head> para aplicarlos antes de pintar la página.
   Si el usuario no ha elegido tema, se usa el del sistema.
   data-bs-theme hace que Bootstrap (ventanas, campos) siga el mismo tema.
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

    const temaGuardado = leer('coordinador.tema');
    const sistemaOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const tema = temaGuardado || (sistemaOscuro ? 'oscuro' : 'claro');

    raiz.setAttribute('data-tema', tema);
    raiz.setAttribute('data-bs-theme', tema === 'oscuro' ? 'dark' : 'light');

    if (leer('coordinador.menuCerrado') === '1') {
        raiz.classList.add('sidebar-cerrado');
    }
})();
