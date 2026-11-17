/* ============================================================
   VISTA PREVIA DEL COMPROBANTE (papeleta, partials/comprobante.php)
   - El archivo se pide hasta que se abre la ventana (no carga de más).
   - Imagen: clic para acercar / alejar.  PDF: visor del navegador.
   ============================================================ */
(function () {
    const modal = document.getElementById('modalComprobante');
    const visor = document.getElementById('visorComprobante');

    if (!modal || !visor) {
        return;
    }

    const cargando = visor.querySelector('[data-estado="cargando"]');
    const error = visor.querySelector('[data-estado="error"]');
    let cargado = false;

    function mostrarError() {
        cargando.classList.add('oculto');
        error.classList.remove('oculto');
    }

    function cargar() {
        if (cargado) {
            return;
        }
        cargado = true;

        if (visor.dataset.tipo === 'pdf') {
            const marco = document.createElement('iframe');
            marco.className = 'comprobante-visor__pdf';
            marco.title = 'Comprobante de domicilio';
            marco.src = visor.dataset.url;
            marco.addEventListener('load', function () { cargando.classList.add('oculto'); });
            visor.appendChild(marco);
            return;
        }

        const imagen = new Image();
        imagen.className = 'comprobante-visor__imagen';
        imagen.alt = 'Comprobante de domicilio';
        imagen.addEventListener('load', function () {
            cargando.classList.add('oculto');
            visor.appendChild(imagen);
        });
        imagen.addEventListener('error', mostrarError);
        imagen.addEventListener('click', function () {
            imagen.classList.toggle('acercada');
            visor.classList.toggle('con-zoom');
        });
        imagen.src = visor.dataset.url;
    }

    modal.addEventListener('show.bs.modal', cargar);

    // Al cerrar se regresa la imagen a su tamaño normal
    modal.addEventListener('hidden.bs.modal', function () {
        const imagen = visor.querySelector('.comprobante-visor__imagen');
        if (imagen) {
            imagen.classList.remove('acercada');
            visor.classList.remove('con-zoom');
        }
    });
})();
