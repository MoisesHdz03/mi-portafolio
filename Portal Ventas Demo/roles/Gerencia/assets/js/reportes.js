/* ============================================================
   REPORTES DE VENTAS (carpeta Sales)
   - Dibuja la gráfica con la configuración que manda PHP
     en el atributo data-grafica del <canvas>, con los colores
     del portal (y se vuelve a pintar al cambiar a modo oscuro).
   - "Exportar a PDF": gráfica + tabla en un PDF.
   ============================================================ */

/*
 * Color de cada serie (dataset.serie, lo manda PHP): los mismos colores
 * de los números de la tabla (reportes.css). Si una serie no está aquí
 * se usa la lista de respaldo en orden.
 */
const COLORES_SERIE = {
    claro: {
        VentasTotales: '#2f5aa8', Validadas: '#7a93bf', Rechazadas: '#b4322a',
        Pendientes: '#c28a1e', Ingresadas: '#a9b6cc', Cobradas: '#2f7a4f',
    },
    oscuro: {
        VentasTotales: '#7ea2e6', Validadas: '#8fa6cf', Rechazadas: '#e48a82',
        Pendientes: '#d9b261', Ingresadas: '#5d6b85', Cobradas: '#7cc49a',
    },
};
const COLORES_GRAFICA = {
    claro:  ['#2f5aa8', '#7a93bf', '#a9b6cc', '#2f7a4f', '#c28a1e', '#6b7a96'],
    oscuro: ['#7ea2e6', '#8fa6cf', '#5d6b85', '#7cc49a', '#d9b261', '#a5a7ad'],
};

let graficaReporte = null;

function aplicarColoresGrafica(configuracion) {
    const oscuro = document.body.classList.contains('dark-mode');
    const paleta = oscuro ? COLORES_GRAFICA.oscuro : COLORES_GRAFICA.claro;
    const texto = oscuro ? '#a5a7ad' : '#556070';
    const rejilla = oscuro ? 'rgba(255, 255, 255, .06)' : 'rgba(27, 34, 48, .07)';

    const porSerie = oscuro ? COLORES_SERIE.oscuro : COLORES_SERIE.claro;

    configuracion.data.datasets.forEach(function (serie, indice) {
        serie.backgroundColor = porSerie[serie.serie] || paleta[indice % paleta.length];
        serie.borderRadius = 4;
        serie.maxBarThickness = 28;
    });

    const opciones = configuracion.options = configuracion.options || {};
    opciones.responsive = true;
    opciones.maintainAspectRatio = false;
    opciones.animation = { duration: 600, easing: 'easeOutQuart' };
    opciones.plugins = opciones.plugins || {};
    opciones.plugins.legend = Object.assign({}, opciones.plugins.legend, {
        labels: { color: texto, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, padding: 16 },
    });
    opciones.plugins.title = Object.assign({}, opciones.plugins.title, {
        color: oscuro ? '#ececec' : '#1b2230',
        font: { size: 14, weight: '600' },
        padding: { bottom: 12 },
    });
    opciones.plugins.tooltip = { backgroundColor: oscuro ? '#2c2d31' : '#1b2230', padding: 10, cornerRadius: 6 };
    opciones.scales = opciones.scales || {};
    ['x', 'y'].forEach(function (eje) {
        opciones.scales[eje] = Object.assign({}, opciones.scales[eje]);
        opciones.scales[eje].ticks = Object.assign({}, opciones.scales[eje].ticks, { color: texto });
        opciones.scales[eje].grid = { color: eje === 'y' ? rejilla : 'transparent' };
        opciones.scales[eje].border = { display: false };
    });

    return configuracion;
}

function dibujarGrafica(lienzo) {
    if (graficaReporte) {
        graficaReporte.destroy();
    }

    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    graficaReporte = new Chart(lienzo.getContext('2d'), aplicarColoresGrafica(JSON.parse(lienzo.dataset.grafica)));
}

document.addEventListener('DOMContentLoaded', function () {
    const lienzo = document.getElementById('graficaReporte');

    if (lienzo && window.Chart) {
        dibujarGrafica(lienzo);

        // Al cambiar entre claro y oscuro se vuelve a pintar con los colores del tema
        new MutationObserver(function () {
            dibujarGrafica(lienzo);
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    const botonPdf = document.getElementById('btnExportarPdf');

    if (botonPdf) {
        botonPdf.addEventListener('click', function () {
            exportarPDF(botonPdf.dataset.titulo, botonPdf.dataset.archivo, lienzo);
        });
    }
});

function exportarPDF(titulo, archivo, lienzo) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const margen = 40;
    let inicioTabla = 60;

    pdf.setFontSize(18);
    pdf.text(titulo, margen, 40);

    // La gráfica solo existe cuando hay datos
    if (lienzo) {
        const imagen = lienzo.toDataURL('image/png');
        const propiedades = pdf.getImageProperties(imagen);
        const ancho = pdf.internal.pageSize.getWidth() - margen * 2;
        const alto = (propiedades.height * ancho) / propiedades.width;

        pdf.addImage(imagen, 'PNG', margen, 60, ancho, alto);
        inicioTabla = 60 + alto + 20;
    }

    pdf.autoTable({
        html: '.ventas-table',
        startY: inicioTabla,
        theme: 'striped',
        headStyles: { fillColor: [47, 90, 168] },
        styles: { fontSize: 9 },
    });

    pdf.save(archivo);
}
