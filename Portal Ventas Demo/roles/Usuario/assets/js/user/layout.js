/*==========================================================
    SIDEBAR Y MODO OSCURO
==========================================================*/
// ===== Sidebar Toggle =====
const sidebar = document.getElementById("sidebar")
const sidebarToggle = document.getElementById("sidebarToggle")
const mainContent = document.getElementById("mainContent")

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed")
})

// ===== Dark Mode Toggle =====
const darkModeToggle = document.getElementById("darkModeToggle")
const body = document.body

// Cargar preferencia de modo oscuro
if (localStorage.getItem("darkMode") === "enabled") {
  body.classList.add("dark-mode")
}

darkModeToggle.addEventListener("click", (e) => {
  e.preventDefault()
  body.classList.toggle("dark-mode")

  if (body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled")
  } else {
    localStorage.setItem("darkMode", "disabled")
  }
})
