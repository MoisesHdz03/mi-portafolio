// La fecha, la hora y el saludo en vivo del inicio de sesión, en hora de la Ciudad de México.
// Busca los elementos en cada segundo, así sigue funcionando después de una navegación de Blazor.
(function () {
    const zona = 'America/Mexico_City';
    const fecha = new Intl.DateTimeFormat('es-MX', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = new Intl.DateTimeFormat('es-MX', { timeZone: zona, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const soloHora = new Intl.DateTimeFormat('es-MX', { timeZone: zona, hour: 'numeric', hour12: false });

    function saludo(ahora) {
        const h = Number(soloHora.format(ahora));
        return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    }

    function actualizar() {
        const ahora = new Date();
        const texto = fecha.format(ahora);
        document.querySelectorAll('[data-reloj-fecha]').forEach(e => { e.textContent = texto.charAt(0).toUpperCase() + texto.slice(1); });
        document.querySelectorAll('[data-reloj-hora]').forEach(e => { e.textContent = hora.format(ahora); });
        document.querySelectorAll('[data-saludo]').forEach(e => { e.textContent = saludo(ahora); });
    }

    document.addEventListener('DOMContentLoaded', actualizar);
    setInterval(actualizar, 1000);
})();
