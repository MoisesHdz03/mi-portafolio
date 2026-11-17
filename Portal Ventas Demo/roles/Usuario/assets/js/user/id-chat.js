/*==========================================================
    VALIDACIÓN ID_CHAT SEGUN CCE
==========================================================*/
document.addEventListener("DOMContentLoaded", function () {

    // ============================================================
    // ELEMENTOS
    // ============================================================
    const CCE = document.getElementById("CCE");
    const ID_Chat = document.getElementById("ID_Chat");
    const ID_Chat_help = document.getElementById("ID_Chat_help");

    // ============================================================
    // VERIFICAR QUE EXISTAN LOS ELEMENTOS
    // ============================================================
    if (!CCE || !ID_Chat || !ID_Chat_help) {
        console.error("No se encontraron los elementos CCE o ID_Chat.");
        return;
    }

    // ============================================================
    // OBTENER LONGITUD REQUERIDA
    // ============================================================
    function obtenerLongitudChat() {
        const cceSeleccionado = CCE.value.trim();

        // Social Selling = 7 dígitos
        if (cceSeleccionado === "Social Selling" ||
            cceSeleccionado === "Viont") {
            return 7;
        }

        // Cualquier otro CCE = 10 dígitos
        return 10;
    }

    // ============================================================
    // ACTUALIZAR VALIDACIÓN DEL ID DEL CHAT
    // ============================================================
    function actualizarValidacionChat() {
        const cceSeleccionado = CCE.value.trim();
        console.log(
            "CCE seleccionado: [" + cceSeleccionado + "]"
        );

        // ========================================================
        // SI NO SE HA SELECCIONADO CCE
        // ========================================================
        if (cceSeleccionado === "") {
            ID_Chat.placeholder = "Seleccione primero el CCE";

            ID_Chat_help.textContent =
            "Seleccione primero un CCE.";

            ID_Chat.setCustomValidity(
                "Primero debes seleccionar el CCE."
            );
            return;
        }

        // ========================================================
        // OBTENER LONGITUD
        // ========================================================
        const longitudRequerida = obtenerLongitudChat();

        console.log(
            "Longitud requerida:",
            longitudRequerida
        );

        // ========================================================
        // ACTUALIZAR INFORMACIÓN VISUAL
        // ========================================================
        ID_Chat.placeholder =
            "Ingrese " + longitudRequerida + " dígitos";

        ID_Chat_help.textContent =
            "Ingrese exactamente " +
            longitudRequerida +
            " dígitos numéricos.";

        // ========================================================
        // LIMITAR FÍSICAMENTE LA CANTIDAD DE CARACTERES
        // ========================================================
        if (ID_Chat.value.length > longitudRequerida) {
            ID_Chat.value =
                ID_Chat.value.substring(0, longitudRequerida);
        }

        // ========================================================
        // LIMPIAR VALIDACIÓN ANTERIOR
        // ========================================================
        ID_Chat.setCustomValidity("");

        // ========================================================
        // VOLVER A VALIDAR
        // ========================================================
        if (ID_Chat.value !== "") {
            validarIDChat();
        }
    }

    // ============================================================
    // VALIDAR ID DEL CHAT
    // ============================================================
    function validarIDChat() {
        const cceSeleccionado = CCE.value.trim();

        // ========================================================
        // CCE NO SELECCIONADO
        // ========================================================
        if (cceSeleccionado === "") {
            ID_Chat.setCustomValidity(
                "Primero debes seleccionar el CCE."
            );
            return;
        }

        // ========================================================
        // LONGITUD REQUERIDA
        // ========================================================
        const longitudRequerida = obtenerLongitudChat();
        const valor = ID_Chat.value.trim();

        // ========================================================
        // CAMPO VACÍO
        // ========================================================
        if (valor === "") {
            ID_Chat.setCustomValidity(
                "El ID del Chat es obligatorio."
            );
            return;
        }

        // ========================================================
        // SOLO NÚMEROS
        // ========================================================
        const soloNumeros = /^\d+$/.test(valor);
        if (!soloNumeros) {
            ID_Chat.setCustomValidity(
                "El ID del Chat solo debe contener números."
            );
            return;
        }

        // ========================================================
        // LONGITUD EXACTA
        // ========================================================
        if (valor.length !== longitudRequerida) {
            ID_Chat.setCustomValidity(
                "El ID del Chat debe contener exactamente " +
                longitudRequerida +
                " dígitos numéricos."
            );
            return;
        }

        // ========================================================
        // CORRECTO
        // ========================================================
        ID_Chat.setCustomValidity("");
    }

    // ============================================================
    // CAMBIO DE CCE
    // ============================================================
    CCE.addEventListener("change", function () {
        actualizarValidacionChat();
    });

    // ============================================================
    // ESCRIBIR ID DEL CHAT
    // ============================================================
    ID_Chat.addEventListener("input", function () {

        // Solo permitir números
        this.value = this.value.replace(/\D/g, "");

        // Obtener límite actual
        const longitudRequerida = obtenerLongitudChat();

        // No permitir más caracteres de los necesarios
        if (this.value.length > longitudRequerida) {
            this.value =
                this.value.substring(0, longitudRequerida);
        }
        validarIDChat();
    });

    // ============================================================
    // SALIR DEL CAMPO
    // ============================================================
    ID_Chat.addEventListener("blur", function () {
        validarIDChat();
    });

    // ============================================================
    // ESTADO INICIAL
    // ============================================================
    actualizarValidacionChat();
});
