(function () {
    // quitar flag de inicialización
    let _registros    = [];
    let _idDesactivar = null;
    let _modulosCache = {};
    let _userEditando = null;

    const modulosRestringidos = ['admin/users', 'admin/modulos'];

    esperarElemento('usersBody', async () => {
        await cargarRolesSelect();
        await cargarEmpleadosSelect();
        listar();
    });

    // ── Cargar roles ─────────────────────────────
    async function cargarRolesSelect() {
        try {
            const roles = await fetchWithAuth('/roles');
            const sel = document.getElementById('fk_rol');
            roles.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.pk_rol;
                opt.textContent = r.nombre;
                sel.appendChild(opt);
            });
        } catch (e) {
            console.error('Error al cargar roles:', e);
        }
    }

    // ── Cargar empleados ─────────────────────────
    async function cargarEmpleadosSelect() {
        try {
            const empleados = await fetchWithAuth('/empleados');
            const sel = document.getElementById('fk_empleado');
            empleados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.pk_empleado;
                opt.textContent = e.nombre_completo || `Empleado #${e.pk_empleado}`;
                sel.appendChild(opt);
            });
        } catch (e) {
            console.error('Error al cargar empleados:', e);
        }
    }

    // ── Mostrar módulos heredados al cambiar rol ──
    window.mostrarModulosRol = async function () {
        const fk_rol = document.getElementById('fk_rol').value;
        const contenedor = document.getElementById('modulosHeredados');
        const lista = document.getElementById('modulosHeredadosLista');
        const seccionIndividuales = document.getElementById('seccionModulosIndividuales');

        if (!fk_rol) {
            contenedor.style.display = 'none';
            seccionIndividuales.style.display = 'none';
            return;
        }

        try {
            let modulos = _modulosCache[fk_rol];
            if (!modulos) {
                const data = await fetchWithAuth(`/modulos/rol/${fk_rol}`);
                modulos = data;
                _modulosCache[fk_rol] = modulos;
            }

            // Filtrar módulos restringidos si el usuario no es Administrador
            const esAdmin = _userEditando?.rol_nombre === 'Administrador';
            const modulosFiltrados = esAdmin
                ? modulos
                : modulos.filter(m => !modulosRestringidos.includes(m.clave));

            const asignados = modulosFiltrados.filter(m => m.asignado);

            lista.innerHTML = asignados.length
                ? asignados.map(m => `
                    <span class="badge fw-normal py-2 px-3"
                          style="background:#e8f0fe;color:#1a3c5e;border:1px solid #c5d5f5;font-size:12px;">
                        <i class="fas ${m.icono || 'fa-circle'} me-1" style="font-size:10px;"></i>
                        ${m.nombre}
                    </span>`).join('')
                : `<span class="text-muted small">Este rol no tiene módulos asignados</span>`;

            contenedor.style.display = 'block';

            // Solo cargar módulos individuales si estamos editando
            if (_userEditando) {
                await cargarModulosIndividuales(_userEditando.pk_user, fk_rol, modulosFiltrados);
            }

        } catch (e) {
            console.error('Error al obtener módulos del rol:', e);
        }
    };

    // ── Cargar módulos individuales ──────────────
    async function cargarModulosIndividuales(fk_user, fk_rol, modulosBase) {
        const seccion = document.getElementById('seccionModulosIndividuales');
        const lista   = document.getElementById('modulosIndividualesLista');

        try {
            let data = await fetchWithAuth(`/modulos/user/${fk_user}?fk_rol=${fk_rol}`);

            // Filtrar módulos restringidos si no es Administrador
            const esAdmin = _userEditando?.rol_nombre === 'Administrador';
            if (!esAdmin) {
                data = data.filter(m => !modulosRestringidos.includes(m.clave));
            }

            seccion.style.display = 'block';

            lista.innerHTML = data.map(m => {
                const esDelRol   = m.asignado && !m.excepcion;
                const esAgregado = m.excepcion === 'agregar';
                const esQuitado  = m.excepcion === 'quitar';

                let badgeOrigen = '';
                if (esAgregado) {
                    badgeOrigen = `<span class="badge ms-1" style="background:#fff3cd;color:#856404;font-size:10px;">
                        <i class="fa-solid fa-user"></i> Individual</span>`;
                } else if (esQuitado) {
                    badgeOrigen = `<span class="badge ms-1" style="background:#fbe9e7;color:#b2382d;font-size:10px;">
                        <i class="fa-solid fa-ban"></i> Quitado</span>`;
                } else if (esDelRol) {
                    badgeOrigen = `<span class="badge ms-1" style="background:#e8f0fe;color:#1a3c5e;font-size:10px;">
                        <i class="fa-solid fa-shield-halved"></i> Rol</span>`;
                }

                const checked = m.asignado ? 'checked' : '';

                return `
                    <div class="d-flex align-items-center justify-content-between px-3 py-2 rounded-3"
                         style="background:#f8fafc;border:1px solid #e2e8f0;">
                        <div class="d-flex align-items-center gap-2">
                            <div style="width:30px;height:30px;border-radius:6px;background:#f1f5f9;
                                        display:flex;align-items:center;justify-content:center;">
                                <i class="fas ${m.icono || 'fa-circle'} text-secondary" style="font-size:12px;"></i>
                            </div>
                            <div>
                                <span style="font-size:13px;font-weight:500;">${m.nombre}</span>
                                ${badgeOrigen}
                                <div style="font-size:11px;color:#94a3b8;">${m.clave}</div>
                            </div>
                        </div>
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input" type="checkbox"
                                   data-id="${m.pk_modulo}"
                                   data-del-rol="${esDelRol}"
                                   ${checked}
                                   style="width:38px;height:20px;cursor:pointer;">
                        </div>
                    </div>`;
            }).join('');

        } catch (e) {
            console.error('Error al cargar módulos individuales:', e);
        }
    }

    // ── Listar usuarios ──────────────────────────
    async function listar() {
        const tabla = document.getElementById('usersBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/users');
            _registros = data;
            renderTabla(data.filter(u => u.estado == 1)); // ← filtrar solo activos
        } catch (e) {
            console.error('Error al listar usuarios:', e);
        }
    }

    // ── Render tabla ─────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('usersBody');
        const footer = document.getElementById('footerInfo');

        if (!data.length) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-users fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay usuarios registrados
                    </td>
                </tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'usersBody', filasPorPagina: 10, sufijo: 'usr' }); // ← AGREGAR
            return;
        }

        if (footer) footer.textContent =
             `Mostrando ${data.length} de ${_registros.filter(u => u.estado == 1).length} registros`;

        tabla.innerHTML = data.map((u, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <div class="d-flex align-items-center gap-2">
                        <div style="width:32px;height:32px;border-radius:50%;background:#1a3c5e;
                                    display:flex;align-items:center;justify-content:center;
                                    color:#fff;font-size:11px;font-weight:600;flex-shrink:0;">
                            ${u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span style="font-size:13px;font-weight:500;">${u.username}</span>
                    </div>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${u.nombre_completo || '—'}
                </td>
                <td class="px-3">
                    <span class="badge fw-normal"
                          style="background:#e8f0fe;color:#1a3c5e;font-size:12px;">
                        ${u.rol_nombre}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;">
                    ${u.ultimo_acceso
                        ? new Date(u.ultimo_acceso).toLocaleString('es-MX')
                        : 'Nunca'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarUser(${u.pk_user})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${u.pk_user}, '${u.username}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');
             const badgeA = document.getElementById('badgeActivos');
        const badgeD = document.getElementById('badgeDesactivados');
        if (badgeA) badgeA.textContent = _registros.filter(u => u.estado == 1).length;
        if (badgeD) badgeD.textContent = _registros.filter(u => u.estado == 0).length;
        initPaginacion({ tbodyId: 'usersBody', filasPorPagina: 10, sufijo: 'usr' });
    }

    // ── Filtrar tabla ────────────────────────────
    window.filtrarTabla = function () {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filtrado = _registros
        .filter(u => u.estado == 1) // ← AGREGAR esta línea
        .filter(u => `${u.username} ${u.rol_nombre}`.toLowerCase().includes(q));
    renderTabla(filtrado);
    };
  window.filtrarBajas = function () {
        const q = (document.getElementById('searchInputBajas')?.value || '').toLowerCase();
        const cuerpo = document.getElementById('usersBodyDesactivados');
        const footer = document.getElementById('footerInfoDesactivados');
        const data = _registros
            .filter(u => u.estado == 0)
            .filter(u => `${u.username} ${u.rol_nombre}`.toLowerCase().includes(q));

        if (!data.length) {
            cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No se encontraron resultados</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'usersBodyDesactivados', filasPorPagina: 10, sufijo: 'usrd' });
            return;
        }
        if (footer) footer.textContent = `Mostrando ${data.length} registros`;
        cuerpo.innerHTML = data.map((u, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <div class="d-flex align-items-center gap-2">
                        <div style="width:32px;height:32px;border-radius:50%;background:#94a3b8;
                                    display:flex;align-items:center;justify-content:center;
                                    color:#fff;font-size:11px;font-weight:600;flex-shrink:0;">
                            ${u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span style="font-size:13px;font-weight:500;">${u.username}</span>
                    </div>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${u.nombre_completo || '—'}</td>
                <td class="px-3">
                    <span class="badge fw-normal" style="background:#e8f0fe;color:#1a3c5e;font-size:12px;">
                        ${u.rol_nombre}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;">
                    ${u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-MX') : 'Nunca'}
                </td>
                <td class="px-3 text-center">
                    <span class="badge bg-secondary" style="font-size:11px;">Inactivo</span>
                </td>
            </tr>`).join('');
        initPaginacion({ tbodyId: 'usersBodyDesactivados', filasPorPagina: 10, sufijo: 'usrd' });
    };
    // ── Submit formulario ────────────────────────
    const form = document.getElementById('formUser');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id       = document.getElementById('pk_user').value;
            const password = document.getElementById('password').value;

            const data = {
                username:    document.getElementById('username').value,
                fk_empleado: document.getElementById('fk_empleado').value,
                fk_rol:      document.getElementById('fk_rol').value,
            };

            if (password) {
                if (password.length < 6) {
                    Swal.fire({ icon: 'warning', title: 'Contraseña muy corta',
                        text: 'Debe tener al menos 6 caracteres' });
                    return;
                }
                if (id) {
                    data.cambiar_password = true;
                    data.nueva_password   = password;
                } else {
                    data.password = password;
                }
            } else if (!id) {
                Swal.fire({ icon: 'warning', title: 'Contraseña requerida',
                    text: 'Debes ingresar una contraseña para el nuevo usuario' });
                return;
            }

            try {
                if (id) {
                    await fetchWithAuth(`/users/${id}`, 'PUT', data);
                    await guardarExcepcionesIndividuales(id, data.fk_rol);
                    Swal.fire({ icon: 'success', title: 'Actualizado',
                        text: 'Usuario actualizado exitosamente',
                        timer: 2000, showConfirmButton: false });
                } else {
                    await fetchWithAuth('/users', 'POST', data);
                    Swal.fire({ icon: 'success', title: 'Creado',
                        text: 'Usuario creado exitosamente',
                        timer: 2000, showConfirmButton: false });
                }

                mostrarTabla();
                listar();

            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message });
            }
        });
    }

    // ── Guardar excepciones individuales ─────────
    async function guardarExcepcionesIndividuales(fk_user, fk_rol) {
        const checkboxes = document.querySelectorAll('#modulosIndividualesLista .form-check-input');
        if (!checkboxes.length) return;

        const modulosRol = await fetchWithAuth(`/modulos/rol/${fk_rol}`);
        const idsRol     = modulosRol.filter(m => m.asignado).map(m => m.pk_modulo);

        const agregar = [];
        const quitar  = [];

        checkboxes.forEach(cb => {
            const pk_modulo  = parseInt(cb.dataset.id);
            const estaActivo = cb.checked;
            const estaEnRol  = idsRol.includes(pk_modulo);

            if (estaActivo && !estaEnRol)       agregar.push(pk_modulo);
            else if (!estaActivo && estaEnRol)  quitar.push(pk_modulo);
        });

        await fetchWithAuth(`/modulos/user/${fk_user}`, 'POST', { agregar, quitar });
    }

    // ── Editar usuario ───────────────────────────
    window.editarUser = async function (id) {
        const user = _registros.find(u => u.pk_user === id);
        if (!user) return;

        _userEditando = user;

        document.getElementById('contenedorFormulario').classList.remove('d-none');
        document.getElementById('contenedorTabla').classList.add('d-none');

        document.getElementById('tituloFormulario').textContent = `Editando: ${user.username}`;
        document.getElementById('pk_user').value      = user.pk_user;
        document.getElementById('username').value     = user.username;
        document.getElementById('password').value     = '';
        document.getElementById('fk_empleado').value  = user.fk_empleado;
        document.getElementById('fk_rol').value       = user.fk_rol;

        document.getElementById('labelPassword').style.display     = 'none';
        document.getElementById('labelPasswordEdit').style.display = 'inline';

        await mostrarModulosRol();
    };

    // ── Desactivar ───────────────────────────────
    window.abrirDesactivar = function (id, username) {
        _idDesactivar = id;
        document.getElementById('desactivarUsername').textContent = username;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    window.confirmarDesactivar = async function () {
        try {
            await fetchWithAuth(`/users/${_idDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Usuario desactivado',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Switch tabs ──────────────────────────────
    window.switchTabUsers = function(tab) {
        const va = document.getElementById('vistaActivos');
        const vd = document.getElementById('vistaDesactivados');
        const ta = document.getElementById('tabActivos');
        const td = document.getElementById('tabDesactivados');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vd.classList.add('d-none');
            ta.classList.add('active');    td.classList.remove('active');
        } else {
            va.classList.add('d-none');    vd.classList.remove('d-none');
            ta.classList.remove('active'); td.classList.add('active');
            renderDesactivados();
        }
    };

    function renderDesactivados() {
        const cuerpo = document.getElementById('usersBodyDesactivados');
        const footer = document.getElementById('footerInfoDesactivados');
        const data   = _registros.filter(u => u.estado == 0);
        if (!data.length) {
            cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">
                <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                No hay usuarios desactivados</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'usersBodyDesactivados', filasPorPagina: 10, sufijo: 'usrd' });
            return;
        }
        if (footer) footer.textContent = `Mostrando ${data.length} registros`;
        cuerpo.innerHTML = data.map((u, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <div class="d-flex align-items-center gap-2">
                        <div style="width:32px;height:32px;border-radius:50%;background:#94a3b8;
                                    display:flex;align-items:center;justify-content:center;
                                    color:#fff;font-size:11px;font-weight:600;flex-shrink:0;">
                            ${u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span style="font-size:13px;font-weight:500;">${u.username}</span>
                    </div>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${u.nombre_completo || '—'}</td>
                <td class="px-3">
                    <span class="badge fw-normal" style="background:#e8f0fe;color:#1a3c5e;font-size:12px;">
                        ${u.rol_nombre}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:12px;">
                    ${u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-MX') : 'Nunca'}
                </td>
                <td class="px-3 text-center">
                    <span class="badge bg-secondary" style="font-size:11px;">Inactivo</span>
                </td>
            </tr>`).join('');
        initPaginacion({ tbodyId: 'usersBodyDesactivados', filasPorPagina: 10, sufijo: 'usrd' });
    }

})();

// ── UI Global ────────────────────────────────
window.mostrarFormulario = function () {
    window._userEditando = null;
    document.getElementById('tituloFormulario').textContent    = 'Nuevo usuario';
    document.getElementById('pk_user').value                   = '';
    document.getElementById('labelPassword').style.display     = 'inline';
    document.getElementById('labelPasswordEdit').style.display = 'none';
    document.getElementById('modulosHeredados').style.display  = 'none';
    document.getElementById('seccionModulosIndividuales').style.display = 'none';
    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    const form = document.getElementById('formUser');
    if (form) form.reset();
    window._userEditando = null;
    document.getElementById('pk_user').value = '';
    document.getElementById('modulosHeredados').style.display           = 'none';
    document.getElementById('seccionModulosIndividuales').style.display = 'none';
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};