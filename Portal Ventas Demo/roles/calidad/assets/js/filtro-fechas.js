/* ============================================================
   FILTRO POR FECHAS (ver.php)
   - Rangos rápidos: Hoy, Ayer, Últimos 7 días, Este mes.
   - Avisa si la fecha inicial es mayor que la final
     (el servidor también lo revisa en includes/ventas.php).
   - El botón de Excel muestra "Generando..." unos segundos.
   ============================================================ */
(function () {
    const formulario = document.getElementById('formFiltroFechas');
    const desde = document.getElementById('from_date');
    const hasta = document.getElementById('to_date');

    if (!formulario || !desde || !hasta) {
        return;
    }

    function formato(fecha) {
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return fecha.getFullYear() + '-' + mes + '-' + dia;
    }

    function rango(tipo) {
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
    }

    function marcarChipActivo() {
        document.querySelectorAll('[data-rango]').forEach(function (chip) {
            const [inicio, fin] = rango(chip.dataset.rango);
            chip.classList.toggle('activo', desde.value === inicio && hasta.value === fin);
        });
    }

    document.querySelectorAll('[data-rango]').forEach(function (chip) {
        chip.addEventListener('click', function () {
            [desde.value, hasta.value] = rango(chip.dataset.rango);
            marcarChipActivo();
            formulario.requestSubmit();
        });
    });

    desde.addEventListener('change', marcarChipActivo);
    hasta.addEventListener('change', marcarChipActivo);
    marcarChipActivo();

    formulario.addEventListener('submit', function (evento) {
        if (desde.value && hasta.value && desde.value > hasta.value) {
            evento.preventDefault();
            evento.stopImmediatePropagation();
            hasta.setCustomValidity('La fecha final no puede ser menor que la inicial.');
            hasta.reportValidity();
        }
    }, true);

    hasta.addEventListener('input', function () {
        hasta.setCustomValidity('');
    });

    // La descarga no cambia de página: se muestra "Generando..." unos segundos
    const exportar = document.getElementById('exportar');
    if (exportar) {
        exportar.addEventListener('click', function () {
            exportar.classList.add('cargando');
            setTimeout(function () {
                exportar.classList.remove('cargando');
            }, 4000);
        });
    }
})();
