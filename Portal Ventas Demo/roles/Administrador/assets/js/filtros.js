/* ============================================================
   PÁGINA "FILTROS" (ver.php)
   El menú y el modo oscuro están en JS/admin.js (igual que Ver Ventas).
   Aquí: "Buscando...", aviso de resultados, revisión antes de
   exportar y desplazamiento de la tabla arrastrando con el mouse.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    iniciarAnimaciones();
    iniciarArrastreTabla();
    iniciarFiltrosEstatus();
});

/*
 * Listas de estatus y "Buscar por":
 * - Las listas con un estatus elegido se resaltan.
 * - Al elegir "Fecha de cobro" se sugiere el estatus de Cobrador COBRADA
 *   (el cobrador también guarda fecha cuando rechaza; se puede cambiar a "Todos").
 */
function iniciarFiltrosEstatus() {
    const formulario = document.getElementById('filterForm');
    const listas = formulario.querySelectorAll('select.form-select');
    const ayuda = document.getElementById('ayudaTipoFecha');
    const cobrador = document.getElementById('estatus_cobrador');

    function marcarListas() {
        listas.forEach(function (lista) {
            lista.classList.toggle('con-valor', lista.value !== '');
        });
    }

    listas.forEach(function (lista) {
        lista.addEventListener('change', marcarListas);
    });
    marcarListas();

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
}

/* "Buscando...", aviso de resultados y animación de exportar */
function iniciarAnimaciones() {
    const botonBuscar = document.getElementById('searchBtn');
    const aviso = document.getElementById('successNotification');
    const botonExportar = document.getElementById('exportBtn');

    document.getElementById('filterForm').addEventListener('submit', function () {
        botonBuscar.classList.add('cargando');
        botonBuscar.querySelector('span').textContent = 'Buscando...';
    });

    // Al volver con "Atrás", el botón regresa a la normalidad
    window.addEventListener('pageshow', function () {
        botonBuscar.classList.remove('cargando');
        botonBuscar.querySelector('span').textContent = 'Buscar';
    });

    if (aviso.dataset.mostrar === '1') {
        window.addEventListener('load', function () {
            aviso.classList.add('show');
            setTimeout(function () { aviso.classList.remove('show'); }, 3000);
        });
    }

    botonExportar.addEventListener('click', function (evento) {
        // Se exporta el rango ya buscado; sin búsqueda no hay nada que exportar
        const parametros = new URL(botonExportar.href).searchParams;

        if (!parametros.get('from_date') || !parametros.get('to_date')) {
            evento.preventDefault();
            alert('Selecciona y busca un rango de fechas antes de exportar.');
            return;
        }

        // La descarga no cambia de página: "Generando..." unos segundos
        botonExportar.classList.add('cargando');
        setTimeout(function () { botonExportar.classList.remove('cargando'); }, 3000);
    });
}

/* La tabla se puede desplazar a los lados arrastrando con el mouse */
function iniciarArrastreTabla() {
    const contenedor = document.querySelector('.table-wrapper');
    let arrastrando = false;
    let inicioX = 0;
    let desplazamientoInicial = 0;

    if (!contenedor) {
        return;
    }

    contenedor.addEventListener('mousedown', function (evento) {
        arrastrando = true;
        inicioX = evento.pageX - contenedor.offsetLeft;
        desplazamientoInicial = contenedor.scrollLeft;
        contenedor.classList.add('arrastrando');
    });

    ['mouseleave', 'mouseup'].forEach(function (tipo) {
        contenedor.addEventListener(tipo, function () {
            arrastrando = false;
            contenedor.classList.remove('arrastrando');
        });
    });

    contenedor.addEventListener('mousemove', function (evento) {
        if (!arrastrando) {
            return;
        }

        evento.preventDefault();
        const x = evento.pageX - contenedor.offsetLeft;
        contenedor.scrollLeft = desplazamientoInicial - (x - inicioX) * 2;
    });
}
