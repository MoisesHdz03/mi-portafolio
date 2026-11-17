document.addEventListener('DOMContentLoaded', function () {

    const modalPassword = document.getElementById('modalPasswordVigente');

    modalPassword.addEventListener('show.bs.modal', function () {

        // Restaurar valores mientras consulta
        document.getElementById('passwordVigente').textContent = "Consultando...";
        document.getElementById('fechaGeneracion').textContent = "--";
        document.getElementById('vigenciaPassword').textContent = "--";

        const estadoPassword = document.getElementById('estadoPassword');
        estadoPassword.className = "badge bg-secondary fs-6";
        estadoPassword.textContent = "Consultando...";

        fetch('password/obtener_password_vigente.php')

            .then(response => response.json())

            .then(data => {

                if (data.success) {

                    document.getElementById('passwordVigente').textContent = data.password;

                    document.getElementById('fechaGeneracion').textContent =
                        formatearFechaHora(data.fecha_generacion);

                    document.getElementById('vigenciaPassword').textContent =
                        formatearFecha(data.fecha_inicio) + " al " +
                        formatearFecha(data.fecha_fin);


                    // ============================
                    // Validar si la contraseña sigue vigente
                    // ============================

                    const hoy = new Date();

                    const fechaInicio = new Date(data.fecha_inicio + "T00:00:00");
                    const fechaFin = new Date(data.fecha_fin + "T23:59:59");

                    if (hoy >= fechaInicio && hoy <= fechaFin) {

                        estadoPassword.className = "badge bg-success fs-6";
                        estadoPassword.textContent = "🟢 Vigente";

                    } else {

                        estadoPassword.className = "badge bg-danger fs-6";
                        estadoPassword.textContent = "🔴 Expirada";

                    }

                } else {

                    document.getElementById('passwordVigente').textContent = "Sin contraseña";
                    document.getElementById('fechaGeneracion').textContent = "--";
                    document.getElementById('vigenciaPassword').textContent = data.message;

                    estadoPassword.className = "badge bg-secondary fs-6";
                    estadoPassword.textContent = "Sin información";

                }

            })

            .catch(error => {

                console.error(error);

                document.getElementById('passwordVigente').textContent = "Error";
                document.getElementById('fechaGeneracion').textContent = "--";
                document.getElementById('vigenciaPassword').textContent =
                    "No fue posible consultar la contraseña.";

                estadoPassword.className = "badge bg-danger fs-6";
                estadoPassword.textContent = "Error";

            });

    });

});


function formatearFecha(fecha) {

    const f = new Date(fecha + "T00:00:00");

    return f.toLocaleDateString('es-MX');

}


function formatearFechaHora(fechaHora) {

    const f = new Date(fechaHora);

    return f.toLocaleString('es-MX');

}


document.addEventListener("click", function (e) {

    if (e.target.closest('#btnCopiarPassword')) {

        const password = document.getElementById("passwordVigente").textContent.trim();

        if (
            password === "" ||
            password === "Consultando..." ||
            password === "Sin contraseña" ||
            password === "Error"
        ) {
            return;
        }

        navigator.clipboard.writeText(password)

            .then(() => {

                const boton = document.getElementById("btnCopiarPassword");

                boton.innerHTML =
                    '<i class="fas fa-check"></i> Copiado';

                setTimeout(() => {

                    boton.innerHTML =
                        '<i class="fas fa-copy"></i> Copiar contraseña';

                }, 2000);

            })

            .catch(error => {

                console.error(error);

            });

    }

});