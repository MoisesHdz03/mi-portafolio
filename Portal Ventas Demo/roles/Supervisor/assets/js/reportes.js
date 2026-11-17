/* ============================================================
   RESÚMENES DE VENTAS (ResumenSale.php y ResumenSaleCob.php)
   "Exportar" descarga en CSV lo que muestra la tabla.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    const boton = document.getElementById('btnExportarCsv');

    if (boton) {
        boton.addEventListener('click', function () {
            exportarTablaCsv(document.querySelector('.ventas-table'), boton.dataset.archivo);
        });
    }
});

function exportarTablaCsv(tabla, archivo) {
    const filas = [...tabla.querySelectorAll('tr')]
        .filter(function (fila) { return !fila.querySelector('.no-data'); })
        .map(function (fila) {
            return [...fila.children].map(function (celda) {
                return '"' + celda.textContent.trim().replace(/"/g, '""') + '"';
            }).join(',');
        });

    if (filas.length <= 1) {
        alert('No hay datos para exportar. Primero filtra un rango de fechas.');
        return;
    }

    // El BOM hace que Excel respete los acentos
    const contenido = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const enlace = document.createElement('a');

    enlace.href = URL.createObjectURL(contenido);
    enlace.download = archivo;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}
