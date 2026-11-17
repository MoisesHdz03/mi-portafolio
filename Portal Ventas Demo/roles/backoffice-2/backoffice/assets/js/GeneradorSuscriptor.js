// Generador de Suscriptor a 7 digitos
function generarSuscriptor() {
    const input = document.getElementById("CalculoNumeroSuscriptor").value.trim();

     // Validar que no este vacio
    if (input === "") {
        alert("El campo no puede estar vacío.")
        return;
    }

     // Validar que solo sean números
    if (!/^\d+$/.test(input)) {
        alert("Solo se permiten números.");
        return;
    }

     // Validar que tenga exactamente 10 dígitos
    if (input.length !== 10) {
        alert("El número debe tener exactamente 10 dígitos.");
        return;
    }

     // Tomar los ultimos 7 digitos
    let ultimos7 = input.slice(-7);

     // Quitar ceros a la izquierda
    let resultado = ultimos7.replace(/^0+/, '');

     // Si queda vacio (1110000000)
    if (resultado === "") {
        resultado = "0";
    }

     // Asignar al campo final
    document.getElementById("NumSuscriptor").value = resultado;
}

// Button deshabilitado hasta que pongan estatus
document.addEventListener("DOMContentLoaded", function () {
    const estatus = document.getElementById("estatus-backoffice");
    const boton = document.getElementById("btnGenerarSuscriptor");

    function validarEstatus() {
        // Si el select tiene valor (no vacío)
        if (estatus.value !== "") {
            boton.disabled = false; // Boton se habilita
        } else {
            boton.disabled = true; // Se queda deshabilitado
        }
    }

    // Validar al cargar
    validarEstatus();

    // Validar cuando el usuario cambie el select
    estatus.addEventListener("change", validarEstatus);
}) 

// NumSuscriptor = Requerided siempre y cuando estatus-backoffice = INGRESADA
document.addEventListener("DOMContentLoaded", function () {
    const estatus = document.getElementById("estatus-backoffice");
    const numSuscriptor = document.getElementById("NumSuscriptor");

    function validarRequeridoSuscriptor() {
        if (estatus.value === "INGRESADA") {
            numSuscriptor.setAttribute("required", "required"); // Se le agrega el atributo requrido si es INGRESADA
        } else {
            numSuscriptor.removeAttribute("required"); // De lo contrario se le quita el atributo
        }
    }

    // Ejecutar al cargar
    validarRequeridoSuscriptor();

    // Ejecutar cuando cambie el estatus
    estatus.addEventListener("change", validarRequeridoSuscriptor);
});

// Bloquear el envio del form si no genera suscriptor
document.getElementById("form-venta").addEventListener("submit", function (e) {
    const estatus = document.getElementById("estatus-backoffice").value;
    const numSuscriptor = document.getElementById("NumSuscriptor").value.trim();

    if (estatus === "INGRESADA" && numSuscriptor === "") { // Si el estatus de backoffice es ingresa y el suscriptor vacio
        e.preventDefault(); // Se detiene el envio
        alert("Debes de generar el suscriptor antes de guardar la venta.");
    }
});