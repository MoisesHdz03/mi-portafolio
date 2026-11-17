/* ============================================================
   BUSCADOR RÁPIDO DE LA TABLA
   Filtra en el navegador las filas que ya se muestran
   (no vuelve a consultar al servidor).
   ============================================================ */
(function () {
    const buscador = document.getElementById('buscarEnTabla');
    const tabla = document.getElementById('tablaVentas');
    const resumen = document.getElementById('resumenTabla');
    const sinCoincidencias = document.getElementById('sinCoincidencias');

    if (!buscador || !tabla) {
        return;
    }

    const filas = Array.from(tabla.tBodies[0].rows).filter(function (fila) {
        return fila !== sinCoincidencias;
    });
    const textos = filas.map(function (fila) {
        return normalizar(fila.textContent);
    });
    const total = filas.length;
    let espera = null;

    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
    }

    function filtrar() {
        const busqueda = normalizar(buscador.value.trim());
        let visibles = 0;

        filas.forEach(function (fila, indice) {
            const coincide = busqueda === '' || textos[indice].includes(busqueda);
            fila.classList.toggle('oculto', !coincide);
            if (coincide) {
                visibles++;
            }
        });

        sinCoincidencias.classList.toggle('oculto', visibles > 0);
        resumen.textContent = busqueda === ''
            ? 'Mostrando ' + total.toLocaleString('es-MX') + ' ventas'
            : visibles.toLocaleString('es-MX') + ' de ' + total.toLocaleString('es-MX') + ' ventas coinciden';
    }

    buscador.addEventListener('input', function () {
        clearTimeout(espera);
        espera = setTimeout(filtrar, 150);
    });
})();
