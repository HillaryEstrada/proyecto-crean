(function () {
    if (window._empleadosInicializado) return;
    window._empleadosInicializado = true;

    // ============================================
    // MÓDULO: empleados.js
    // Descripción: Gestión de empleados del sistema
    // ============================================

    let _registrosActivos = [];
    let _idBaja = null;

    // ── Carga inicial ────────────────────────────
    listar();

    // ── Listar empleados activos ─────────────────
    async function listar() {
        const tabla = document.getElementById('empBody');
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/empleados');
            _registrosActivos = data.filter(e => e.estado === 'activo');

            const badge = document.getElementById('badgeActivos');
            if (badge) badge.textContent = _registrosActivos.length;

            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error al listar empleados:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la lista de empleados' });
        }
    }

    // ── Render tabla activos ─────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('empBody');
        const footer = document.getElementById('footerInfo');

        if (!data.length) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-users fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay empleados registrados
                    </td>
                </tr>`;
            if (footer) footer.textContent = 'Sin registros';
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((e, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">
                        ${e.numero_empleado || '—'}
                    </span>
                </td>
                <td class="px-3" style="font-size:13px;">
                    ${e.nombre} ${e.apellido_paterno} ${e.apellido_materno || ''}
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${e.sexo ? e.sexo.charAt(0).toUpperCase() + e.sexo.slice(1) : '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.telefono || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.correo || '—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${e.fecha_ingreso
                        ? new Date(e.fecha_ingreso).toLocaleDateString('es-MX')
                        : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarEmpleado(${e.pk_empleado})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja"
                        onclick="abrirBaja(${e.pk_empleado}, '${e.nombre} ${e.apellido_paterno}', '${e.numero_empleado}')">
                        <i class="fa-solid fa-user-slash" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ── Filtrar tabla ────────────────────────────
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const filtrado = _registrosActivos.filter(e =>
            `${e.numero_empleado} ${e.nombre} ${e.apellido_paterno} ${e.correo}`.toLowerCase().includes(q)
        );
        renderTabla(filtrado);
    };

    // ── Tabs activos / bajas ─────────────────────
    window.switchTab = function (tab) {
        const vistaActivos = document.getElementById('vistaActivos');
        const vistaBajas   = document.getElementById('vistaBajas');
        const tabActivos   = document.getElementById('tabActivos');
        const tabBajas     = document.getElementById('tabBajas');

        if (tab === 'activos') {
            vistaActivos.classList.remove('d-none');
            vistaBajas.classList.add('d-none');
            tabActivos.classList.add('active');
            tabBajas.classList.remove('active');
        } else {
            vistaActivos.classList.add('d-none');
            vistaBajas.classList.remove('d-none');
            tabActivos.classList.remove('active');
            tabBajas.classList.add('active');
            listarBajas();
        }
    };

    // ── Listar bajas ─────────────────────────────
    async function listarBajas() {
        const cuerpo = document.getElementById('bajasBody');
        if (!cuerpo) return;

        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando bajas…
                </td>
            </tr>`;

        try {
            const data = await fetchWithAuth('/empleados');
            const bajas = data.filter(e => e.estado !== 'activo');

            const badge = document.getElementById('badgeBajas');
            if (badge) badge.textContent = bajas.length;

            if (!bajas.length) {
                cuerpo.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-5 text-muted">
                            <i class="fa-solid fa-user-slash fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                            No hay empleados dados de baja
                        </td>
                    </tr>`;
                return;
            }

            cuerpo.innerHTML = bajas.map((e, i) => `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">
                            ${e.numero_empleado || '—'}
                        </span>
                    </td>
                    <td class="px-3" style="font-size:13px;">
                        ${e.nombre} ${e.apellido_paterno} ${e.apellido_materno || ''}
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.telefono || '—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.correo || '—'}</td>
                    <td class="px-3 text-center">
                        <span class="badge bg-secondary">Inactivo</span>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error('Error al listar bajas:', e);
        }
    }

    // ── Submit formulario ────────────────────────
    const form = document.getElementById('formEmpleado');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_empleado').value;

            const data = {
                numero_empleado:  document.getElementById('numero_empleado').value,
                nombre:           document.getElementById('nombre').value,
                apellido_paterno: document.getElementById('apellido_paterno').value,
                apellido_materno: document.getElementById('apellido_materno').value,
                sexo:             document.getElementById('sexo').value,
                telefono:         document.getElementById('telefono').value,
                correo:           document.getElementById('correo').value,
                direccion:        document.getElementById('direccion').value,
                estado:           document.getElementById('estado').value,
                fecha_ingreso:    document.getElementById('fecha_ingreso').value,
            };

            try {
                if (id) {
                    await fetchWithAuth(`/empleados/${id}`, 'PUT', data);
                    Swal.fire({ icon: 'success', title: 'Actualizado',
                        text: 'Empleado actualizado exitosamente',
                        timer: 2000, showConfirmButton: false });
                } else {
                    await fetchWithAuth('/empleados', 'POST', data);
                    Swal.fire({ icon: 'success', title: 'Registrado',
                        text: 'Empleado creado exitosamente',
                        timer: 2000, showConfirmButton: false });
                }

                mostrarTabla();
                listar();

            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message });
            }
        });
    }

    // ── Editar empleado ──────────────────────────
    window.editarEmpleado = function (id) {
        const emp = _registrosActivos.find(e => e.pk_empleado === id);
        if (!emp) return;

        document.getElementById('tituloFormulario').textContent = `Editando: ${emp.nombre} ${emp.apellido_paterno}`;
        document.getElementById('pk_empleado').value      = emp.pk_empleado;
        document.getElementById('numero_empleado').value  = emp.numero_empleado || '';
        document.getElementById('nombre').value           = emp.nombre;
        document.getElementById('apellido_paterno').value = emp.apellido_paterno;
        document.getElementById('apellido_materno').value = emp.apellido_materno || '';
        document.getElementById('sexo').value             = emp.sexo || '';
        document.getElementById('telefono').value         = emp.telefono || '';
        document.getElementById('correo').value           = emp.correo || '';
        document.getElementById('direccion').value        = emp.direccion || '';
        document.getElementById('estado').value           = emp.estado || 'activo';
        document.getElementById('fecha_ingreso').value    = emp.fecha_ingreso
            ? emp.fecha_ingreso.split('T')[0]
            : '';

        mostrarFormulario();
        document.getElementById('tituloFormulario').textContent =
            `Editando: ${emp.nombre} ${emp.apellido_paterno}`;
    };

    // ── Abrir modal baja ─────────────────────────
    window.abrirBaja = function (id, nombre, numero) {
        _idBaja = id;
        document.getElementById('bajaNombre').textContent    = nombre;
        document.getElementById('bajaNumeroEmp').textContent = numero;
        new bootstrap.Modal(document.getElementById('modalBaja')).show();
    };

    // ── Confirmar baja ───────────────────────────
    window.confirmarBaja = async function () {
        try {
            await fetchWithAuth(`/empleados/${_idBaja}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalBaja')).hide();
            Swal.fire({ icon: 'success', title: 'Baja registrada',
                text: 'El empleado fue dado de baja exitosamente',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();

// ── UI Global ────────────────────────────────
window.mostrarFormulario = function () {
    document.getElementById('tituloFormulario').textContent = 'Registrar Empleado';
    document.getElementById('pk_empleado').value = '';
    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    const form = document.getElementById('formEmpleado');
    if (form) form.reset();
    document.getElementById('pk_empleado').value = '';
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};