// ============================================
// JAVASCRIPT: menu.js
// Descripción: Maneja la navegación dinámica del sistema
// ============================================


// Mapa de vistas → archivos JS a cargar
const modulosJS = {
    'admin/inicio':                   null,

    // ====== OPERACIÓN ======
    'maquinaria/maquinaria':          'modules/maquinaria/maquinaria',
    'vehiculo/vehiculo':              'modules/vehiculo/vehiculo',
    'alertas/alertas':                'modules/alertas/alertas',

    // ====== INVENTARIOS ======
    'inventario/consumibles':         'modules/inventario/consumibles',
    'inventario/bodega':              'modules/inventario/bodega',
    'inventario/bodega_producto':     'modules/inventario/bodega_producto',
    'productor/productor':            'modules/productor/productor',
    'inventario/bodega_movimiento':   'modules/inventario/bodega_movimiento',
    'inventario/mobiliario':          'modules/inventario/mobiliario',
    'ejido/ejido':                    'modules/ejido/ejido',
    'predio/predio':                  'modules/predio/predio',

    // ====== CATÁLOGOS ======
    'factura/factura':                'modules/factura/factura',
    'ubicacion/ubicacion':            'modules/ubicacion/ubicacion',
    'proveedor/proveedor':            'modules/proveedor/proveedor',
    'tipo_equipo/tipo_equipo':        'modules/tipo_equipo/tipo_equipo',
    'ubicacion/ubicacion':            'modules/ubicacion/ubicacion',

    //Modulo partida presupuestal
    'partida_presupuestal/partida_presupuestal': 'modules/partida_presupuestal/partida_presupuestal',
    'unidad_medida/unidad_medida': 'modules/unidad_medida/unidad_medida',
    'almacen/almacen': 'modules/almacen/almacen',
    'area/area': 'modules/area/area',

    // ====== ADMINISTRACIÓN ======
        'admin/empleados':  'modules/admin/empleados',
        'admin/users':      'modules/admin/users',
        'admin/modulos':    'modules/admin/modulos',
};

// ============================================
// UTILIDAD: Esperar a que un elemento exista en el DOM
// Definida en window para ser accesible desde módulos dinámicos
// ============================================
window.esperarElemento = function(id, callback, intentos = 20, moduloOrigen) {
    // Si ya cambió de módulo, cancelar
    if (moduloOrigen && window._moduloActivo !== moduloOrigen) return;

    if (document.getElementById(id)) {
        callback();
        return;
    }
    if (intentos <= 0) {
        console.warn(`Elemento #${id} no encontrado`);
        return;
    }
    setTimeout(() => window.esperarElemento(id, callback, intentos - 1, moduloOrigen), 100);
};
// ============================================
// OBTENER MÓDULOS PERMITIDOS DEL USUARIO
// ============================================
function getModulosPermitidos() {
    const user = getCurrentUser();
    if (!user || !user.modulos) return new Set();
    return new Set(user.modulos);
}


// ============================================
// VERIFICAR ACCESO A UNA VISTA
// ============================================
function tieneAcceso(clave) {
    if (clave === 'admin/inicio') return true;
    return getModulosPermitidos().has(clave);
}


// ============================================
// CONSTRUIR MENÚ SEGÚN PERMISOS
// ============================================
function construirMenu() {
    document.querySelectorAll('a[data-clave]').forEach(link => {
        const clave = link.dataset.clave;
        link.classList.toggle('hidden', !tieneAcceso(clave));
    });

    document.querySelectorAll('.dropdown-section').forEach(section => {
        const tieneLinks = section.querySelectorAll('a[data-clave]:not(.hidden)').length > 0;
        section.classList.toggle('hidden', !tieneLinks);
    });
}


// ============================================
// CARGAR VISTA INICIAL
// ============================================
window.onload = () => {
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    construirMenu();

    const vistaInicial = localStorage.getItem('vista') || 'admin/inicio';
    cargarVista(vistaInicial);
};


// ============================================
// FUNCIÓN PRINCIPAL PARA CARGAR VISTAS
// ============================================
async function cargarVista(vista) {

    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    if (!tieneAcceso(vista)) {
        Swal.fire({
            icon: 'warning',
            title: 'Acceso denegado',
            text: 'No tienes permisos para acceder a esta sección.',
            confirmButtonColor: '#3085d6'
        });
        cargarVista('admin/inicio');
        return;
    }

    localStorage.setItem('vista', vista);

    try {

        // ====== CARGAR HTML ======
        const res = await fetch(`/views/${vista}.html`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (res.status === 401) {
            Swal.fire({
                icon: 'error',
                title: 'Sesión expirada',
                text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                confirmButtonColor: '#3085d6'
            }).then(() => logout());
            return;
        }

        if (!res.ok) {
            throw new Error(`Error al cargar la vista: ${res.status}`);
        }

        const html = await res.text();

        const contenedor = document.getElementById('contenido');
        contenedor.innerHTML = html;

        // ====== LIMPIAR SCRIPTS ANTERIORES ======
        document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());

        window._moduloActivo = vista;

        // ====== CARGAR JS DEL MÓDULO ======
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
            </div>
        `;
    }
}