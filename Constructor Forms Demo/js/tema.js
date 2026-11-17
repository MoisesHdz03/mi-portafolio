// Tema claro u oscuro. Se carga en <head> sin defer para aplicar el tema antes de que se dibuje
// la página y evitar que se vea un instante en claro. La preferencia ("auto", "claro" u "oscuro")
// se guarda en este navegador; en <html> se pone data-tema ya resuelto, que es lo que lee el CSS.
(function () {
    const clave = 'constructor-tema';
    const orden = ['auto', 'claro', 'oscuro'];
    const nombres = { auto: 'Automático', claro: 'Claro', oscuro: 'Oscuro' };
    const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');
    const claveMenu = 'constructor-menu';
    const modosMenu = ['completo', 'iconos', 'oculto'];

    function preferencia() {
        try {
            const guardada = localStorage.getItem(clave);
            return orden.includes(guardada) ? guardada : 'auto';
        } catch {
            return 'auto';
        }
    }

    function guardar(valor) {
        try {
            localStorage.setItem(clave, valor);
        } catch {
            // Sin almacenamiento (modo privado): el tema dura solo mientras la página esté abierta.
        }
    }

    // El menú lateral en computadora: "completo", "iconos" u "oculto". También se guarda en este
    // navegador y se aplica antes de dibujar, para que el menú no se vea un instante abierto.
    function preferenciaMenu() {
        try {
            const guardada = localStorage.getItem(claveMenu);
            return modosMenu.includes(guardada) ? guardada : 'completo';
        } catch {
            return 'completo';
        }
    }

    function guardarMenu(modo) {
        try {
            localStorage.setItem(claveMenu, modo);
        } catch {
            // Sin almacenamiento (modo privado): dura solo hasta la siguiente navegación.
        }

        document.documentElement.dataset.menu = modo;
    }

    function aplicar() {
        const actual = preferencia();
        const oscuro = actual === 'oscuro' || (actual === 'auto' && sistemaOscuro.matches);
        document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
        document.documentElement.dataset.menu = preferenciaMenu();
        document.querySelectorAll('[data-texto-tema]').forEach(e => { e.textContent = nombres[actual]; });
    }

    // El menú en celular se abre con una casilla; al navegar se cierra.
    function cerrarMenu() {
        const interruptor = document.getElementById('menu-abierto');
        if (interruptor) {
            interruptor.checked = false;
        }
    }

    // Al cambiar el tema, el nuevo se va pintando en un círculo que crece desde el botón. Usa la
    // View Transitions API: el navegador toma una foto de la página, aplica el tema y anima entre
    // las dos. Si no la tiene, o la persona pidió menos movimiento, el cambio es directo.
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

    function cambiarTema(x, y) {
        const antes = document.documentElement.dataset.tema;
        const cambiar = () => {
            const actual = preferencia();
            guardar(orden[(orden.indexOf(actual) + 1) % orden.length]);
            aplicar();
        };

        if (!document.startViewTransition || menosMovimiento.matches) {
            cambiar();
            return;
        }

        // De Automático a Claro (o a Oscuro) puede que no cambie nada en pantalla: sin animación.
        const siguiente = orden[(orden.indexOf(preferencia()) + 1) % orden.length];
        const quedaOscuro = siguiente === 'oscuro' || (siguiente === 'auto' && sistemaOscuro.matches);
        if ((quedaOscuro ? 'oscuro' : 'claro') === antes) {
            cambiar();
            return;
        }

        const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const transicion = document.startViewTransition(cambiar);
        transicion.ready.then(() => {
            document.documentElement.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
                { duration: 650, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' });
        }).catch(() => { });
    }

    document.addEventListener('click', evento => {
        const botonTema = evento.target.closest('[data-accion="tema"]');
        if (botonTema) {
            // Con teclado no hay coordenadas del clic: el círculo sale del centro del botón.
            const caja = botonTema.getBoundingClientRect();
            const x = evento.clientX || caja.left + caja.width / 2;
            const y = evento.clientY || caja.top + caja.height / 2;
            cambiarTema(x, y);
        } else if (evento.target.closest('[data-accion="menu-iconos"]')) {
            guardarMenu(preferenciaMenu() === 'iconos' ? 'completo' : 'iconos');
        } else if (evento.target.closest('[data-accion="menu-ocultar"]')) {
            guardarMenu('oculto');
        } else if (evento.target.closest('[data-accion="menu-mostrar"]')) {
            guardarMenu('completo');
        } else if (evento.target.closest('.menu-lateral a')) {
            cerrarMenu();
        }
    });

    sistemaOscuro.addEventListener('change', aplicar);
    document.addEventListener('DOMContentLoaded', aplicar);
    aplicar();

    // Blazor llama a esto después de cada navegación mejorada, que vuelve a dibujar el menú.
    window.constructorTema = { aplicar, cerrarMenu };
})();
