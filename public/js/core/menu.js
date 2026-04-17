// ============================================
// JAVASCRIPT: menu.js (CORREGIDO)
// ============================================

// Mapa: clave → archivo JS del módulo
const modulosJS = {
    'admin/inicio':                  null,
    'admin/modulos':                 'modules/admin/modulos',
    'admin/users':                   'modules/admin/users',
    'admin/empleados':               'modules/admin/empleados',
    'maquinaria/maquinaria':         'modules/maquinaria/maquinaria',
    'vehiculo/vehiculo':             'modules/vehiculo/vehiculo',
    'mantenimiento/mantenimiento':   'modules/mantenimiento/mantenimiento',
};

// Íconos
const modulosIconos = {
    'maquinaria/maquinaria':        'fa-tractor',
    'vehiculo/vehiculo':            'fa-truck',
    'mantenimiento/mantenimiento':  'fa-wrench',
    'admin/empleados':              'fa-user',
    'admin/users':                  'fa-users',
    'admin/modulos':                'fa-th',
};

// Secciones
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

// Flags
const _flagsModulos = {
    'modules/admin/modulos': '_modulosInicializado',
    'modules/admin/users': '_usersInicializado',
    'modules/admin/empleados': '_empleadosInicializado',
    'modules/maquinaria/maquinaria': '_maquinariaInicializado',
    'modules/vehiculo/vehiculo': '_vehiculoInicializado',
    'modules/mantenimiento/mantenimiento': '_mantenimientoInicializado',
};

// ============================================
// 🔹 CONSTRUIR SIDEBAR
// ============================================
function construirSidebar() {
    const user = getCurrentUser();
    if (!user) return;

    const modulosUsuario = user.modulos || [];
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    nav.innerHTML = '';

    // ─── OPERACIÓN ────────────────────────────
    const tieneOperacion = seccionOperacion.some(c => modulosUsuario.includes(c));

    if (tieneOperacion) {
        nav.innerHTML += `<div class="nav-section-label">OPERACIÓN</div>`;

        seccionOperacion.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;

            const nombre = clave.split('/')[0];
            const nombreFormateado = nombre.charAt(0).toUpperCase() + nombre.slice(1);
            const icono = modulosIconos[clave] || 'fa-circle';

            nav.innerHTML += `
                <a href="#"
                   onclick="cargarVista('${clave}')"
                   id="menu-${clave.replace('/', '-')}"
                   class="nav-item">

                    <span class="nav-icon">
                        <i class="fas ${icono}"></i>
                    </span>

                    <span class="nav-label">${nombreFormateado}</span>
                </a>
            `;
        });
    }

    // ─── ADMINISTRACIÓN ───────────────────────
    const tieneAdmin = seccionAdmin.some(c => modulosUsuario.includes(c));

    if (tieneAdmin) {
        nav.innerHTML += `<div class="nav-section-label">ADMINISTRACIÓN</div>`;

        const nombresAdmin = {
            'admin/empleados': 'Empleados',
            'admin/users': 'Usuarios',
            'admin/modulos': 'Módulos',
        };

        seccionAdmin.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;

            const icono = modulosIconos[clave] || 'fa-circle';
            const nombre = nombresAdmin[clave];

            nav.innerHTML += `
                <a href="#"
                   onclick="cargarVista('${clave}')"
                   id="menu-${clave.replace('/', '-')}"
                   class="nav-item">

                    <span class="nav-icon">
                        <i class="fas ${icono}"></i>
                    </span>

                    <span class="nav-label">${nombre}</span>
                </a>
            `;
        });
    }
}

// ============================================
// 🔹 MARCAR ACTIVO
// ============================================
function marcarActivo(vista) {
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(a => {
        a.classList.remove('active');
    });

    const id = `menu-${vista.replace('/', '-')}`;
    const el = document.getElementById(id);

    if (el) {
        el.classList.add('active');
    }
}

// ============================================
// 🔹 INICIO
// ============================================
window.onload = () => {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    construirSidebar();

    const vistaInicial = localStorage.getItem('vista') || 'admin/inicio';
    cargarVista(vistaInicial);
};

// ============================================
// 🔹 CARGAR VISTA
// ============================================
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
            alert('Sesión expirada.');
            logout();
            return;
        }

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const html = await res.text();
        const contenedor = document.getElementById('contenido');
        contenedor.innerHTML = html;

        // eliminar scripts previos
        document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());

        // reset flags
        Object.values(_flagsModulos).forEach(flag => {
            window[flag] = false;
        });

        // cargar JS del módulo
        const moduloRuta = modulosJS[vista];
        if (!moduloRuta) return;

        const script = document.createElement('script');
        script.src = `/js/${moduloRuta}.js?v=${Date.now()}`;
        script.defer = true;
        script.dataset.modulo = moduloRuta;

        contenedor.appendChild(script);

    } catch (error) {
        console.error(error);

        document.getElementById('contenido').innerHTML = `
            <div class="alert alert-danger text-center mt-5">
                <h4>Error al cargar la vista</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="cargarVista('admin/inicio')">
                    Volver
                </button>
            </div>
        `;
    }
}