// ── Toggle secciones colapsables ─────────────
function toggleSeccion(nombre) {
    const contenido = document.getElementById(`modulos-${nombre}`);
    const chevron   = document.getElementById(`chevron-${nombre}`);
    if (!contenido) return;
    const abierto = contenido.style.display !== 'none';
    contenido.style.display = abierto ? 'none' : '';
    if (chevron) chevron.style.transform = abierto ? 'rotate(-90deg)' : 'rotate(0deg)';
}

// ── Filtrar por sección ───────────────────────
function filtrarSeccion() {
    const filtro = document.getElementById('filtroSeccion')?.value || 'todas';
    ['operacion', 'bodega', 'catalogos', 'administracion'].forEach(sec => {
        const seccionEl = document.getElementById(`seccion-${sec}`);
        if (!seccionEl) return;
        if (filtro === 'todas') {
            seccionEl.style.display = seccionEl.dataset.tieneModulos === '1' ? 'block' : 'none';
        } else {
            seccionEl.style.display = filtro === sec && seccionEl.dataset.tieneModulos === '1' ? 'block' : 'none';
        }
    });
}

(function() {

    let rolActivo            = null;
    let rolActivoNombre      = null;
    let modulosOriginales    = [];
    let _roles               = [];
    let _modulosActuales     = [];
    let _idParaDesactivarRol = null;

    const modulosRestringidos = ['admin/users', 'admin/modulos'];

    // ── Inicializar ──────────────────────────────
    esperarElemento('roles-container', async () => {
        await cargarRoles();
    }, 20, 'admin/modulos');

    // ── Cargar roles en los pills ────────────────
    async function cargarRoles() {
        try {
            const roles = await fetchWithAuth('/roles/todos');
            _roles = Array.isArray(roles) ? roles : [];
            renderizarRoles(_roles);
        } catch (error) {
            console.error('Error al cargar roles:', error);
        }
    }

    function renderizarRoles(roles) {
        const container = document.getElementById('roles-container');
        container.innerHTML = '';
        const activos   = roles.filter(r => r.estado === 1);
        const inactivos = roles.filter(r => r.estado === 0);

        [...activos, ...inactivos].forEach(rol => {
            const wrap = document.createElement('div');
            wrap.className = 'd-flex align-items-center gap-1 mb-1';
            wrap.dataset.nombre = rol.nombre.toLowerCase();

            const btn = document.createElement('button');
            btn.className = rol.estado === 1
                ? 'btn btn-outline-secondary btn-sm'
                : 'btn btn-outline-secondary btn-sm opacity-50';
            btn.style.fontSize = '12px';
            btn.textContent    = rol.nombre;
            btn.dataset.id     = rol.pk_rol;
            if (rol.estado === 1) {
                btn.onclick = () => seleccionarRol(rol.pk_rol, rol.nombre, btn);
            }

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn btn-sm btn-outline-primary py-0 px-1';
            btnEdit.title     = 'Editar';
            btnEdit.innerHTML = '<i class="fa-solid fa-pen" style="font-size:10px;"></i>';
            btnEdit.onclick   = () => abrirEditarRol(rol);

            const btnToggle = document.createElement('button');
            if (rol.estado === 1) {
                btnToggle.className = 'btn btn-sm btn-outline-danger py-0 px-1';
                btnToggle.title     = 'Desactivar';
                btnToggle.innerHTML = '<i class="fa-solid fa-ban" style="font-size:10px;"></i>';
                btnToggle.onclick   = () => abrirDesactivarRol(rol.pk_rol, rol.nombre);
            } else {
                btnToggle.className = 'btn btn-sm btn-outline-success py-0 px-1';
                btnToggle.title     = 'Reactivar';
                btnToggle.innerHTML = '<i class="fa-solid fa-rotate-left" style="font-size:10px;"></i>';
                btnToggle.onclick   = () => reactivarRol(rol.pk_rol, rol.nombre);
            }

            wrap.appendChild(btn);
            wrap.appendChild(btnEdit);
            wrap.appendChild(btnToggle);
            container.appendChild(wrap);
        });
    }

    // ── Seleccionar rol y cargar sus módulos ─────
    async function seleccionarRol(fk_rol, nombre, btnEl) {
        rolActivo       = fk_rol;
        rolActivoNombre = nombre;

        document.querySelectorAll('#roles-container button[data-id]').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-outline-secondary');
        });
        btnEl.classList.remove('btn-outline-secondary');
        btnEl.classList.add('btn-primary');

        const label = document.getElementById('rol-seleccionado-label');
        label.textContent   = nombre;
        label.style.display = 'inline-block';

        // Resetear filtro al cambiar de rol
        const filtroEl = document.getElementById('filtroSeccion');
        if (filtroEl) filtroEl.value = 'todas';

        try {
            const modulos     = await fetchWithAuth(`/modulos/rol/${fk_rol}`);
            _modulosActuales  = modulos;
            modulosOriginales = modulos.map(m => m.pk_modulo);

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

        const grupos = {
            'OPERACIÓN':      ['maquinaria', 'vehiculo', 'alertas'],
            'BODEGA':         ['inventario', 'productor', 'ejido'],
            'CATÁLOGOS':      ['factura', 'ubicacion', 'proveedor', 'tipo_equipo'],
            'ADMINISTRACIÓN': ['admin']
        };

        Object.entries(grupos).forEach(([seccionNombre, prefijos]) => {
            const modulosFiltrados = modulos.filter(m =>
                prefijos.some(p => m.clave.startsWith(p))
            );

            const seccionId = seccionNombre.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');

            const seccionEl = document.getElementById(`seccion-${seccionId}`);
            const modulosEl = document.getElementById(`modulos-${seccionId}`);
            const chevron   = document.getElementById(`chevron-${seccionId}`);

            if (!seccionEl || !modulosEl) return;

            if (modulosFiltrados.length > 0) {
                seccionEl.style.display      = 'block';
                seccionEl.dataset.tieneModulos = '1';
                modulosEl.style.display      = '';
                modulosEl.innerHTML          = modulosFiltrados.map(m => crearFilaModulo(m)).join('');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            } else {
                seccionEl.style.display      = 'none';
                seccionEl.dataset.tieneModulos = '0';
            }
        });
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

        try {
            await fetchWithAuth(`/modulos/rol/${rolActivo}`, 'POST', {
                modulos: modulosSeleccionados
            });
            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'Módulos actualizados. Los cambios aplican en el próximo login del usuario.',
                confirmButtonColor: '#1a3c5e'
            });
            modulosOriginales = modulosSeleccionados;
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar. Intenta nuevamente.' });
        }
    };

    // ── Cancelar cambios ─────────────────────────
    window.cancelarCambios = function() {
        document.querySelectorAll('.form-check-input[data-id]').forEach(cb => {
            cb.checked = modulosOriginales.includes(parseInt(cb.dataset.id));
        });
    };

    // ── CRUD ROLES ───────────────────────────────
    window.abrirFormularioRol = function() {
        document.getElementById('f_pk_rol').value          = '';
        document.getElementById('f_rol_nombre').value      = '';
        document.getElementById('f_rol_descripcion').value = '';
        document.getElementById('modalRolTitulo').textContent = 'Nuevo Rol';
        document.getElementById('err_rol_nombre').classList.add('d-none');
        new bootstrap.Modal(document.getElementById('modalRol')).show();
        setTimeout(() => document.getElementById('f_rol_nombre').focus(), 300);
    };

    window.abrirEditarRol = function(rol) {
        document.getElementById('f_pk_rol').value          = rol.pk_rol;
        document.getElementById('f_rol_nombre').value      = rol.nombre || '';
        document.getElementById('f_rol_descripcion').value = rol.descripcion || '';
        document.getElementById('modalRolTitulo').textContent = `Editando: ${rol.nombre}`;
        document.getElementById('err_rol_nombre').classList.add('d-none');
        new bootstrap.Modal(document.getElementById('modalRol')).show();
        setTimeout(() => document.getElementById('f_rol_nombre').focus(), 300);
    };

    window.guardarRol = async function() {
        const id          = document.getElementById('f_pk_rol').value;
        const nombre      = document.getElementById('f_rol_nombre').value.trim();
        const descripcion = document.getElementById('f_rol_descripcion').value.trim();

        if (!nombre) {
            document.getElementById('err_rol_nombre').classList.remove('d-none');
            document.getElementById('f_rol_nombre').focus();
            return;
        }
        document.getElementById('err_rol_nombre').classList.add('d-none');

        try {
            if (id) {
                await fetchWithAuth(`/roles/${id}`, 'PUT', { nombre, descripcion });
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Rol actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/roles', 'POST', { nombre, descripcion });
                Swal.fire({ icon: 'success', title: 'Creado',
                    text: 'Rol creado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            bootstrap.Modal.getInstance(document.getElementById('modalRol')).hide();
            await cargarRoles();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    window.abrirDesactivarRol = function(id, nombre) {
        _idParaDesactivarRol = id;
        document.getElementById('desactivarRolNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalDesactivarRol')).show();
    };

    window.confirmarDesactivarRol = async function() {
        try {
            await fetchWithAuth(`/roles/${_idParaDesactivarRol}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivarRol')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivado',
                text: 'Rol desactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await cargarRoles();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    window.reactivarRol = async function(id, nombre) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar rol',
            text: `¿Deseas reactivar "${nombre}"?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/roles/${id}/activar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivado',
                text: 'Rol reactivado exitosamente',
                timer: 2000, showConfirmButton: false });
            await cargarRoles();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();