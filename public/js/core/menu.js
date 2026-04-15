// ============================================================
// menu.js — Navegación dinámica
// Sin Tailwind. Usa clases CSS propias de sistema.css
// ============================================================

const modulosJS = {
    'admin/inicio':                null,
    'admin/modulos':               'modules/admin/modulos',
    'admin/users':                 'modules/admin/users',
    'admin/empleados':             'modules/admin/empleados',
    'maquinaria/maquinaria':       'modules/maquinaria/maquinaria',
    'vehiculo/vehiculo':           'modules/vehiculo/vehiculo',
    'mantenimiento/mantenimiento': 'modules/mantenimiento/mantenimiento',
    'falla/falla':                 'modules/falla/falla',
    'checklist/checklist':         'modules/checklist/checklist',
};

// Bootstrap Icons
const modulosIconos = {
    'maquinaria/maquinaria':       'bi-truck',
    'vehiculo/vehiculo':           'bi-car-front',
    'mantenimiento/mantenimiento': 'bi-tools',
    'falla/falla':                 'bi-exclamation-triangle',
    'checklist/checklist':         'bi-clipboard-check',
    'admin/empleados':             'bi-person-badge',
    'admin/users':                 'bi-people',
    'admin/modulos':               'bi-grid',
};

const nombresModulos = {
    'maquinaria/maquinaria':       'Maquinaria',
    'vehiculo/vehiculo':           'Vehículos',
    'mantenimiento/mantenimiento': 'Mantenimiento',
    'falla/falla':                 'Fallas',
    'checklist/checklist':         'Checklist',
    'admin/empleados':             'Empleados',
    'admin/users':                 'Usuarios',
    'admin/modulos':               'Módulos',
};

const seccionOperacion = [
    'maquinaria/maquinaria',
    'vehiculo/vehiculo',
    'mantenimiento/mantenimiento',
    'falla/falla',
    'checklist/checklist',
];

const seccionAdmin = [
    'admin/empleados',
    'admin/users',
    'admin/modulos',
];

const _flagsModulos = {
    'modules/admin/modulos':               '_modulosInicializado',
    'modules/admin/users':                 '_usersInicializado',
    'modules/admin/empleados':             '_empleadosInicializado',
    'modules/maquinaria/maquinaria':       '_maquinariaInicializado',
    'modules/vehiculo/vehiculo':           '_vehiculoInicializado',
    'modules/mantenimiento/mantenimiento': '_mantenimientoInicializado',
};

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
        nav.insertAdjacentHTML('beforeend', `<div class="sidebar-section-label">Operación</div>`);

        seccionOperacion.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;
            const icono  = modulosIconos[clave] || 'bi-circle';
            const nombre = nombresModulos[clave] || clave;
            const idLink = `menu-${clave.replace('/', '-')}`;

            nav.insertAdjacentHTML('beforeend', `
                <a href="#" class="sidebar-link" id="${idLink}"
                   onclick="cargarVista('${clave}'); return false;">
                    <i class="bi ${icono}"></i>
                    <span class="nav-label">${nombre}</span>
                </a>`);
        });
    }

    // Sección ADMINISTRACIÓN
    const tieneAdmin = seccionAdmin.some(c => modulosUsuario.includes(c));
    if (tieneAdmin) {
        nav.insertAdjacentHTML('beforeend', `<div class="sidebar-section-label">Administración</div>`);

        seccionAdmin.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;
            const icono  = modulosIconos[clave] || 'bi-circle';
            const nombre = nombresModulos[clave] || clave;
            const idLink = `menu-${clave.replace('/', '-')}`;

            nav.insertAdjacentHTML('beforeend', `
                <a href="#" class="sidebar-link" id="${idLink}"
                   onclick="cargarVista('${clave}'); return false;">
                    <i class="bi ${icono}"></i>
                    <span class="nav-label">${nombre}</span>
                </a>`);
        });
    }
}

function marcarActivo(vista) {
    document.querySelectorAll('#sidebar-nav .sidebar-link').forEach(a => {
        a.classList.remove('active');
    });

    const id = `menu-${vista.replace('/', '-')}`;
    const el = document.getElementById(id);
    if (el) el.classList.add('active');

    // Actualizar breadcrumb topbar
    const parts = vista.split('/');
    const section = document.getElementById('topbarSection');
    const page    = document.getElementById('topbarPage');
    if (section) section.textContent = nombresModulos[vista] || parts[0] || 'Inicio';
    if (page)    page.textContent    = '';
}

window.onload = () => {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }
    construirSidebar();
    const vistaInicial = localStorage.getItem('vista') || 'admin/inicio';
    cargarVista(vistaInicial);
};

async function cargarVista(vista) {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    if (vista !== 'admin/inicio' && !hasModulo(vista)) {
        toastWarn('No tienes permisos para acceder a esta sección.');
        cargarVista('admin/inicio');
        return;
    }

    localStorage.setItem('vista', vista);
    marcarActivo(vista);

    // Mostrar spinner mientras carga
    const contenedor = document.getElementById('contenido');
    contenedor.innerHTML = `
        <div class="crean-spinner">
            <div class="spinner-border" style="color:var(--crean-secondary);" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>`;

    try {
        const res = await fetch(`/views/${vista}.html`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (res.status === 401) {
            toastError('Tu sesión ha expirado. Inicia sesión nuevamente.');
            logout();
            return;
        }

        if (!res.ok) throw new Error(`Error ${res.status} al cargar la vista`);

        const html = await res.text();
        contenedor.innerHTML = html;

        // Resetear banderas
        document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());
        Object.values(_flagsModulos).forEach(flag => { window[flag] = false; });

        const moduloRuta = modulosJS[vista];
        if (!moduloRuta) return;

        const script = document.createElement('script');
        script.src = `/js/${moduloRuta}.js?v=${Date.now()}`;
        script.defer = true;
        script.dataset.modulo = moduloRuta;
        contenedor.appendChild(script);

    } catch (error) {
        console.error('Error al cargar vista:', error);
        contenedor.innerHTML = `
            <div class="crean-card p-4 text-center" style="max-width:400px;margin:40px auto;">
                <i class="bi bi-exclamation-triangle" style="font-size:2.5rem;color:var(--crean-danger);"></i>
                <h5 class="mt-3" style="color:var(--crean-primary);">Error al cargar</h5>
                <p class="text-muted small">${error.message}</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="cargarVista('admin/inicio')">
                    <i class="bi bi-house me-1"></i> Volver al Inicio
                </button>
            </div>`;
    }
}