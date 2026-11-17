/* ============================================================
   FILTRO POR FECHAS (ver.php)
   - Avisa antes de buscar si la fecha inicial es mayor que la final.
     El servidor vuelve a revisarlo (includes/ventas.php).
   - "Buscar por": al elegir "Fecha de cobro" se sugiere el estatus
     de Cobrador COBRADA (se puede cambiar a "Todos" o RECHAZADA).
   - Las listas de estatus con un valor elegido se resaltan.
   ============================================================ */
(function () {

    document.addEventListener('DOMContentLoaded', function () {
        const formulario = document.getElementById('formFiltroFechas');
        const desde = document.getElementById('from_date');
        const hasta = document.getElementById('to_date');

        if (!formulario) {
            return;
        }

        formulario.addEventListener('submit', function (evento) {
            const dias = (new Date(hasta.value) - new Date(desde.value)) / (1000 * 60 * 60 * 24);

            if (dias < 0) {
                alert('La fecha inicial no puede ser mayor que la final.');
                evento.preventDefault();
            }
        });

        // Listas de estatus: resaltado cuando tienen un valor
        const listas = formulario.querySelectorAll('select.form-select');
        function marcarListas() {
            listas.forEach(function (lista) {
                lista.classList.toggle('con-valor', lista.value !== '');
            });
        }
        listas.forEach(function (lista) {
            lista.addEventListener('change', marcarListas);
        });
        marcarListas();

        // Tipo de fecha: texto de ayuda y sugerencia de "COBRADA"
        const ayuda = document.getElementById('ayudaTipoFecha');
        const cobrador = document.getElementById('estatus_cobrador');

        formulario.querySelectorAll('input[name="tipo_fecha"]').forEach(function (opcion) {
            opcion.addEventListener('change', function () {
                if (ayuda) {
                    ayuda.textContent = ayuda.dataset[opcion.value] || '';
                }

                if (opcion.value === 'cobro' && cobrador && cobrador.value === '') {
                    cobrador.value = 'COBRADA';
                    marcarListas();
                }
            });
        });
    });
})();
