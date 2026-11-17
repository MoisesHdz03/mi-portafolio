/* ============================================================
   MODIFICAR UNA VENTA (modificar.php)
   - Vista previa de los archivos de la venta: sólo se ven,
     sin botón de descarga (el PDF se abre sin barra de herramientas
     y la imagen no se puede arrastrar ni abrir con clic derecho).
   - Marca los campos cambiados y cuenta los cambios en la barra
     de guardado.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    iniciarVistaArchivos();
    iniciarContadorCambios();
});

function iniciarVistaArchivos() {
    const ventana = document.getElementById('modalArchivo');
    const contenedor = document.getElementById('vistaArchivo');

    if (!ventana || !window.bootstrap) {
        return;
    }

    const modal = new bootstrap.Modal(ventana);

    document.querySelectorAll('.btn-ver-archivo').forEach(function (boton) {
        boton.addEventListener('click', function () {
            document.getElementById('modalArchivoTitulo').textContent = boton.dataset.titulo;
            contenedor.replaceChildren();
            contenedor.classList.add('cargando');

            let vista;
            if (boton.dataset.pdf === '1') {
                vista = document.createElement('iframe');
                vista.src = boton.dataset.url + '#toolbar=0&navpanes=0';
                vista.title = boton.dataset.titulo;
            } else {
                vista = document.createElement('img');
                vista.src = boton.dataset.url;
                vista.alt = boton.dataset.titulo;
                vista.draggable = false;
            }

            vista.addEventListener('load', function () { contenedor.classList.remove('cargando'); });
            vista.addEventListener('error', function () {
                contenedor.classList.remove('cargando');
                contenedor.innerHTML = '<p class="vista-error"><i class="fas fa-triangle-exclamation"></i> No se pudo cargar el archivo.</p>';
            });
            contenedor.appendChild(vista);
            modal.show();
        });
    });

    // Sin menú de clic derecho (evita "Guardar imagen como...")
    contenedor.addEventListener('contextmenu', function (evento) { evento.preventDefault(); });

    // Al cerrar se quita el archivo para que no quede cargado
    ventana.addEventListener('hidden.bs.modal', function () { contenedor.replaceChildren(); });
}

function iniciarContadorCambios() {
    const formulario = document.getElementById('formVenta');
    const estado = document.getElementById('estadoCambios');

    if (!formulario || !estado) {
        return;
    }

    const campos = Array.from(formulario.querySelectorAll('[name]:not([type="hidden"]):not([type="submit"]):not(button)'));
    const originales = new Map(campos.map(function (campo) { return [campo, campo.value]; }));

    function actualizar() {
        let cambios = 0;

        campos.forEach(function (campo) {
            const cambiado = campo.value !== originales.get(campo);
            campo.closest('.campo')?.classList.toggle('campo--cambiado', cambiado);
            cambios += cambiado ? 1 : 0;
        });

        estado.classList.toggle('hay-cambios', cambios > 0);
        estado.querySelector('i').className = cambios > 0 ? 'fas fa-pen' : 'fas fa-circle-check';
        estado.querySelector('span').textContent = cambios === 0
            ? 'Sin cambios'
            : cambios + (cambios === 1 ? ' campo modificado' : ' campos modificados');
    }

    formulario.addEventListener('input', actualizar);
    formulario.addEventListener('change', actualizar);
}
