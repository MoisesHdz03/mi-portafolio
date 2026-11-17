/*==========================================================
    RECORDATORIO COMERCIAL (PROMO)
==========================================================*/
document.addEventListener("DOMContentLoaded", () => {
    const paqueteSelect = document.getElementById("Paquetes");
    const overlay = document.getElementById("salesReminderOverlay");
    const modal = overlay ? overlay.querySelector(".srp-modal") : null;
    const boton = document.getElementById("salesReminderButton");
    const botonTexto = boton ? boton.querySelector(".srp-cerrar-txt") : null;

    if (!paqueteSelect || !overlay || !modal || !boton || !botonTexto) {
        return;
    }

    const SEGUNDOS_CANDADO = 2; // debe coincidir con --srp-candado en el CSS
    const CONTEO_RETRASO_MS = 450;
    const CONTEO_DURACION_MS = 900;

    const contadores = Array.from(overlay.querySelectorAll("[data-srp-count]"));

    let popupMostrado = false;
    let contador = SEGUNDOS_CANDADO;
    let intervalo = null;
    let conteoTimeout = null;
    let conteoFrame = null;

    /*==============================================
        BOTÓN CERRAR: BLOQUEADO / DESBLOQUEADO
    ==============================================*/
    function bloquearBoton() {
        boton.disabled = true;
        botonTexto.textContent = String(contador);
        boton.setAttribute(
            "aria-label",
            `Podrás cerrar en ${contador} ${contador === 1 ? "segundo" : "segundos"}`
        );
    }

    function desbloquearBoton() {
        boton.disabled = false;
        botonTexto.textContent = "×";
        boton.setAttribute("aria-label", "Cerrar");
    }

    /*==============================================
        CONTEO ANIMADO DE LAS CIFRAS (200 y 700)
        El HTML ya trae el valor final; esto solo lo anima.
    ==============================================*/
    function valorFinal(el) {
        const n = parseInt(el.dataset.srpCount, 10);
        return Number.isFinite(n) ? n : null;
    }

    function fijarCifras() {
        clearTimeout(conteoTimeout);
        cancelAnimationFrame(conteoFrame);

        contadores.forEach((el) => {
            const fin = valorFinal(el);
            if (fin !== null) el.textContent = String(fin);
        });
    }

    function animarCifras() {
        fijarCifras();

        const sinMovimiento =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const animables = contadores.filter((el) => valorFinal(el) !== null);

        if (sinMovimiento || animables.length === 0) return;

        animables.forEach((el) => {
            el.textContent = "0";
        });

        conteoTimeout = setTimeout(() => {
            const inicio = performance.now();

            const paso = (ahora) => {
                const t = Math.min((ahora - inicio) / CONTEO_DURACION_MS, 1);
                const avance = 1 - Math.pow(1 - t, 3);

                animables.forEach((el) => {
                    el.textContent = String(Math.round(valorFinal(el) * avance));
                });

                if (t < 1) {
                    conteoFrame = requestAnimationFrame(paso);
                }
            };

            conteoFrame = requestAnimationFrame(paso);
        }, CONTEO_RETRASO_MS);
    }

    /*==============================================
        MOSTRAR POPUP
    ==============================================*/
    function mostrarPopup() {
        if (popupMostrado) return;

        popupMostrado = true;
        contador = SEGUNDOS_CANDADO;

        clearInterval(intervalo);
        bloquearBoton();

        overlay.classList.add("active");
        document.body.style.overflow = "hidden";

        const cuerpo = modal.querySelector(".srp-cuerpo");
        if (cuerpo) cuerpo.scrollTop = 0;

        // Saca el foco del select para que el teclado no siga cambiando el paquete
        modal.focus();

        animarCifras();
        iniciarContador();
    }

    /*==============================================
        CONTADOR
    ==============================================*/
    function iniciarContador() {
        intervalo = setInterval(() => {
            contador--;

            if (contador > 0) {
                bloquearBoton();
                return;
            }

            clearInterval(intervalo);
            desbloquearBoton();

            if (overlay.classList.contains("active")) {
                boton.focus();
            }
        }, 1000);
    }

    /*==============================================
        CERRAR
    ==============================================*/
    function cerrarPopup() {
        clearInterval(intervalo);
        fijarCifras();
        overlay.classList.remove("active");
        document.body.style.overflow = "";
        paqueteSelect.focus();
    }

    /*==============================================
        BOTÓN
    ==============================================*/
    boton.addEventListener("click", cerrarPopup);

    /*==============================================
        ESC (respeta el candado)
    ==============================================*/
    document.addEventListener("keydown", (e) => {
        if (
            e.key === "Escape" &&
            overlay.classList.contains("active") &&
            !boton.disabled
        ) {
            cerrarPopup();
        }
    });

    /*==============================================
        MOSTRAR AL ELEGIR PAQUETE
    ==============================================*/
    paqueteSelect.addEventListener("change", function () {
        if (this.value === "") return;

        setTimeout(() => {
            mostrarPopup();
        }, 300);
    });

    /*==============================================
        RESETEAR
    ==============================================*/
    window.resetSalesReminder = function () {
        popupMostrado = false;

        clearInterval(intervalo);
        fijarCifras();

        contador = SEGUNDOS_CANDADO;
        bloquearBoton();

        overlay.classList.remove("active");
        document.body.style.overflow = "";
    };
});
