/* ============================================================
   FORMULARIO DE MODIFICACIÓN DE VENTA (VALIDACIÓN)
   El envío de SMS y la comprobación del NIP están en otp.js
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    iniciarMotivoRechazoValidacion();
    mostrarMotivoRechazoBackoffice();
});

/* La fecha de validación muestra el día actual */
window.addEventListener('load', colocarFechaValidacion);

function colocarFechaValidacion() {
    // En una venta RECHAZADA el campo no existe
    const campo = document.getElementById('Fecha_Validacion');

    if (!campo) {
        return;
    }

    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');

    campo.value = `${anio}-${mes}-${dia}`;
}

/* El motivo de rechazo de validación solo se ve si el estatus es "RECHAZADA" */
function iniciarMotivoRechazoValidacion() {
    const estatus = document.getElementById('estatus');
    const contenedor = document.querySelector('.rechazo-validacion');

    function actualizar() {
        contenedor.style.display = estatus.value === 'RECHAZADA' ? 'block' : 'none';
    }

    estatus.addEventListener('change', actualizar);
    actualizar();
}

/* El motivo de rechazo de Backoffice solo se ve si Backoffice la rechazó */
function mostrarMotivoRechazoBackoffice() {
    const estatusBackoffice = document.getElementById('estatus-backoffice');
    const seccion = document.getElementById('seccion-motivo-rechazo');

    seccion.style.display = estatusBackoffice.value === 'RECHAZADA' ? 'block' : 'none';
}
