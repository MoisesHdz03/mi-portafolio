/* ============================================================
   PAPELETA DE LA VENTA (modificar.php)
   - El motivo y comentario de rechazo de Backoffice solo se ven
     cuando Backoffice rechazó la venta.
   - El contacto de referencia avisa si no son 10 dígitos.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    mostrarMotivoBackoffice();
    validarTelefonosConAviso();
});

function mostrarMotivoBackoffice() {
    const estatus = document.getElementById('estatus-backoffice');
    const seccion = document.getElementById('seccion-motivo-backoffice');

    if (estatus && seccion) {
        seccion.style.display = estatus.value === 'RECHAZADA' ? 'block' : 'none';
    }
}

/* Los campos con data-aviso muestran su aviso si el valor no son 10 dígitos */
function validarTelefonosConAviso() {
    document.querySelectorAll('input[data-aviso]').forEach(function (campo) {
        const aviso = document.getElementById(campo.dataset.aviso);

        function revisar() {
            campo.value = campo.value.replace(/\D/g, '').slice(0, 10);
            aviso.classList.toggle('visible', campo.value !== '' && campo.value.length !== 10);
        }

        campo.addEventListener('input', revisar);
        revisar();
    });
}
