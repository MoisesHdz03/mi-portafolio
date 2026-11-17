/* ============================================================
   LOGIN · PORTAL VENTAS (login.html)
   - Hora y fecha actuales.
   - El ojo muestra u oculta la contraseña.
   - Enter en "Usuario" pasa a "Contraseña".
   (El color del ícono al escribir lo hace el CSS con :focus-within)
   ============================================================ */

function actualizarHora() {
  const ahora = new Date()
  const hora = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true })
  const fecha = ahora.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const elementoHora = document.getElementById("desktopTime")
  const elementoFecha = document.getElementById("desktopDate")

  if (elementoHora) elementoHora.textContent = hora
  // "sábado, 14 de noviembre de 2026" → "Sábado, 14 de noviembre de 2026"
  if (elementoFecha) elementoFecha.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1)
}

function iniciarMostrarPassword() {
  const campo = document.getElementById("password")
  const boton = document.getElementById("passwordToggle")

  if (!campo || !boton) return

  boton.addEventListener("click", () => {
    const mostrar = campo.type === "password"

    campo.type = mostrar ? "text" : "password"
    boton.querySelector("i").className = mostrar ? "fas fa-eye-slash" : "fas fa-eye"
    boton.setAttribute("aria-pressed", mostrar ? "true" : "false")
    boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña")
    campo.focus()
  })
}

function iniciarEnterEnUsuario() {
  const usuario = document.getElementById("usuario")
  const password = document.getElementById("password")

  if (!usuario || !password) return

  usuario.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      password.focus()
    }
  })
}

/* Las cifras del panel izquierdo cuentan desde 0 al aparecer ("500+", "99.9%"; "24/7" se queda igual) */
function animarCifras() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  document.querySelectorAll(".stat-number").forEach((elemento) => {
    const original = elemento.textContent.trim()
    const partes = original.match(/^(\d+(?:\.\d+)?)(\D*)$/)

    if (!partes || elemento.offsetParent === null) return

    const final = parseFloat(partes[1])
    const decimales = (partes[1].split(".")[1] || "").length
    const sufijo = partes[2]
    const duracion = 1400
    const retraso = 650
    let inicio = null

    elemento.textContent = (0).toFixed(decimales) + sufijo

    const paso = (tiempo) => {
      if (inicio === null) inicio = tiempo
      const avance = Math.min((tiempo - inicio) / duracion, 1)
      const suavizado = 1 - Math.pow(1 - avance, 3)

      elemento.textContent = avance < 1 ? (final * suavizado).toFixed(decimales) + sufijo : original
      if (avance < 1) requestAnimationFrame(paso)
    }

    setTimeout(() => requestAnimationFrame(paso), retraso)
  })
}

document.addEventListener("DOMContentLoaded", () => {
  actualizarHora()
  setInterval(actualizarHora, 1000)

  iniciarMostrarPassword()
  iniciarEnterEnUsuario()
  animarCifras()
})
