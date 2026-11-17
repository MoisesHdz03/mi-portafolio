/* ============================================================
   FORMULARIO DE MODIFICACIÓN DE VENTA (COBRADOR)
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    colocarFechaDeCobro();
    iniciarMotivoRechazo();
    iniciarMotivoNoDomicilia();
    iniciarMotivoRechazoCobrador();
});

/* La fecha de cobro siempre muestra el día actual */
function colocarFechaDeCobro() {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');

    document.getElementById('fecha_venta').value = `${anio}-${mes}-${dia}`;
}

/* La sección de motivo de rechazo solo se ve si Backoffice la rechazó */
function iniciarMotivoRechazo() {
    const estatus = document.getElementById('estatus-backoffice');
    const seccion = document.getElementById('motivo_rechazo');

    function actualizar() {
        seccion.style.display = estatus.value === 'RECHAZADA' ? 'block' : 'none';
    }

    estatus.addEventListener('change', actualizar);
    actualizar();
}

/* El motivo de no domiciliar solo se ve si Banco = "No domicilia" */
function iniciarMotivoNoDomicilia() {
    const banco = document.getElementById('Banco');
    const contenedor = document.getElementById('contenedorMotivoNoDomicilia');

    function actualizar() {
        contenedor.style.display = banco.value === 'No domicilia' ? 'block' : 'none';
    }

    banco.addEventListener('change', actualizar);
    actualizar();
}

/* El motivo de rechazo del cobrador solo se ve si Estatus Cobrador = "RECHAZADA" */
function iniciarMotivoRechazoCobrador() {
    const estatus = document.getElementById('status_ingreso');
    const contenedor = document.getElementById('contenedorMotivoRechazoCobrador');
    const motivo = contenedor.querySelector('select');

    function actualizar() {
        // Al quitar "none" recupera el estilo normal de .field, igual que los campos vecinos
        contenedor.style.display = estatus.value === 'RECHAZADA' ? '' : 'none';
    }

    estatus.addEventListener('change', function () {
        actualizar();

        // Si deja de estar rechazada, no se guarda un motivo que ya no se ve
        if (estatus.value !== 'RECHAZADA') {
            motivo.value = '';
        }
    });

    actualizar();
}
