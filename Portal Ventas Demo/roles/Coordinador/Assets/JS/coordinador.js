/* ============================================================
   COMPORTAMIENTO COMÚN DE LAS PÁGINAS DE COORDINADOR
   - Menú lateral: contraer (escritorio) y abrir / cerrar (móvil).
   - Modo claro / oscuro (se recuerda en este navegador).
   - Botones "cargando" al enviar formularios con data-cargando.
   - Buscador rápido en tablas con data-buscable.
   - Un formulario con from_date / to_date no deja buscar más de 30 días.
   ============================================================ */
const DIAS_MAXIMOS_FILTRO = 30;

(function () {
    const raiz = document.documentElement;

    function guardar(clave, valor) {
        try {
            localStorage.setItem(clave, valor);
        } catch (error) {
            /* sin almacenamiento: sólo dura mientras la página esté abierta */
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        activarTema();
        activarMenu();
        activarBotonesCargando();
        activarBuscadorDeTabla();
        limitarRangoDeFechas();
    });

    function activarTema() {
        const boton = document.getElementById('cambiarTema');
        if (!boton) {
            return;
        }

        boton.addEventListener('click', function () {
            const nuevo = raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
            raiz.setAttribute('data-tema', nuevo);
            raiz.setAttribute('data-bs-theme', nuevo === 'oscuro' ? 'dark' : 'light');
            guardar('coordinador.tema', nuevo);
        });
    }

    function activarMenu() {
        const colapsar = document.getElementById('colapsarMenu');
        const abrir = document.getElementById('abrirMenu');
        const capa = document.getElementById('capaOscura');

        if (colapsar) {
            colapsar.addEventListener('click', function () {
                const cerrado = raiz.classList.toggle('sidebar-cerrado');
                guardar('coordinador.menuCerrado', cerrado ? '1' : '0');
            });
        }

        function cerrarMovil() {
            raiz.classList.remove('menu-abierto');
            if (abrir) {
                abrir.setAttribute('aria-expanded', 'false');
            }
        }

        if (abrir) {
            abrir.setAttribute('aria-expanded', 'false');
            abrir.addEventListener('click', function () {
                const abierto = raiz.classList.toggle('menu-abierto');
                abrir.setAttribute('aria-expanded', abierto ? 'true' : 'false');
            });
        }

        if (capa) {
            capa.addEventListener('click', cerrarMovil);
        }

        // Al abrir "Cambiar Estatus" desde el menú móvil, se cierra el menú
        document.querySelectorAll('.sidebar [data-bs-toggle="modal"]').forEach(function (enlace) {
            enlace.addEventListener('click', cerrarMovil);
        });

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape') {
                cerrarMovil();
            }
        });
    }

    function activarBotonesCargando() {
        document.querySelectorAll('form[data-cargando]').forEach(function (formulario) {
            formulario.addEventListener('submit', function (evento) {
                if (evento.defaultPrevented) {
                    return;
                }
                const boton = formulario.querySelector('[type="submit"]');
                if (boton) {
                    boton.classList.add('cargando');
                }
            });
        });

        // La descarga de Excel no cambia de página: "Generando..." unos segundos
        document.querySelectorAll('[data-descarga]').forEach(function (enlace) {
            enlace.addEventListener('click', function () {
                enlace.classList.add('cargando');
                setTimeout(function () { enlace.classList.remove('cargando'); }, 4000);
            });
        });

        // Al volver con "Atrás" el navegador puede restaurar el botón girando
        window.addEventListener('pageshow', function () {
            document.querySelectorAll('.cargando').forEach(function (boton) {
                boton.classList.remove('cargando');
            });
        });
    }

    /* Filtra en el navegador las filas que ya se muestran (no consulta al servidor) */
    function activarBuscadorDeTabla() {
        const buscador = document.querySelector('[data-buscar-en]');
        if (!buscador) {
            return;
        }

        const tabla = document.getElementById(buscador.dataset.buscarEn);
        const resumen = document.getElementById('resumenTabla');
        const sinCoincidencias = document.getElementById('sinCoincidencias');
        if (!tabla) {
            return;
        }

        const normalizar = function (texto) {
            return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
        };
        const filas = Array.from(tabla.tBodies[0].rows).filter(function (fila) { return fila !== sinCoincidencias; });
        const textos = filas.map(function (fila) { return normalizar(fila.textContent); });
        const total = filas.length;
        let espera = null;

        buscador.addEventListener('input', function () {
            clearTimeout(espera);
            espera = setTimeout(function () {
                const busqueda = normalizar(buscador.value.trim());
                let visibles = 0;

                filas.forEach(function (fila, indice) {
                    const coincide = busqueda === '' || textos[indice].includes(busqueda);
                    fila.classList.toggle('oculto', !coincide);
                    visibles += coincide ? 1 : 0;
                });

                if (sinCoincidencias) {
                    sinCoincidencias.classList.toggle('oculto', visibles > 0);
                }
                if (resumen) {
                    resumen.textContent = busqueda === ''
                        ? 'Mostrando ' + total.toLocaleString('es-MX') + ' ventas'
                        : visibles.toLocaleString('es-MX') + ' de ' + total.toLocaleString('es-MX') + ' ventas coinciden';
                }
            }, 150);
        });
    }
})();

function limitarRangoDeFechas() {
    const desde = document.querySelector('input[name="from_date"]');
    const hasta = document.querySelector('input[name="to_date"]');

    if (!desde || !hasta || !desde.form) {
        return;
    }

    // Rangos rápidos (botones con data-rango)
    const formato = function (fecha) {
        return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
    };
    const rango = function (tipo) {
        const hoy = new Date();
        const inicio = new Date(hoy);
        let fin = new Date(hoy);

        if (tipo === 'ayer') {
            inicio.setDate(hoy.getDate() - 1);
            fin = new Date(inicio);
        } else if (tipo === 'semana') {
            inicio.setDate(hoy.getDate() - 6);
        } else if (tipo === 'mes') {
            inicio.setDate(1);
        }

        return [formato(inicio), formato(fin)];
    };
    const marcarActivo = function () {
        document.querySelectorAll('[data-rango]').forEach(function (chip) {
            const [inicio, fin] = rango(chip.dataset.rango);
            chip.classList.toggle('activo', desde.value === inicio && hasta.value === fin);
        });
    };

    document.querySelectorAll('[data-rango]').forEach(function (chip) {
        chip.addEventListener('click', function () {
            [desde.value, hasta.value] = rango(chip.dataset.rango);
            marcarActivo();
            desde.form.requestSubmit();
        });
    });
    desde.addEventListener('change', marcarActivo);
    hasta.addEventListener('change', marcarActivo);
    marcarActivo();

    // Se registra en captura para revisar el rango antes que el botón "cargando"
    desde.form.addEventListener('submit', function (evento) {
        if (!desde.value || !hasta.value) {
            return;
        }

        const dias = (new Date(hasta.value) - new Date(desde.value)) / (1000 * 60 * 60 * 24);

        if (dias < 0) {
            alert('La fecha inicial no puede ser mayor que la final.');
            evento.preventDefault();
        } else if (dias > DIAS_MAXIMOS_FILTRO) {
            alert('El rango máximo permitido es de ' + DIAS_MAXIMOS_FILTRO + ' días.');
            evento.preventDefault();
        }
    }, true);
}
