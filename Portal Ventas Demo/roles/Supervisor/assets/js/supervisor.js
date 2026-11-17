/* ============================================================
   COMPORTAMIENTO COMÚN DE LAS PÁGINAS DE SUPERVISOR
   - Menú lateral: contraer (escritorio) y abrir / cerrar (móvil).
   - Modo claro / oscuro: el tema nuevo crece en círculo desde el
     botón hasta cubrir la pantalla (igual que en Gerencia).
   - Botón "cargando" al enviar formularios con data-cargando.
   - Buscador rápido en tablas con data-buscar-en.
   - Rangos rápidos de fechas y límite de 30 días (from_date / to_date).
   ============================================================ */
const DIAS_MAXIMOS_FILTRO = 30;
const DURACION_CAMBIO_TEMA = 650;

(function () {
    const raiz = document.documentElement;

    function guardar(clave, valor) {
        try {
            localStorage.setItem(clave, valor);
        } catch (error) {
            /* sin almacenamiento: dura sólo mientras la página esté abierta */
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        activarTema();
        activarMenu();
        activarBotonesCargando();
        activarBuscadorDeTabla();
        activarFechas();
    });

    /* ---------- Tema ---------- */
    function activarTema() {
        const boton = document.getElementById('cambiarTema');
        if (!boton) {
            return;
        }

        // Se actualiza al momento del clic, aunque la animación siga en curso
        let oscuro = raiz.getAttribute('data-tema') === 'oscuro';

        boton.addEventListener('click', function () {
            oscuro = !oscuro;
            guardar('supervisor.tema', oscuro ? 'oscuro' : 'claro');

            // Siempre aplica la última elección (aunque haya varios clics seguidos)
            const aplicar = function () {
                raiz.setAttribute('data-tema', oscuro ? 'oscuro' : 'claro');
            };

            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                aplicar();
                return;
            }

            if (!document.startViewTransition) {
                raiz.classList.add('tema-en-transicion');
                aplicar();
                setTimeout(function () { raiz.classList.remove('tema-en-transicion'); }, DURACION_CAMBIO_TEMA);
                return;
            }

            // Círculo que crece desde el botón hasta la esquina más lejana
            const caja = boton.getBoundingClientRect();
            const x = caja.left + caja.width / 2;
            const y = caja.top + caja.height / 2;
            const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
            const transicion = document.startViewTransition(aplicar);

            transicion.ready.then(function () {
                raiz.animate(
                    { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radio + 'px at ' + x + 'px ' + y + 'px)'] },
                    { duration: DURACION_CAMBIO_TEMA, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            }).catch(function () {
                /* El navegador canceló la animación (p. ej. pestaña oculta): el tema ya se aplicó */
            });
            transicion.finished.catch(function () {});
            transicion.updateCallbackDone.catch(function () {});
        });
    }

    /* ---------- Menú lateral ---------- */
    function activarMenu() {
        const colapsar = document.getElementById('colapsarMenu');
        const abrir = document.getElementById('abrirMenu');
        const capa = document.getElementById('capaOscura');

        if (colapsar) {
            colapsar.addEventListener('click', function () {
                const cerrado = raiz.classList.toggle('sidebar-cerrado');
                guardar('supervisor.menuCerrado', cerrado ? '1' : '0');
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
        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape') {
                cerrarMovil();
            }
        });
    }

    /* ---------- Botones "cargando" ---------- */
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

        window.addEventListener('pageshow', function () {
            document.querySelectorAll('.cargando').forEach(function (boton) {
                boton.classList.remove('cargando');
            });
        });
    }

    /* ---------- Buscador rápido (filtra las filas que ya se muestran) ---------- */
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

    /* ---------- Fechas: rangos rápidos y límite de días ---------- */
    function activarFechas() {
        const desde = document.querySelector('input[name="from_date"]');
        const hasta = document.querySelector('input[name="to_date"]');

        if (!desde || !hasta || !desde.form) {
            return;
        }

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

        // En captura: se revisa antes que el botón "cargando"
        desde.form.addEventListener('submit', function (evento) {
            if (!desde.value || !hasta.value) {
                return;
            }

            const dias = (new Date(hasta.value) - new Date(desde.value)) / (1000 * 60 * 60 * 24);

            if (dias > DIAS_MAXIMOS_FILTRO) {
                alert('El rango máximo permitido es de ' + DIAS_MAXIMOS_FILTRO + ' días.');
                evento.preventDefault();
            }
        }, true);
    }
})();
