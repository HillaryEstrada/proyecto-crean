// ============================================
// JAVASCRIPT: menu.js
// Descripción: Navegación y carga de vistas dinámicas
// ============================================

// Mapa completo: clave → archivo JS del módulo
const modulosJS = {
    'admin/inicio':                  null,
    'admin/modulos':                 'modules/admin/modulos',
    'admin/users':                   'modules/admin/users',
    'admin/empleados':               'modules/admin/empleados',
    'maquinaria/maquinaria':         'modules/maquinaria/maquinaria',
    'vehiculo/vehiculo':             'modules/vehiculo/vehiculo',
    'mantenimiento/mantenimiento':   'modules/mantenimiento/mantenimiento',
};

// Mapa de íconos por clave (Font Awesome)
const modulosIconos = {
    'maquinaria/maquinaria':        'fa-tractor',
    'vehiculo/vehiculo':            'fa-truck',
    'mantenimiento/mantenimiento':  'fa-wrench',
    'admin/empleados':              'fa-user',
    'admin/users':                  'fa-users',
    'admin/modulos':                'fa-th',
};

// Módulos que pertenecen a la sección Operación
const seccionOperacion = [
    'maquinaria/maquinaria',
    'vehiculo/vehiculo',
    'mantenimiento/mantenimiento',
];

// Módulos que pertenecen a la sección Administración
const seccionAdmin = [
    'admin/empleados',
    'admin/users',
    'admin/modulos',
];

// Banderas de inicialización por módulo
const _flagsModulos = {
    'modules/admin/modulos':       '_modulosInicializado',
    'modules/admin/users':         '_usersInicializado',
    'modules/admin/empleados':     '_empleadosInicializado',
    'modules/maquinaria/maquinaria': '_maquinariaInicializado',
    'modules/vehiculo/vehiculo':   '_vehiculoInicializado',
    'modules/mantenimiento/mantenimiento': '_mantenimientoInicializado',
};

// Construir el sidebar dinámicamente según los módulos del usuario
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
        nav.innerHTML += `<p class="text-xs text-gray-400 px-2 mt-4 mb-2">OPERACIÓN</p>`;
        seccionOperacion.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;
            const nombre  = clave.split('/')[0];
            const nombre2 = nombre.charAt(0).toUpperCase() + nombre.slice(1);
            const icono   = modulosIconos[clave] || 'fa-circle';
            nav.innerHTML += `
                <a href="#" onclick="cargarVista('${clave}')"
                   id="menu-${clave.replace('/', '-')}"
                   class="flex items-center px-2 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md">
                    <i class="fas ${icono} mr-2"></i>
                    <span class="sidebar-text">${nombre2}</span>
                </a>`;
        });
    }

    // Sección ADMINISTRACIÓN
    const tieneAdmin = seccionAdmin.some(c => modulosUsuario.includes(c));
    if (tieneAdmin) {
        nav.innerHTML += `<p class="text-xs text-gray-400 px-2 mt-4 mb-2">ADMINISTRACIÓN</p>`;
        const nombresAdmin = {
            'admin/empleados': 'Empleados',
            'admin/users':     'Usuarios',
            'admin/modulos':   'Módulos',
        };
        seccionAdmin.forEach(clave => {
            if (!modulosUsuario.includes(clave)) return;
            const icono  = modulosIconos[clave] || 'fa-circle';
            const nombre = nombresAdmin[clave];
            nav.innerHTML += `
                <a href="#" onclick="cargarVista('${clave}')"
                   id="menu-${clave.replace('/', '-')}"
                   class="flex items-center px-2 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md">
                    <i class="fas ${icono} mr-2"></i>
                    <span class="sidebar-text">${nombre}</span>
                </a>`;
        });
    }
}

// Marcar ítem activo en el sidebar
function marcarActivo(vista) {
    document.querySelectorAll('#sidebar-nav a').forEach(a => {
        a.classList.remove('bg-blue-600', 'text-white');
        a.classList.add('text-gray-300');
    });
    const id = `menu-${vista.replace('/', '-')}`;
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('bg-blue-600', 'text-white');
        el.classList.remove('text-gray-300');
    }
}

// Cargar vista inicial al arrancar
window.onload = () => {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    construirSidebar();

    const vistaInicial = localStorage.getItem('vista') || 'admin/inicio';
    cargarVista(vistaInicial);
};

// Función principal para cargar vistas
async function cargarVista(vista) {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    // Verificar si tiene acceso al módulo (excepto inicio)
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

        // Eliminar scripts anteriores
        document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());

        // ← CLAVE: resetear TODAS las banderas de inicialización
        Object.values(_flagsModulos).forEach(flag => {
            window[flag] = false;
        });

        // Cargar JS del módulo si existe
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