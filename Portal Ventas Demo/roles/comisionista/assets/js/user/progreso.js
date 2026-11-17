/*==========================================================
    PROGRESO DE LA VENTA (solo visual)
    Lee los campos obligatorios de cada sección y pinta la
    barra de progreso. No modifica valores ni el envío.
==========================================================*/
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-venta");
    const barra = document.getElementById("progresoBarra");
    const porcentaje = document.getElementById("progresoPorcentaje");
    const enlaces = Array.from(document.querySelectorAll("[data-progreso]"));

    if (!form || !barra || !porcentaje || enlaces.length === 0) {
        return;
    }

    const pasos = enlaces
        .map((enlace) => ({
            enlace,
            seccion: document.getElementById(enlace.dataset.progreso),
        }))
        .filter((paso) => paso.seccion);

    function camposObligatorios(seccion) {
        return Array.from(
            seccion.querySelectorAll("input[required], select[required], textarea[required]")
        ).filter((campo) => !campo.disabled);
    }

    function actualizar() {
        let total = 0;
        let listos = 0;

        pasos.forEach(({ enlace, seccion }) => {
            const campos = camposObligatorios(seccion);
            const validos = campos.filter((campo) => campo.validity.valid).length;
            const completa = campos.length > 0 && validos === campos.length;

            total += campos.length;
            listos += validos;

            enlace.classList.toggle("is-complete", completa);
            seccion.classList.toggle("is-complete", completa);
        });

        const valor = total === 0 ? 0 : Math.round((listos / total) * 100);
        barra.style.width = valor + "%";
        porcentaje.textContent = valor + "%";
        barra.parentElement.classList.toggle("is-full", valor === 100);
    }

    let pendiente = null;
    function programar() {
        clearTimeout(pendiente);
        pendiente = setTimeout(actualizar, 80);
    }

    form.addEventListener("input", programar);
    form.addEventListener("change", programar);
    form.addEventListener("focusout", programar);

    // La sucursal se llena por AJAX sin disparar eventos del campo
    if (window.jQuery) {
        window.jQuery(document).ajaxComplete(programar);
    }

    /*==============================================
        PASO ACTUAL SEGÚN EL SCROLL
    ==============================================*/
    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver(
            (entradas) => {
                entradas.forEach((entrada) => {
                    if (!entrada.isIntersecting) return;

                    pasos.forEach(({ enlace, seccion }) => {
                        enlace.classList.toggle("is-current", seccion === entrada.target);
                    });
                });
            },
            { rootMargin: "-35% 0px -60% 0px" }
        );

        pasos.forEach(({ seccion }) => observador.observe(seccion));
    }

    // Estado inicial (después de que otros scripts llenan la fecha)
    setTimeout(actualizar, 0);
});
