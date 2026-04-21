(function () {
    // quitar flag de inicialización
    let _registrosActivos = [];
    let _idBaja           = null;
    let _empleadoCreado   = null;
    let _fotoFile         = null;
    let _modoEdicion      = false;

    esperarElemento('empBody', async () => {
        await cargarRolesSelect();
        listar();
    });

    async function cargarRolesSelect() {
        try {
            const roles = await fetchWithAuth('/roles');
            const sel   = document.getElementById('u_fk_rol');
            roles.forEach(r => {
                const opt       = document.createElement('option');
                opt.value       = r.pk_rol;
                opt.textContent = r.nombre;
                sel.appendChild(opt);
            });
        } catch (e) { console.error('Error roles:', e); }
    }

    window.previsualizarFoto = function(input) {
        const file = input.files[0];
        if (!file) return;
        _fotoFile = file;
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('fotoPreview').innerHTML = `
                <img src="${e.target.result}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        };
        reader.readAsDataURL(file);
    };

    window.toggleSwitch = function() {
        const sw           = document.getElementById('switchCuenta');
        const btnGuardar   = document.getElementById('btnGuardarPaso1');
        const btnSiguiente = document.getElementById('btnSiguiente');
        const container    = document.getElementById('switchContainer');
        const subtexto     = document.getElementById('switchSubtexto');
        if (!sw) return;
        if (sw.checked) {
            btnGuardar.disabled   = true;
            btnSiguiente.disabled = false;
            container.style.background  = '#f0fdf4';
            container.style.borderColor = '#86efac';
            subtexto.textContent = 'Se configurará en el siguiente paso';
            subtexto.style.color = '#4ade80';
        } else {
            btnGuardar.disabled   = false;
            btnSiguiente.disabled = true;
            container.style.background  = '#f0f9ff';
            container.style.borderColor = '#bae6fd';
            subtexto.textContent = 'Activa para configurar usuario y contraseña';
            subtexto.style.color = '#7dd3fc';
        }
    };

    window.guardarPaso1 = async function() {
        if (!validarPaso1()) return;
        try {
            const data = recolectarDatosPaso1();
            const id   = document.getElementById('pk_empleado').value;
            if (id) {
                await fetchWithAuth(`/empleados/${id}`, 'PUT', data);
                if (_fotoFile) {
                    try { await subirFoto(id); } catch(e) { console.warn(e); }
                }
                Swal.fire({ icon:'success', title:'Actualizado',
                    text:'Empleado actualizado exitosamente',
                    timer:2000, showConfirmButton:false });
            } else {
                const res = await fetchWithAuth('/empleados', 'POST', data);
                if (_fotoFile) {
                    try { await subirFoto(res.empleadoId); } catch(e) { console.warn(e); }
                }
                Swal.fire({ icon:'success', title:'Registrado',
                    text:'Empleado creado exitosamente',
                    timer:2000, showConfirmButton:false });
            }
            mostrarTabla();
            listar();
        } catch (error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

    window.irPaso2 = async function() {
        if (!validarPaso1()) return;
        try {
            const data = recolectarDatosPaso1();
            const id   = document.getElementById('pk_empleado').value;
            if (id) {
                await fetchWithAuth(`/empleados/${id}`, 'PUT', data);
                if (_fotoFile) {
                    try { await subirFoto(id); } catch(e) { console.warn(e); }
                }
                _empleadoCreado = parseInt(id);
            } else {
                const res       = await fetchWithAuth('/empleados', 'POST', data);
                _empleadoCreado = res.empleadoId;
                if (_fotoFile) {
                    try { await subirFoto(_empleadoCreado); } catch(e) { console.warn(e); }
                }
                document.getElementById('pk_empleado').value = _empleadoCreado;
            }
            const nombre = `${data.nombre} ${data.apellido_paterno}`;
            document.getElementById('paso2Avatar').textContent = nombre.substring(0,2).toUpperCase();
            document.getElementById('paso2Nombre').textContent = nombre;
            document.getElementById('paso2NumEmp').textContent =
                `${data.numero_empleado} · Creando cuenta de acceso`;
            activarPaso2();
        } catch (error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

    window.irPaso1 = function() {
        document.getElementById('paso1').classList.remove('d-none');
        document.getElementById('paso2').classList.add('d-none');
        document.getElementById('step-circle-1').style.background = '#1a3c5e';
        document.getElementById('step-circle-1').style.color      = '#fff';
        document.getElementById('step-circle-1').textContent      = '1';
        document.getElementById('step-circle-2').style.background = '#e2e8f0';
        document.getElementById('step-circle-2').style.color      = '#94a3b8';
        document.getElementById('step-label-2').style.color       = '#94a3b8';
        document.getElementById('step-line').style.background     = '#e2e8f0';
    };

    function activarPaso2() {
        document.getElementById('paso1').classList.add('d-none');
        document.getElementById('paso2').classList.remove('d-none');
        document.getElementById('step-circle-1').style.background = '#16a34a';
        document.getElementById('step-circle-1').style.color      = '#fff';
        document.getElementById('step-circle-1').textContent      = '✓';
        document.getElementById('step-circle-2').style.background = '#1a3c5e';
        document.getElementById('step-circle-2').style.color      = '#fff';
        document.getElementById('step-label-2').style.color       = '#1a3c5e';
        document.getElementById('step-line').style.background     = '#16a34a';
    }

    window.mostrarModulosPaso2 = async function() {
        const fk_rol     = document.getElementById('u_fk_rol').value;
        const contenedor = document.getElementById('paso2Modulos');
        const lista      = document.getElementById('paso2ModulosLista');
        if (!fk_rol) { contenedor.style.display = 'none'; return; }
        try {
            const data      = await fetchWithAuth(`/modulos/rol/${fk_rol}`);
            const asignados = data.filter(m => m.asignado);
            lista.innerHTML = asignados.length
                ? asignados.map(m => `
                    <span class="badge fw-normal py-2 px-3"
                          style="background:#e8f0fe;color:#1a3c5e;border:1px solid #c5d5f5;font-size:12px;">
                        <i class="fas ${m.icono||'fa-circle'} me-1" style="font-size:10px;"></i>
                        ${m.nombre}
                    </span>`).join('')
                : `<span class="text-muted small">Este rol no tiene módulos asignados</span>`;
            contenedor.style.display = 'block';
        } catch (e) { console.error('Error módulos:', e); }
    };

    window.guardarTodo = async function() {
        const username = document.getElementById('u_username').value.trim();
        const password = document.getElementById('u_password').value;
        const fk_rol   = document.getElementById('u_fk_rol').value;
        if (!username || !password || !fk_rol) {
            Swal.fire({ icon:'warning', title:'Campos requeridos',
                text:'Username, contraseña y rol son obligatorios' });
            return;
        }
        if (password.length < 6) {
            Swal.fire({ icon:'warning', title:'Contraseña muy corta',
                text:'Debe tener al menos 6 caracteres' });
            return;
        }
        try {
            await fetchWithAuth('/users', 'POST', {
                username, password, fk_rol,
                fk_empleado: _empleadoCreado
            });
            Swal.fire({ icon:'success', title:'Completado',
                text:'Empleado y cuenta creados exitosamente',
                timer:2500, showConfirmButton:false });
            mostrarTabla();
            listar();
        } catch (error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

   async function subirFoto(fk_registro) {
        if (!_fotoFile) return;
        const formData = new FormData();
        formData.append('archivo', _fotoFile);
        const res = await fetch('/archivo/temporal', {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body:    formData
        });
        const data = await res.json();
        if (data.url) {
            await fetchWithAuth(`/empleados/${fk_registro}/foto`, 'PATCH', { url: data.url });
        }
    }

    function validarPaso1() {
        const numero   = document.getElementById('numero_empleado').value.trim();
        const nombre   = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido_paterno').value.trim();
        if (!numero || !nombre || !apellido) {
            Swal.fire({ icon:'warning', title:'Campos requeridos',
                text:'Número de empleado, nombre y apellido paterno son obligatorios' });
            return false;
        }
        return true;
    }

    function recolectarDatosPaso1() {
        return {
            numero_empleado:  document.getElementById('numero_empleado').value.trim(),
            nombre:           document.getElementById('nombre').value.trim(),
            apellido_paterno: document.getElementById('apellido_paterno').value.trim(),
            apellido_materno: document.getElementById('apellido_materno').value.trim(),
            sexo:             document.getElementById('sexo').value,
            fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
            telefono:         document.getElementById('telefono').value.trim(),
            correo:           document.getElementById('correo').value.trim(),
            direccion:        document.getElementById('direccion').value.trim(),
            fecha_ingreso:    document.getElementById('fecha_ingreso').value,
        };
    }

    async function listar() {
        const tabla = document.getElementById('empBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/empleados');
            _registrosActivos = data;
            const badge       = document.getElementById('badgeActivos');
            if (badge) badge.textContent = data.length;
            renderTabla(data);
        } catch (e) { console.error('Error listar:', e); }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('empBody');
        const footer = document.getElementById('footerInfo');
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-users fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay empleados registrados</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
             initPaginacion({ tbodyId: 'empBody', filasPorPagina: 10, sufijo: 'emp' });
            return;
        }
        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registrosActivos.length} registros`;
        tabla.innerHTML = data.map((e, i) => {
            const tieneCuenta = e.pk_user !== null && e.pk_user !== undefined && e.estado_user == 1;
            const fotoHtml = e.foto_perfil
                ? `<img src="${e.foto_perfil}"
                    style="width:32px;height:32px;border-radius:50%;object-fit:cover;cursor:pointer;"
                    onclick="verFotoGrande('${e.foto_perfil}')"
                    title="Ver foto">`
                : `<div style="width:32px;height:32px;border-radius:50%;background:#e2e8f0;
                            display:flex;align-items:center;justify-content:center;
                            font-size:11px;color:#94a3b8;">
                    ${(e.nombre||'?').charAt(0).toUpperCase()}</div>`;
            return `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i+1}</td>
                <td class="px-3">${fotoHtml}</td>
                <td class="px-3">
                    <span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">
                        ${e.numero_empleado||'—'}</span></td>
                <td class="px-3" style="font-size:13px;">
                    ${e.nombre} ${e.apellido_paterno} ${e.apellido_materno||''}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.telefono||'—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.correo||'—'}</td>
                <td class="px-3 text-center">
                    ${tieneCuenta
                        ? `<span class="badge bg-success" style="font-size:11px;">
                               <i class="fa-solid fa-circle-check me-1"></i>${e.username}</span>`
                        : `<span class="badge bg-secondary" style="font-size:11px;">Sin cuenta</span>`}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarEmpleado(${e.pk_empleado})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i></button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja"
                        onclick="abrirBaja(${e.pk_empleado},
                            '${(e.nombre+' '+e.apellido_paterno).replace(/'/g,"\\'")}',
                            '${(e.numero_empleado||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-user-slash" style="font-size:11px;"></i></button>
                </td>
            </tr>`;
        }).join('');
        initPaginacion({ tbodyId: 'empBody', filasPorPagina: 10, sufijo: 'emp' });
    }

    window.filtrarTabla = function() {
        const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
        renderTabla(_registrosActivos.filter(e =>
            `${e.numero_empleado} ${e.nombre} ${e.apellido_paterno} ${e.correo}`.toLowerCase().includes(q)
        ));
    };

    window.switchTab = function(tab) {
        const va = document.getElementById('vistaActivos');
        const vb = document.getElementById('vistaBajas');
        const ta = document.getElementById('tabActivos');
        const tb = document.getElementById('tabBajas');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vb.classList.add('d-none');
            ta.classList.add('active');    tb.classList.remove('active');
        } else {
            va.classList.add('d-none');    vb.classList.remove('d-none');
            ta.classList.remove('active'); tb.classList.add('active');
            listarBajas();
        }
    };

    async function listarBajas() {
        const cuerpo = document.getElementById('bajasBody');
        if (!cuerpo) return;
        cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data  = await fetchWithAuth('/empleados/bajas');
            const badge = document.getElementById('badgeBajas');
            if (badge) badge.textContent = data.length;
            if (!data.length) {
                cuerpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-user-slash fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay empleados dados de baja</td></tr>`;
                    initPaginacion({ tbodyId: 'bajasBody', filasPorPagina: 10, sufijo: 'baj' });
                return;
            }
            cuerpo.innerHTML = data.map((e,i) => `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i+1}</td>
                    <td class="px-3"><span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">${e.numero_empleado||'—'}</span></td>
                    <td class="px-3" style="font-size:13px;">${e.nombre} ${e.apellido_paterno} ${e.apellido_materno||''}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.telefono||'—'}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">${e.correo||'—'}</td>
                    <td class="px-3 text-center"><span class="badge bg-secondary">Inactivo</span></td>
                </tr>`).join('');
                initPaginacion({ tbodyId: 'bajasBody', filasPorPagina: 10, sufijo: 'baj' });
        } catch(e) { console.error('Error bajas:', e); }
    }

    window.editarEmpleado = function(id) {
        const emp = _registrosActivos.find(e => e.pk_empleado === id);
        if (!emp) return;

        _fotoFile       = null;
        _empleadoCreado = emp.pk_empleado;
        _modoEdicion    = true;

        // Mostrar contenedor directamente SIN llamar mostrarFormulario()
        document.getElementById('contenedorFormulario').classList.remove('d-none');
        document.getElementById('contenedorTabla').classList.add('d-none');

        irPaso1();

        // Llenar campos
        document.getElementById('pk_empleado').value      = emp.pk_empleado;
        document.getElementById('numero_empleado').value  = emp.numero_empleado||'';
        document.getElementById('nombre').value           = emp.nombre;
        document.getElementById('apellido_paterno').value = emp.apellido_paterno;
        document.getElementById('apellido_materno').value = emp.apellido_materno||'';
        document.getElementById('sexo').value             = emp.sexo||'';
        document.getElementById('fecha_nacimiento').value = emp.fecha_nacimiento
            ? emp.fecha_nacimiento.split('T')[0] : '';
        document.getElementById('telefono').value         = emp.telefono||'';
        document.getElementById('correo').value           = emp.correo||'';
        document.getElementById('direccion').value        = emp.direccion||'';
        document.getElementById('fecha_ingreso').value    = emp.fecha_ingreso
            ? emp.fecha_ingreso.split('T')[0] : '';

        // Foto
        const preview = document.getElementById('fotoPreview');
        if (emp.foto_perfil) {
            preview.innerHTML = `<img src="${emp.foto_perfil}"
                style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            preview.innerHTML = `
                <i class="fa-solid fa-camera" style="color:#3b82f6;font-size:18px;"></i>
                <span style="font-size:9px;color:#3b82f6;">Foto</span>`;
        }

        document.getElementById('tituloFormulario').textContent =
            `Editando: ${emp.nombre} ${emp.apellido_paterno}`;

        // Aplicar estado de cuenta usando setTimeout para
        // ejecutarse DESPUÉS de cualquier otro código que pueda interferir
        const tieneCuenta = emp.pk_user !== null && emp.pk_user !== undefined && emp.estado_user == 1;

        setTimeout(() => {
            const avisoCuenta     = document.getElementById('avisoCuentaExistente');
            const switchContainer = document.getElementById('switchContainer');
            const btnSiguiente    = document.getElementById('btnSiguiente');
            const btnGuardar      = document.getElementById('btnGuardarPaso1');
            const sw              = document.getElementById('switchCuenta');
            const subtexto        = document.getElementById('switchSubtexto');

            if (tieneCuenta) {
                switchContainer.classList.add('d-none');
                btnSiguiente.classList.add('d-none');
                avisoCuenta.classList.remove('d-none');
                document.getElementById('usernameCuenta').textContent = emp.username;
                btnGuardar.disabled = false;
            } else {
                switchContainer.classList.remove('d-none');
                btnSiguiente.classList.remove('d-none');
                avisoCuenta.classList.add('d-none');
                sw.checked            = false;
                btnGuardar.disabled   = false;
                btnSiguiente.disabled = true;
                switchContainer.style.background  = '#f0f9ff';
                switchContainer.style.borderColor = '#bae6fd';
                subtexto.textContent = 'Activa para configurar usuario y contraseña';
                subtexto.style.color = '#7dd3fc';
            }
        }, 50);
    };

    window.abrirBaja = function(id, nombre, numero) {
        _idBaja = id;
        document.getElementById('bajaNombre').textContent    = nombre;
        document.getElementById('bajaNumeroEmp').textContent = numero;
        new bootstrap.Modal(document.getElementById('modalBaja')).show();
    };

    window.confirmarBaja = async function() {
        try {
            await fetchWithAuth(`/empleados/${_idBaja}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalBaja')).hide();
            Swal.fire({ icon:'success', title:'Baja registrada',
                timer:2000, showConfirmButton:false });
            listar();
        } catch (error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

    window.verFotoGrande = function(url) {
        document.getElementById('fotoGrande').src = url;
        new bootstrap.Modal(document.getElementById('modalFoto')).show();
    };

    window._resetearVariablesEmpleado = function() {
        _fotoFile       = null;
        _empleadoCreado = null;
        _modoEdicion    = false;
    };

})();

// ── UI Global ─────────────────────────────────
window.mostrarFormulario = function() {
    _modoEdicion = false;

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');

    const pk = document.getElementById('pk_empleado');
    if (pk) pk.value = '';

    const paso1 = document.getElementById('paso1');
    const paso2 = document.getElementById('paso2');
    if (paso1) paso1.classList.remove('d-none');
    if (paso2) paso2.classList.add('d-none');

    const titulo = document.getElementById('tituloFormulario');
    if (titulo) titulo.textContent = 'Registrar empleado';

    const preview = document.getElementById('fotoPreview');
    if (preview) preview.innerHTML = `
        <i class="fa-solid fa-camera" style="color:#3b82f6;font-size:18px;"></i>
        <span style="font-size:9px;color:#3b82f6;">Foto</span>`;

    const c1 = document.getElementById('step-circle-1');
    const c2 = document.getElementById('step-circle-2');
    const l2 = document.getElementById('step-label-2');
    const ln = document.getElementById('step-line');
    if (c1) { c1.style.background='#1a3c5e'; c1.style.color='#fff'; c1.textContent='1'; }
    if (c2) { c2.style.background='#e2e8f0'; c2.style.color='#94a3b8'; c2.textContent='2'; }
    if (l2) l2.style.color     = '#94a3b8';
    if (ln) ln.style.background = '#e2e8f0';

    // Usar classList en lugar de style.display para evitar conflictos
    const switchContainer = document.getElementById('switchContainer');
    const avisoCuenta     = document.getElementById('avisoCuentaExistente');
    const btnSiguiente    = document.getElementById('btnSiguiente');
    const btnGuardar      = document.getElementById('btnGuardarPaso1');
    const sw              = document.getElementById('switchCuenta');
    const subtexto        = document.getElementById('switchSubtexto');

    if (switchContainer) switchContainer.classList.remove('d-none');
    if (avisoCuenta)     avisoCuenta.classList.add('d-none');
    if (btnSiguiente)  { btnSiguiente.classList.remove('d-none'); btnSiguiente.disabled = true; }
    if (btnGuardar)      btnGuardar.disabled   = false;
    if (sw)              sw.checked            = false;
    if (switchContainer) {
        switchContainer.style.background  = '#f0f9ff';
        switchContainer.style.borderColor = '#bae6fd';
    }
    if (subtexto) {
        subtexto.textContent = 'Activa para configurar usuario y contraseña';
        subtexto.style.color = '#7dd3fc';
    }

    const form = document.getElementById('formEmpleado');
    if (form) form.reset();

    document.getElementById('pk_empleado').value       = '';
    document.getElementById('numero_empleado').value   = '';
    document.getElementById('nombre').value            = '';
    document.getElementById('apellido_paterno').value  = '';
    document.getElementById('apellido_materno').value  = '';
    document.getElementById('sexo').value              = '';
    document.getElementById('fecha_nacimiento').value  = '';
    document.getElementById('telefono').value          = '';
    document.getElementById('correo').value            = '';
    document.getElementById('direccion').value         = '';
    document.getElementById('fecha_ingreso').value     = '';

    window._fotoFile       = null;
    window._empleadoCreado = null;
    window._modoEdicion    = false;
};

window.mostrarTabla = function() {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};