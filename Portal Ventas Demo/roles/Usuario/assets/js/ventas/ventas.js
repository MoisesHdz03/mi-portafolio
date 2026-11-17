/*==========================================================
    VENTAS POR AGENTE: sidebar, modo oscuro y menú móvil
==========================================================*/
// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

// Toggle Sidebar Mobile
function toggleSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Toggle Dark Mode
function toggleDarkMode() {
    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    const icon = darkModeToggle.querySelector('i');

    body.classList.toggle('dark-mode');
    darkModeToggle.classList.toggle('active');

    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('bx-moon');
        icon.classList.add('bx-sun');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        icon.classList.remove('bx-sun');
        icon.classList.add('bx-moon');
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Cargar preferencias guardadas
window.addEventListener('DOMContentLoaded', () => {
    // Cargar estado del sidebar
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
        document.getElementById('sidebar').classList.add('collapsed');
    }

    // Cargar modo oscuro
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').classList.add('active');
        const icon = document.querySelector('#darkModeToggle i');
        icon.classList.remove('bx-moon');
        icon.classList.add('bx-sun');
    }
});

// Cerrar sidebar en mobile al hacer click fuera
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.querySelector('.mobile-toggle');

    if (window.innerWidth <= 768) {
        if (!sidebar.contains(event.target) &&
            event.target !== mobileToggle &&
            !mobileToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    }
});
