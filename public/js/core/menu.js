// ============================================
// JAVASCRIPT: menu.js
// Descripción: Navegación y carga de vistas dinámicas
// ============================================

const modulosJS = {
    'admin/inicio':                  null,
    'admin/modulos':                 'modules/admin/modulos',
    'admin/users':                   'modules/admin/users',
    'admin/empleados':               'modules/admin/empleados',
    'maquinaria/maquinaria':         'modules/maquinaria/maquinaria',
    'vehiculo/vehiculo':             'modules/vehiculo/vehiculo',
    'mantenimiento/mantenimiento':   'modules/mantenimiento/mantenimiento',
};

const modulosIconos = {
    'maquinaria/maquinaria':        'fa-tractor',
    'vehiculo/vehiculo':            'fa-truck',
    'mantenimiento/mantenimiento':  'fa-wrench',
    'admin/empleados':              'fa-user',
    'admin/users':                  'fa-users',
    'admin/modulos':                'fa-th',
};

const seccionOperacion = [
    'maquinaria/maquinaria',
    'vehiculo/vehiculo',
    'mantenimiento/mantenimiento',
];

const seccionAdmin = [
    'admin/empleados',
    'admin/users',
    'admin/modulos',
];

const _flagsModulos = {
    'modules/admin/modulos':              '_modulosInicializado',
    'modules/admin/users':                '_usersInicializado',
    'modules/admin/empleados':            '_empleadosInicializado',
    'modules/maquinaria/maquinaria':      '_maquinariaInicializado',
    'modules/vehiculo/vehiculo':          '_vehiculoInicializado',
    'modules/mantenimiento/mantenimiento':'_mantenimientoInicializado',
};

// Nombres legibles por sección
const nombresAdmin = {
    'admin/empleados': 'Empleados',
    'admin/users':     'Usuarios',
    'admin/modulos':   'Módulos',
};

// ─── Construir sidebar ─────────────────────────────────
function construirSidebar() {
    const user = getCurrentUser();
    if (!user) return;

    const modulosUsuario = user.modulos || [];
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    nav.innerHTML = '';

    // Sección OPERACIÓN
    const tieneOperacion = seccionOperacion.some(c => modulosUsuario.includes(c));
    if (tieneOperacion) {
        nav.innerHTML += `<div class="nav-section-label">OPERACIÓN</div>`;
        seccionOperacion.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;
            const nombre = clave.split('/')[0];
            const label  = nombre.charAt(0).toUpperCase() + nombre.slice(1);
            const icono  = modulosIconos[clave] || 'fa-circle';
            nav.innerHTML += `
                <a href="#" onclick="cargarVista('${clave}'); return false;"
                   id="menu-${clave.replace('/', '-')}"
                   class="nav-item"
                   title="${label}">
                    <span class="nav-icon"><i class="fas ${icono}"></i></span>
                    <span class="nav-label">${label}</span>
                </a>`;
        });
    }

    // Sección ADMINISTRACIÓN
    const tieneAdmin = seccionAdmin.some(c => modulosUsuario.includes(c));
    if (tieneAdmin) {
        nav.innerHTML += `<div class="nav-section-label">ADMINISTRACIÓN</div>`;
        seccionAdmin.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;
            const icono  = modulosIconos[clave] || 'fa-circle';
            const nombre = nombresAdmin[clave];
            nav.innerHTML += `
                <a href="#" onclick="cargarVista('${clave}'); return false;"
                   id="menu-${clave.replace('/', '-')}"
                   class="nav-item"
                   title="${nombre}">
                    <span class="nav-icon"><i class="fas ${icono}"></i></span>
                    <span class="nav-label">${nombre}</span>
                </a>`;
        });
    }
}

// ─── Marcar activo ─────────────────────────────────────
function marcarActivo(vista) {
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(a => {
        a.classList.remove('active');
    });
    const el = document.getElementById(`menu-${vista.replace('/', '-')}`);
    if (el) el.classList.add('active');

    // Actualizar título en topbar
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) {
        const nombre = vista.split('/')[0];
        titleEl.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }
}

// ─── Init ──────────────────────────────────────────────
window.onload = () => {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    construirSidebar();

    const vistaInicial = localStorage.getItem('vista') || 'admin/inicio';
    cargarVista(vistaInicial);
};

// ─── Cargar vista ──────────────────────────────────────
async function cargarVista(vista) {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    if (vista !== 'admin/inicio' && !hasModulo(vista)) {
        alert('No tienes permisos para acceder a esta sección.');
        cargarVista('admin/inicio');
        return;
    }

    localStorage.setItem('vista', vista);
    marcarActivo(vista);

    try {
        const res = await fetch(`/views/${vista}.html`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (res.status === 401) {
            alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            logout();
            return;
        }

        if (!res.ok) throw new Error(`Error al cargar la vista: ${res.status}`);

        const html = await res.text();
        const contenedor = document.getElementById('contenido');
        contenedor.innerHTML = html;

        document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());

        Object.values(_flagsModulos).forEach(flag => {
            window[flag] = false;
        });

        const moduloRuta = modulosJS[vista];
        if (!moduloRuta) return;

        const script = document.createElement('script');
        script.src = `/js/${moduloRuta}.js?v=${Date.now()}`;
        script.defer = true;
        script.dataset.modulo = moduloRuta;
        contenedor.appendChild(script);

    } catch (error) {
        console.error('Error al cargar vista:', error);
        document.getElementById('contenido').innerHTML = `
            <div class="alert alert-danger text-center mt-5">
                <h4>Error al cargar la vista</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="cargarVista('admin/inicio')">
                    Volver al Inicio
                </button>
            </div>`;
    }
}