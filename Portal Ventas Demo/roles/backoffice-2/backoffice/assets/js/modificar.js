/* ============================================================
   FORMULARIO DE MODIFICACIÓN DE VENTA (BACKOFFICE)
   El generador de suscriptor está en GeneradorSuscriptor.js
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    iniciarMotivoRechazo();
    iniciarLimpiezaSuscriptor();
});

/* La fecha de Backoffice siempre muestra el día actual */
window.addEventListener('load', colocarFechaBackoffice);

function colocarFechaBackoffice() {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');

    document.getElementById('Fecha_Backoffice').value = `${anio}-${mes}-${dia}`;
}

/* La sección de motivo de rechazo solo se ve si Estatus Backoffice = "RECHAZADA" */
function iniciarMotivoRechazo() {
    const estatus = document.getElementById('estatus-backoffice');
    const seccion = document.getElementById('seccion-motivo-rechazo');

    function actualizar() {
        seccion.style.display = estatus.value === 'RECHAZADA' ? 'block' : 'none';
    }

    estatus.addEventListener('change', actualizar);
    actualizar();
}

/* Número de suscriptor: solo dígitos, máximo 7 y sin ceros al inicio */
function iniciarLimpiezaSuscriptor() {
    document.getElementById('NumSuscriptor').addEventListener('blur', function () {
        this.value = this.value
            .replace(/\D/g, '')
            .slice(0, 7)
            .replace(/^0+/, '');
    });
}
