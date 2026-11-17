/*==========================================================
    MOTIVO DE NO VENTA DE STREAMING
    Muestra el select de motivo cuando VentaSE = NO.
==========================================================*/
document.addEventListener("DOMContentLoaded", function () {
    const ventaSE = document.getElementById("VentaSE");
    const contenedor = document.getElementById("motivoStreamingGroup");
    const selectMotivo = document.getElementById("FK_Motivo_Streaming");

    function toggleMotivo() {
        if (ventaSE.value === "NO") {
            contenedor.style.display = "block";
            selectMotivo.setAttribute("required", "required");
        } else {
            contenedor.style.display = "none";
            selectMotivo.removeAttribute("required");
            selectMotivo.value = ""; // limpia selección
        }
    }

    // Ejecutar al cambiar
    ventaSE.addEventListener("change", toggleMotivo);

    // Ejecutar al cargar (por si hay valores previos)
    toggleMotivo();
});
