/*==========================================================
    MODAL DE CONTRASEÑA
==========================================================*/
const bootstrap = window.bootstrap // Declare the bootstrap variable
document.getElementById("openPasswordModal").addEventListener("click", (event) => {
  event.preventDefault()
  var modal = new bootstrap.Modal(document.getElementById("passwordModal"))
  modal.show()
})

// Toggle para mostrar/ocultar contraseña
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId)
  const icon = button.querySelector("i")

  if (input.type === "password") {
    input.type = "text"
    icon.classList.remove("fa-eye")
    icon.classList.add("fa-eye-slash")
  } else {
    input.type = "password"
    icon.classList.remove("fa-eye-slash")
    icon.classList.add("fa-eye")
  }
}

// Validar fortaleza de contraseña en tiempo real
document.getElementById("password").addEventListener("input", function () {
  const password = this.value
  const strengthFill = document.getElementById("passwordStrengthFill")
  const strengthText = document.getElementById("passwordStrengthText")

  // Requisitos
  const hasLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  // Actualizar indicadores visuales de requisitos
  updateRequirement("req-length", hasLength)
  updateRequirement("req-uppercase", hasUppercase)
  updateRequirement("req-lowercase", hasLowercase)
  updateRequirement("req-number", hasNumber)

  // Calcular fortaleza
  let strength = 0
  if (hasLength) strength++
  if (hasUppercase) strength++
  if (hasLowercase) strength++
  if (hasNumber) strength++

  // Actualizar barra de fortaleza
  strengthFill.className = "password-strength-fill"
  strengthText.className = "password-strength-text"

  if (password.length === 0) {
    strengthText.textContent = "Ingresa una contraseña"
  } else if (strength <= 2) {
    strengthFill.classList.add("weak")
    strengthText.classList.add("weak")
    strengthText.textContent = "Contraseña débil"
  } else if (strength === 3) {
    strengthFill.classList.add("medium")
    strengthText.classList.add("medium")
    strengthText.textContent = "Contraseña media"
  } else {
    strengthFill.classList.add("strong")
    strengthText.classList.add("strong")
    strengthText.textContent = "Contraseña fuerte"
  }
})

// Actualizar indicador de requisito
function updateRequirement(reqId, isMet) {
  const reqElement = document.getElementById(reqId)
  if (isMet) {
    reqElement.classList.add("met")
  } else {
    reqElement.classList.remove("met")
  }
}

// Validación de contraseña mejorada
document.getElementById("passwordForm").addEventListener("submit", function (event) {
  event.preventDefault()
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirm-password").value
  const passwordError = document.getElementById("passwordError")

  if (password !== confirmPassword) {
    passwordError.style.display = "block"

    // Agregar animación de shake al input
    const confirmInput = document.getElementById("confirm-password")
    confirmInput.style.animation = "none"
    setTimeout(() => {
      confirmInput.style.animation = "shake 0.4s ease"
    }, 10)
  } else {
    passwordError.style.display = "none"
    this.submit()
  }
})

// Ocultar error cuando el usuario empieza a escribir
document.getElementById("confirm-password").addEventListener("input", () => {
  const passwordError = document.getElementById("passwordError")
  passwordError.style.display = "none"
})
