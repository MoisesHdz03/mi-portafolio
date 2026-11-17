/* ============================================================
   PAPELETA DE LA VENTA (modificar.php)
   El motivo y el comentario de rechazo de Backoffice solo se
   muestran cuando Backoffice rechazó la venta.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    const estatusBackoffice = document.getElementById('estatus-backoffice');
    const seccionMotivo = document.getElementById('seccion-motivo-backoffice');

    if (estatusBackoffice && seccionMotivo) {
        seccionMotivo.style.display = estatusBackoffice.value === 'RECHAZADA' ? '' : 'none';
    }
});
