/**
 * theme-switcher.js
 * Selector de paleta de colores para los formularios del Portal Ventas.
 *
 * Este script es independiente de FormValidacion.js y de otp.js:
 * solo lee/escribe localStorage y cambia el atributo [data-theme] de
 * <html>. No lee, valida ni modifica ningún campo del formulario.
 */
(function () {
    var STORAGE_KEY = 'mc_portal_theme';
    var DEFAULT_THEME = 'menta';

    var switcher = document.getElementById('mc-theme-switcher');
    var toggleBtn = document.getElementById('mc-theme-toggle');
    var panel = document.getElementById('mc-theme-panel');
    var options = document.querySelectorAll('.mc-theme-option');

    if (!switcher || !toggleBtn || !panel) return;

    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
        } catch (e) {
            return DEFAULT_THEME;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            /* localStorage no disponible: la paleta solo dura la sesión actual */
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        options.forEach(function (opt) {
            var isActive = opt.getAttribute('data-theme') === theme;
            opt.classList.toggle('is-active', isActive);
        });
    }

    function openPanel() {
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (panel.classList.contains('is-open')) {
            closePanel();
        } else {
            openPanel();
        }
    });

    options.forEach(function (opt) {
        opt.addEventListener('click', function () {
            var theme = opt.getAttribute('data-theme');
            applyTheme(theme);
            saveTheme(theme);
            closePanel();
        });
    });

    // Cerrar el panel al hacer clic fuera de él
    document.addEventListener('click', function (e) {
        if (!switcher.contains(e.target)) {
            closePanel();
        }
    });

    // Cerrar el panel con la tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closePanel();
    });

    // Reflejar la paleta activa (ya aplicada por el script inline en
    // <head>) como seleccionada dentro del panel
    applyTheme(getSavedTheme());
})();
