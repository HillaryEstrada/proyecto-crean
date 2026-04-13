(function() {
    if (window._modulosInicializado) return;
    window._modulosInicializado = true;

    // ============================================
    // MÓDULO: modulos.js
    // Descripción: Gestión de módulos por rol
    // ============================================

    let rolActivo     = null;
    let rolActivoNombre = null;
    let modulosOriginales = [];

    // Módulos exclusivos de Administrador
    const modulosRestringidos = ['admin/users', 'admin/modulos'];

    const clavesOperacion = [
        'maquinaria/maquinaria',
        'vehiculo/vehiculo',
        'mantenimiento/mantenimiento'
    ];

    const clavesAdmin = [
        'admin/empleados',
        'admin/users',
        'admin/modulos'
    ];

    // ── Inicializar ──────────────────────────────
    (async function init() {
        await cargarRoles();
    })();

    // ── Cargar roles en los pills ────────────────
    async function cargarRoles() {
        try {
            const roles = await fetchWithAuth('/modulos/roles');
            const container = document.getElementById('roles-container');
            container.innerHTML = '';

            roles.forEach(rol => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-secondary btn-sm';
                btn.style.fontSize = '12px';
                btn.textContent = rol.nombre;
                btn.dataset.id = rol.pk_rol;
                btn.onclick = () => seleccionarRol(rol.pk_rol, rol.nombre, btn);
                container.appendChild(btn);
            });

        } catch (error) {
            console.error('Error al cargar roles:', error);
        }
    }

    // ── Seleccionar rol y cargar sus módulos ─────
    async function seleccionarRol(fk_rol, nombre, btnEl) {
        rolActivo       = fk_rol;
        rolActivoNombre = nombre;

        document.querySelectorAll('#roles-container button').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline-secondary');
        });
        btnEl.classList.remove('btn-outline-secondary');
        btnEl.classList.add('btn-primary');

        const label = document.getElementById('rol-seleccionado-label');
        label.textContent = nombre;
        label.style.display = 'inline-block';

        try {
            const modulos = await fetchWithAuth(`/modulos/rol/${fk_rol}`);
            modulosOriginales = modulos.map(m => m.pk_modulo);

            // Filtrar módulos restringidos si no es Administrador
            const modulosFiltrados = nombre === 'Administrador'
                ? modulos
                : modulos.filter(m => !modulosRestringidos.includes(m.clave));

            renderizarModulos(modulosFiltrados);
        } catch (error) {
            console.error('Error al cargar módulos del rol:', error);
        }
    }

    // ── Renderizar módulos con switches ──────────
    function renderizarModulos(modulos) {
        document.getElementById('estado-vacio').style.display = 'none';
        document.getElementById('footer-guardar').style.removeProperty('display');

        const operacion      = modulos.filter(m => clavesOperacion.includes(m.clave));
        const administracion = modulos.filter(m => clavesAdmin.includes(m.clave));

        if (operacion.length > 0) {
            document.getElementById('seccion-operacion').style.display = 'block';
            document.getElementById('modulos-operacion').innerHTML =
                operacion.map(m => crearFilaModulo(m)).join('');
        } else {
            document.getElementById('seccion-operacion').style.display = 'none';
        }

        if (administracion.length > 0) {
            document.getElementById('seccion-administracion').style.display = 'block';
            document.getElementById('modulos-administracion').innerHTML =
                administracion.map(m => crearFilaModulo(m)).join('');
        } else {
            document.getElementById('seccion-administracion').style.display = 'none';
        }
    }

    // ── Crear fila de módulo con switch ──────────
    function crearFilaModulo(modulo) {
        const checked = modulo.asignado ? 'checked' : '';
        return `
            <div class="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
                <div class="d-flex align-items-center gap-3">
                    <div style="width:36px;height:36px;border-radius:8px;background:#f1f5f9;
                                display:flex;align-items:center;justify-content:center;">
                        <i class="fas ${modulo.icono || 'fa-circle'} text-secondary" style="font-size:14px;"></i>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:500;">${modulo.nombre}</div>
                        <div style="font-size:11px;color:#94a3b8;">${modulo.clave}</div>
                    </div>
                </div>
                <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox"
                           id="modulo-${modulo.pk_modulo}"
                           data-id="${modulo.pk_modulo}"
                           ${checked}
                           style="width:40px;height:22px;cursor:pointer;">
                </div>
            </div>`;
    }

    // ── Guardar asignación ───────────────────────
    window.guardarModulos = async function() {
        if (!rolActivo) return;

        const checkboxes = document.querySelectorAll('.form-check-input[data-id]');
        const modulosSeleccionados = [];
        checkboxes.forEach(cb => {
            if (cb.checked) modulosSeleccionados.push(parseInt(cb.dataset.id));
        });

        // Si no es Administrador, preservar los módulos restringidos
        // que ya tenía asignados (no tocarlos)
        if (rolActivoNombre !== 'Administrador') {
            modulosOriginales.forEach(id => {
                // Buscar si ese id original corresponde a un módulo restringido
                // Si sí, preservarlo en el array a guardar
                if (!modulosSeleccionados.includes(id)) {
                    modulosSeleccionados.push(id);
                }
            });
        }

        try {
            await fetchWithAuth(`/modulos/rol/${rolActivo}`, 'POST', {
                modulos: modulosSeleccionados
            });

            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'Módulos actualizados. Los cambios aplican en el próximo login del usuario.',
                confirmButtonColor: '#3085d6'
            });

            modulosOriginales = modulosSeleccionados;

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar. Intenta nuevamente.'
            });
        }
    };

    // ── Cancelar cambios ─────────────────────────
    window.cancelarCambios = function() {
        document.querySelectorAll('.form-check-input[data-id]').forEach(cb => {
            cb.checked = modulosOriginales.includes(parseInt(cb.dataset.id));
        });
    };

})();