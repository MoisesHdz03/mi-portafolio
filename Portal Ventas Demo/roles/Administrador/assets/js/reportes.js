/* ============================================================
   REPORTES DE VENTAS (carpeta Sales)
   - Dibuja la gráfica con la configuración que manda PHP
     en el atributo data-grafica del <canvas>, con los colores
     del portal (y se vuelve a pintar al cambiar a modo oscuro).
   - "Exportar a PDF": gráfica (aunque no esté a la vista) + tabla en un PDF.
   ============================================================ */

/*
 * Color de cada serie (dataset.serie, lo manda PHP): los mismos colores
 * de los números de la tabla (reportes_admin.css). Si una serie no está aquí
 * se usa la lista de respaldo en orden.
 */
const COLORES_SERIE = {
    claro: {
        VentasTotales: '#0b6e79', Validadas: '#5f8fa0', Rechazadas: '#b4322a',
        Pendientes: '#b8892d', Ingresadas: '#a3b5c4', Cobradas: '#1f7a4d',
    },
    oscuro: {
        VentasTotales: '#3fb5bf', Validadas: '#7fa7b8', Rechazadas: '#e48a82',
        Pendientes: '#d6ad5c', Ingresadas: '#4f6275', Cobradas: '#6fc597',
    },
};
const COLORES_GRAFICA = {
    claro:  ['#0b6e79', '#5f8fa0', '#a3b5c4', '#1f7a4d', '#b8892d', '#2f4a62'],
    oscuro: ['#3fb5bf', '#7fa7b8', '#4f6275', '#6fc597', '#d6ad5c', '#9fb4c8'],
};

let graficaReporte = null;

function aplicarColoresGrafica(configuracion, oscuro = document.body.classList.contains('dark-mode')) {
    const paleta = oscuro ? COLORES_GRAFICA.oscuro : COLORES_GRAFICA.claro;
    const texto = oscuro ? '#a3aebd' : '#4c5868';
    const rejilla = oscuro ? 'rgba(255, 255, 255, .06)' : 'rgba(23, 32, 44, .07)';
    const esLinea = configuracion.type === 'line';

    const porSerie = oscuro ? COLORES_SERIE.oscuro : COLORES_SERIE.claro;

    configuracion.data.datasets.forEach(function (serie, indice) {
        const color = porSerie[serie.serie] || paleta[indice % paleta.length];

        if (esLinea) {
            // Línea con área suave debajo
            Object.assign(serie, {
                borderColor: color,
                backgroundColor: color + '22',
                pointBackgroundColor: color,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                cubicInterpolationMode: 'monotone',
                fill: true,
            });
        } else {
            serie.backgroundColor = color;
            serie.borderRadius = 4;
            serie.maxBarThickness = 28;
        }
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
        color: oscuro ? '#e6ebf1' : '#17202c',
        font: { size: 14, weight: '600' },
        padding: { bottom: 12 },
    });
    opciones.plugins.tooltip = { backgroundColor: oscuro ? '#1b2330' : '#17202c', padding: 10, cornerRadius: 6 };
    opciones.scales = opciones.scales || {};
    ['x', 'y'].forEach(function (eje) {
        opciones.scales[eje] = Object.assign({}, opciones.scales[eje]);
        opciones.scales[eje].ticks = Object.assign({}, opciones.scales[eje].ticks, { color: texto });
        opciones.scales[eje].grid = { color: eje === 'y' ? rejilla : 'transparent' };
        opciones.scales[eje].border = { display: false };
        if (opciones.scales[eje].title) {
            opciones.scales[eje].title = Object.assign({}, opciones.scales[eje].title, { color: texto });
        }
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
            exportarPDF(botonPdf.dataset.titulo, botonPdf.dataset.archivo, botonPdf.dataset.grafica);
        });
    }
});

/*
 * La gráfica del PDF se dibuja aparte, siempre en colores claros (el PDF es blanco)
 * y aunque no esté a la vista en la página.
 */
function imagenGraficaPDF(datosGrafica) {
    if (!datosGrafica || !window.Chart) {
        return null;
    }

    const lienzo = document.createElement('canvas');
    lienzo.width = 1000;
    lienzo.height = 500;
    lienzo.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;height:500px;';
    document.body.appendChild(lienzo);

    const configuracion = aplicarColoresGrafica(JSON.parse(datosGrafica), false);
    configuracion.options.responsive = false;
    configuracion.options.animation = false;

    const grafica = new Chart(lienzo.getContext('2d'), configuracion);
    const imagen = lienzo.toDataURL('image/png');
    grafica.destroy();
    lienzo.remove();

    return imagen;
}

function exportarPDF(titulo, archivo, datosGrafica) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const margen = 40;
    let inicioTabla = 60;

    pdf.setFontSize(18);
    pdf.text(titulo, margen, 40);

    // La gráfica solo existe cuando hay datos
    const imagen = imagenGraficaPDF(datosGrafica);

    if (imagen) {
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
        headStyles: { fillColor: [11, 110, 121] },
        styles: { fontSize: 9 },
    });

    pdf.save(archivo);
}
