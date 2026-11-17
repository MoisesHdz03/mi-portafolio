/*==========================================================
    FORMULARIO DE VENTA: validaciones y campos dinámicos
==========================================================*/

// ===== Fecha Automática =====
document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("FechaV")
  const fechaActual = new Date()
  const anio = fechaActual.getFullYear()
  const mes = String(fechaActual.getMonth() + 1).padStart(2, "0")
  const dia = String(fechaActual.getDate()).padStart(2, "0")
  fechaInput.value = `${anio}-${mes}-${dia}`
})

// ===== Validación de Correo =====
function validarCorreo(input) {
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const errorMessage = document.getElementById("error-correo")

  if (!regexCorreo.test(input.value)) {
    errorMessage.style.display = "block"
  } else {
    errorMessage.style.display = "none"
  }
}

// ===== Validación de Números de Teléfono =====
function ValidarNumero(input, errorId) {
  const errorMessage = document.getElementById(errorId)

  if ((input.id === "Telefonocasa" || input.id === "Telefonocelular") && input.value.trim() === "") {
    errorMessage.style.display = "block"
    errorMessage.innerText = "Este campo es obligatorio."
    return
  }

  if (/^(0|1)/.test(input.value)) {
    errorMessage.style.display = "block"
    errorMessage.innerText = "El número no puede empezar con 0 ni con 1."
    return
  }

  if (/\D/.test(input.value)) {
    errorMessage.style.display = "block"
    errorMessage.innerText = "Solo se permiten números."
  } else if (input.value.length < 10) {
    errorMessage.style.display = "block"
    errorMessage.innerText = "El número debe contener exactamente 10 dígitos."
  } else {
    errorMessage.style.display = "none"
  }

  input.value = input.value.replace(/\D/g, "")

  if (input.value.length > 10) {
    input.value = input.value.slice(0, 10)
  }
}

// ===== Verificar que los Teléfonos no Coincidan =====
function validarNumerosDiferentes() {
  const telefonoCasa = document.getElementById("Telefonocasa")
  const telefonoCelular = document.getElementById("Telefonocelular")
  const mensajeError = document.getElementById("error-diferencia-numeros")

  if (telefonoCasa.value === telefonoCelular.value && telefonoCasa.value !== "") {
    mensajeError.style.display = "block"
    mensajeError.innerText = "El teléfono de casa y de celular no deberían coincidir."
  } else {
    mensajeError.style.display = "none"
  }
}

document.getElementById("Telefonocasa").addEventListener("input", validarNumerosDiferentes)
document.getElementById("Telefonocelular").addEventListener("input", validarNumerosDiferentes)

// ===== Validación de RFC =====
function validarRFC(input) {
  input.value = input.value.toUpperCase()
  const rfc = input.value
  const regexRFC = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{13}$/
  const errorMessage = document.getElementById("error-rfc")

  if (!regexRFC.test(rfc)) {
    errorMessage.style.display = "block"
    errorMessage.innerText = "El RFC debe contener exactamente 13 caracteres alfanuméricos."
    return false
  } else {
    errorMessage.style.display = "none"
  }
}

// ===== Streaming Services =====
document.getElementById("VentaSE").addEventListener("change", function () {
  var streamingServices = document.getElementById("streamingServices")
  if (this.value === "SI") {
    streamingServices.style.display = "block"
  } else {
    streamingServices.style.display = "none"
    resetStreamingServices()
  }
})

function resetStreamingServices() {
  var streamingServices = document.getElementById("streamingServices")
  var selectors = streamingServices.querySelectorAll("select")
  selectors.forEach((select) => {
    select.value = "-"
  })
}

// ===== Paquetes Display =====
document.addEventListener("DOMContentLoaded", () => {
  var paquetesSelect = document.getElementById("Paquetes")
  var viewFormulario = document.getElementById("view-formulario")

  paquetesSelect.addEventListener("change", function () {
    var selectedValue = this.value
    if (selectedValue !== "off" && selectedValue !== "") {
      viewFormulario.classList.remove("hidden")
    } else {
      viewFormulario.classList.add("hidden")
    }
  })
})

// ===== Validar Servicios de Streaming =====
document.getElementById("form-venta").addEventListener("submit", (e) => {
  var ventaSE = document.getElementById("VentaSE").value
  if (ventaSE === "SI" && !isAnyServiceSelected()) {
    e.preventDefault()
    alert("Debes seleccionar al menos un servicio de streaming si el cliente sí lo desea")
  }
})

function isAnyServiceSelected() {
  var streamingServices = document.getElementById("streamingServices")
  var selectors = streamingServices.querySelectorAll("select")
  return Array.from(selectors).some((select) => select.value !== "-")
}

// ===== Validar Paquetes según Tipo de Cliente =====
document.getElementById("TipoCliente").addEventListener("change", function () {
  const tipoCliente = this.value
  const paqueteSelect = document.getElementById("Paquetes")

  paqueteSelect.innerHTML = "<option value='' disabled selected>Seleccione un paquete</option>"

  if (tipoCliente === "Nuevo") {
    paqueteSelect.innerHTML += '<option value="Doble Pack">Doble Pack</option>'
    paqueteSelect.innerHTML += '<option value="Triple Pack">Triple Pack</option>'
  } else if (tipoCliente === "Actual") {
    paqueteSelect.innerHTML += '<option value="Servicios Premier">Servicios Premier</option>'
  }
})

// ===== Animaciones de Entrada =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1"
      entry.target.style.transform = "translateY(0)"
    }
  })
}, observerOptions)

document.querySelectorAll(".form-section").forEach((section) => {
  section.style.opacity = "0"
  section.style.transform = "translateY(20px)"
  section.style.transition = "opacity 0.5s ease, transform 0.5s ease"
  observer.observe(section)
})

// Mostrar campo de motivo no domiciliar
document.getElementById('Desea_Domiciliar').addEventListener('change', function() {
  const motivoDiv = document.getElementById('motivo_domiciliar_div');

  if (this.value === "0") {
    // Si selecciona "No"
    motivoDiv.style.display = "block";
  } else {
    // Si selecciona "Si"
    motivoDiv.style.display = "none";
    document.getElementById('Motivo_No_Domicilia').value = ""; // Limpiar campo
  }
});
