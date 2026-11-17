/* ============================================================
   MODAL "DOCUMENTACIÓN DE LA VENTA" (Ver Ventas)
   Pide a ver_documentacion.php la lista de archivos y la muestra.
   ============================================================ */
(function () {
    const modal = document.getElementById('modalDocumentos');
    const cuerpo = document.getElementById('modalDocumentosCuerpo');
    const subtitulo = document.getElementById('modalDocumentosSubtitulo');

    if (!modal || typeof modal.showModal !== 'function') {
        return;
    }

    const ICONOS = { pdf: 'fa-file-pdf', jpg: 'fa-file-image', jpeg: 'fa-file-image', png: 'fa-file-image' };

    // Crea un elemento con clase y texto (el texto nunca se interpreta como HTML)
    function crear(etiqueta, clase, texto) {
        const elemento = document.createElement(etiqueta);
        if (clase) {
            elemento.className = clase;
        }
        if (texto !== undefined) {
            elemento.textContent = texto;
        }
        return elemento;
    }

    function icono(clases) {
        const i = document.createElement('i');
        i.className = clases;
        return i;
    }

    function mostrarCargando() {
        cuerpo.replaceChildren(crear('div', 'esqueleto'), crear('div', 'esqueleto'));
    }

    function mostrarMensaje(iconoClase, titulo, texto) {
        const vacio = crear('div', 'vacio');
        const circulo = crear('span', 'vacio__icono');
        circulo.appendChild(icono('fas ' + iconoClase));
        vacio.append(circulo, crear('h3', '', titulo), crear('p', '', texto));
        cuerpo.replaceChildren(vacio);
    }

    function mostrarDocumentos(documentos) {
        if (documentos.length === 0) {
            mostrarMensaje('fa-folder-open', 'Sin documentación', 'Esta venta no tiene comprobantes ni conversaciones cargadas.');
            return;
        }

        const lista = crear('ul', 'documentos');

        documentos.forEach(function (documento, indice) {
            const item = crear('li', 'documento');
            item.style.animationDelay = (indice * 0.05) + 's';

            const caja = crear('span', 'documento__icono' + (documento.extension === 'pdf' ? ' documento__icono--pdf' : ''));
            caja.appendChild(icono('fas ' + (ICONOS[documento.extension] || 'fa-file')));

            const datos = crear('span', 'documento__datos');
            datos.append(
                crear('strong', '', documento.titulo),
                crear('small', '', (documento.extension || 'archivo').toUpperCase() + (documento.fecha ? ' · ' + documento.fecha : ''))
            );

            const enlace = crear('a', 'boton boton--suave boton--chico');
            enlace.href = documento.url;
            enlace.target = '_blank';
            enlace.rel = 'noopener';
            enlace.append(icono('fas fa-arrow-up-right-from-square'), document.createTextNode(' Abrir'));

            item.append(caja, datos, enlace);
            lista.appendChild(item);
        });

        cuerpo.replaceChildren(lista);
    }

    async function abrir(idVenta, idLead) {
        subtitulo.textContent = 'Venta #' + idVenta + (idLead ? ' · ID Lead ' + idLead : '');
        mostrarCargando();
        modal.showModal();

        try {
            const respuesta = await fetch('ver_documentacion.php?id=' + encodeURIComponent(idVenta), {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });

            if (respuesta.status === 401) {
                window.location.href = '../loginn/login.html';
                return;
            }

            const datos = await respuesta.json();
            if (!respuesta.ok || !datos.ok) {
                mostrarMensaje('fa-triangle-exclamation', 'No se pudo cargar', datos.mensaje || 'Intenta de nuevo en un momento.');
                return;
            }

            mostrarDocumentos(datos.documentos);
        } catch (error) {
            mostrarMensaje('fa-wifi', 'Sin conexión', 'No se pudo consultar la documentación. Revisa tu conexión e intenta de nuevo.');
        }
    }

    document.addEventListener('click', function (evento) {
        const boton = evento.target.closest('[data-documentos]');
        if (boton) {
            abrir(boton.dataset.documentos, boton.dataset.lead);
            return;
        }

        // Cerrar con la X o al hacer clic fuera del cuadro
        if (evento.target.closest('[data-cerrar-modal]') || evento.target === modal) {
            modal.close();
        }
    });
})();
