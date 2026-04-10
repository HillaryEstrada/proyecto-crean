// Cargar vista inicial o la guardada en localStorage 
window.onload = () => {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    const vistaInicial = localStorage.getItem('vista') || 'admin/inicio';
    cargarVista(vistaInicial);
};

// Mapa de vistas → archivos JS a cargar
const modulos = {
    'admin/inicio': null,
    'admin/users': 'modules/auth/users',

    'maquinaria/maquinaria': 'modules/maquinaria/maquinaria',
    'vehiculo/vehiculo': 'modules/vehiculo/vehiculo',
    'mantenimiento/mantenimiento': 'modules/mantenimiento/mantenimiento',
};

// Mapa de vistas que requieren rol de Administrador
const vistasAdmin = [
    'admin/users'
];

// Función principal para cargar vistas
async function cargarVista(vista) {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    // Verificar permisos de rol
    if (vistasAdmin.includes(vista) && !isAdmin()) {
        alert('No tienes permisos para acceder a esta sección.\nSolo los administradores pueden verla.');
        cargarVista('admin/inicio');
        return;
    }

    // Guardar la vista actual en localStorage
    localStorage.setItem('vista', vista);

    try {
        // Cargar el HTML de la vista
        const res = await fetch(`/views/${vista}.html`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (res.status === 401) {
            alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            logout();
            return;
        }

        if (!res.ok) {
            throw new Error(`Error al cargar la vista: ${res.status}`);
        }

        const html = await res.text();

        // Insertar el HTML en el contenedor
        const contenedor = document.getElementById('contenido');
        contenedor.innerHTML = html;

        // Eliminar scripts anteriores del módulo
        document.querySelectorAll('script[data-modulo]').forEach(s => s.remove());

        // Cargar el JS del módulo si existe
        const moduloRuta = modulos[vista];
        if (!moduloRuta) return;

        const script = document.createElement('script');
        script.src = `/js/${moduloRuta}.js?v=${Date.now()}`;
        script.defer = true;
        script.dataset.modulo = moduloRuta;

        contenedor.appendChild(script);

    } catch (error) {
        console.error('Error al cargar vista:', error);
        const contenedor = document.getElementById('contenido');
        contenedor.innerHTML = `
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