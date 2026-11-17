/* ============================================================
   COMENTARIO DE DOMICILIACIÓN (Ver Ventas)
   - Muestra el resultado del guardado (?comentario_estado=...).
   - Abre la ventana con el comentario de la venta elegida.
   Los textos de los resultados llegan desde PHP en data-mensajes del <script>.
   ============================================================ */
(function () {
    const MENSAJES = JSON.parse(document.currentScript.dataset.mensajes || '{}');

    document.addEventListener('DOMContentLoaded', function () {
        mostrarResultadoGuardado();
        iniciarVentanaComentario();
    });

    /* Muestra una sola vez el resultado y lo quita de la dirección */
    function mostrarResultadoGuardado() {
        const parametros = new URLSearchParams(window.location.search);
        const estado = parametros.get('comentario_estado');

        if (!estado) {
            return;
        }

        alert(MENSAJES[estado] || 'La operación ha finalizado.');

        parametros.delete('comentario_estado');
        const consulta = parametros.toString();
        history.replaceState({}, document.title, window.location.pathname + (consulta ? '?' + consulta : '') + window.location.hash);
    }

    function iniciarVentanaComentario() {
        const ventana = document.getElementById('comentarioVentaModal');

        // Quien no puede comentar no tiene la ventana
        if (!ventana) {
            return;
        }

        const texto = document.getElementById('comentarioVentaTexto');
        const idVenta = document.getElementById('comentarioVentaId');
        const referencia = document.getElementById('comentarioVentaReferencia');
        const contador = document.getElementById('comentarioContador');
        const botonGuardar = document.getElementById('guardarComentario');
        const maximo = Number(contador.dataset.maximo);

        function actualizarContador() {
            contador.textContent = texto.value.length + ' / ' + maximo + ' caracteres';
        }

        function abrir(boton) {
            const comentario = boton.dataset.comentario || '';

            idVenta.value = boton.dataset.ventaId;
            referencia.textContent = 'Venta #' + boton.dataset.ventaId;
            texto.value = comentario;
            botonGuardar.textContent = comentario.trim() !== '' ? 'Guardar cambios' : 'Agregar Comentario';
            actualizarContador();

            ventana.hidden = false;
            document.body.style.overflow = 'hidden';
            texto.focus();
        }

        function cerrar() {
            ventana.hidden = true;
            document.body.style.overflow = '';
        }

        document.querySelectorAll('.comentario-venta-btn').forEach(function (boton) {
            boton.addEventListener('click', function () { abrir(boton); });
        });

        texto.addEventListener('input', actualizarContador);
        document.getElementById('cerrarComentarioX').addEventListener('click', cerrar);
        document.getElementById('cancelarComentario').addEventListener('click', cerrar);

        // Clic en el fondo oscuro o tecla Escape cierran la ventana
        ventana.addEventListener('click', function (evento) {
            if (evento.target === ventana) {
                cerrar();
            }
        });

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && !ventana.hidden) {
                cerrar();
            }
        });
    }
})();
