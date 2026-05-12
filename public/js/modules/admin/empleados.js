(function () {
    // quitar flag de inicialización
    let _registrosActivos = [];
    let _registrosBajas   = [];
    let _idBaja           = null;
    let _empleadoCreado   = null;
    let _idReactivar      = null;
    let _idRenovar        = null;
    let _fotoFile         = null;
    let _modoEdicion      = false;

    esperarElemento('empBody', async () => {
        await cargarRolesSelect();
        await cargarTiposContratoSelect();
        await cargarMotivosSelect();
        await cargarAlertasContratos();
        listar();
     }, 20, 'admin/empleados');

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
    async function cargarTiposContratoSelect() {
    try {
        const tipos = await fetchWithAuth('/tipo_contrato');
        const sel   = document.getElementById('fk_tipo_contrato');
        tipos.forEach(t => {
            const opt       = document.createElement('option');
            opt.value       = t.pk_tipo_contrato;
            opt.textContent = t.nombre;
            sel.appendChild(opt);
        });
    } catch (e) { console.error('Error tipos contrato:', e); }
    }

    async function cargarMotivosSelect() {
        try {
            const motivos = await fetchWithAuth('/motivo_baja');
            const sel     = document.getElementById('selectMotivoBaja');
            motivos.forEach(m => {
                const opt       = document.createElement('option');
                opt.value       = m.pk_motivo_baja;
                opt.textContent = m.nombre;
                sel.appendChild(opt);
            });
        } catch (e) { console.error('Error motivos baja:', e); }
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

            // Subir documento contrato si hay archivo (solo en alta nueva)
            if (!id) {
                const archivoContrato = document.getElementById('contrato_documento')?.files[0];
                if (archivoContrato) {
                    const fd = new FormData();
                    fd.append('archivo', archivoContrato);
                    const res = await fetch('/archivo/temporal', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                        body: fd
                    });
                    const d = await res.json();
                    data.documento_contrato = d.url || null;
                }
            }

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

            // Subir documento contrato si hay archivo (solo en alta nueva)
            if (!id) {
                const archivoContrato = document.getElementById('contrato_documento')?.files[0];
                if (archivoContrato) {
                    const fd = new FormData();
                    fd.append('archivo', archivoContrato);
                    const res = await fetch('/archivo/temporal', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                        body: fd
                    });
                    const d = await res.json();
                    data.documento_contrato = d.url || null;
                }
            }

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
    const numero        = document.getElementById('numero_empleado').value.trim();
    const nombre        = document.getElementById('nombre').value.trim();
    const apellido      = document.getElementById('apellido_paterno').value.trim();
    const tipoContrato  = document.getElementById('fk_tipo_contrato').value;
    const id            = document.getElementById('pk_empleado').value;
    const correo = document.getElementById('correo').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const fechaNac = document.getElementById('fecha_nacimiento').value;
    const fechaIng = document.getElementById('fecha_ingreso').value;
    if (!numero || !nombre || !apellido) {
        Swal.fire({ icon:'warning', title:'Campos requeridos',
            text:'Número de empleado, nombre y apellido paterno son obligatorios' });
        return false;
    }
    // Validar formato de nombre y apellidos
    const errsNombre = validarFormato(nombre);
    if (errsNombre.length) {
        Swal.fire({ icon:'warning', title:'Nombre inválido', text: errsNombre[0] });
        return false;
    }
    const errsApellido = validarFormato(apellido);
    if (errsApellido.length) {
        Swal.fire({ icon:'warning', title:'Apellido paterno inválido', text: errsApellido[0] });
        return false;
    }
    const apellidoMaterno = document.getElementById('apellido_materno').value.trim();
    if (apellidoMaterno) {
        const errsAM = validarFormato(apellidoMaterno);
        if (errsAM.length) {
            Swal.fire({ icon:'warning', title:'Apellido materno inválido', text: errsAM[0] });
            return false;
        }
    }
    if (!id && !tipoContrato) {
        Swal.fire({ icon:'warning', title:'Campos requeridos',
            text:'El tipo de contrato es obligatorio' });
        return false;
    }
    if (!correo || !validarCorreo(correo)) {
        Swal.fire({ icon:'warning', title:'Correo inválido', text:'El correo es obligatorio. Ingresa un formato válido (ej: usuario2@gmail.com)' });
        return false;
    }
    if (telefono && telefono.replace(/\D/g, '').length !== 10) {
        Swal.fire({ icon:'warning', title:'Teléfono inválido', text:'El teléfono debe tener exactamente 10 dígitos' });
        return false;
    }
    if (fechaNac && new Date(fechaNac) >= new Date()) {
        Swal.fire({ icon:'warning', title:'Fecha inválida', text:'La fecha de nacimiento no puede ser futura' });
        return false;
    }
    if (!fechaIng) {
        Swal.fire({ icon:'warning', title:'Campo requerido', text:'La fecha de ingreso es obligatoria' });
        return false;
    }

    // Contrato (solo en alta nueva)
    if (!id) {
        const regimen     = document.getElementById('regimen_laboral').value;
        const numContrato = document.getElementById('contrato_numero')?.value.trim();
        const fechaInicio = document.getElementById('contrato_fecha_inicio')?.value;
        const fechaFin    = document.getElementById('contrato_fecha_fin')?.value;

        if (!regimen) {
            Swal.fire({ icon:'warning', title:'Campo requerido', text:'El régimen laboral es obligatorio' });
            return false;
        }
        if (!numContrato) {
            Swal.fire({ icon:'warning', title:'Campo requerido', text:'El número de contrato es obligatorio' });
            return false;
        }
        if (!fechaInicio) {
            Swal.fire({ icon:'warning', title:'Campo requerido', text:'La fecha de inicio del contrato es obligatoria' });
            return false;
        }
        if (new Date(fechaInicio) < new Date(fechaIng)) {
            Swal.fire({ icon:'warning', title:'Fecha inválida', text:'La fecha de inicio del contrato no puede ser anterior a la fecha de ingreso' });
            return false;
        }
        if (fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
            Swal.fire({ icon:'warning', title:'Fecha inválida', text:'La fecha de fin debe ser posterior a la fecha de inicio' });
            return false;
        }
    }
    return true;
    }

    function recolectarDatosPaso1() {
        return {
            numero_empleado:       document.getElementById('numero_empleado').value.trim(),
            nombre:                document.getElementById('nombre').value.trim(),
            apellido_paterno:      document.getElementById('apellido_paterno').value.trim(),
            apellido_materno:      document.getElementById('apellido_materno').value.trim(),
            sexo:                  document.getElementById('sexo').value,
            fecha_nacimiento:      document.getElementById('fecha_nacimiento').value,
            telefono:              document.getElementById('telefono').value.trim(),
            correo:                document.getElementById('correo').value.trim(),
            direccion:             document.getElementById('direccion').value.trim(),
            fecha_ingreso:         document.getElementById('fecha_ingreso').value,
            fk_tipo_contrato:      document.getElementById('fk_tipo_contrato').value,
            regimen_laboral:       document.getElementById('regimen_laboral').value,
            numero_contrato:       document.getElementById('contrato_numero')?.value.trim() || null,
            contrato_fecha_inicio: document.getElementById('contrato_fecha_inicio')?.value || null,
            contrato_fecha_fin:    document.getElementById('contrato_fecha_fin')?.value || null,
            justificacion:         document.getElementById('contrato_justificacion')?.value.trim() || null,
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

    async function cargarAlertasContratos() {
    try {
        const data = await fetchWithAuth('/alertas/pendientes');
        const alertasEmp = data.filter(a =>
            a.tipo_activo === 'empleado' &&
            ['contrato_vencido', 'contrato_por_vencer_30', 'contrato_por_vencer_60'].includes(a.tipo_alerta)
        );

        const contenedor = document.getElementById('alertasContratosEmp');
        const lista      = document.getElementById('listaAlertasContratos');
        const badge      = document.getElementById('badgeAlertasContratos');

        if (!alertasEmp.length) {
            contenedor.classList.add('d-none');
            return;
        }

        badge.textContent = alertasEmp.length;
        contenedor.classList.remove('d-none');

        lista.innerHTML = alertasEmp.map(a => {
            const color = a.tipo_alerta === 'contrato_vencido'
                ? { bg: '#fbe9e7', border: '#b2382d', text: '#b2382d', icon: 'fa-circle-xmark' }
                : a.tipo_alerta === 'contrato_por_vencer_30'
                ? { bg: '#fff3e0', border: '#e65100', text: '#e65100', icon: 'fa-clock' }
                : { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32', icon: 'fa-circle-info' };

            return `
                <div class="d-flex align-items-start justify-content-between gap-2 p-2 rounded-2"
                     style="background:${color.bg};border:1px solid ${color.border}20;">
                    <div class="d-flex align-items-start gap-2">
                        <i class="fa-solid ${color.icon} mt-1" style="color:${color.text};font-size:13px;flex-shrink:0;"></i>
                        <span style="font-size:12px;color:#333;">${a.mensaje}</span>
                    </div>
                    <button class="btn btn-sm py-0 px-2 flex-shrink-0"
                            style="font-size:11px;border:1px solid ${color.border};color:${color.text};"
                            onclick="marcarAlertaLeida(${a.pk_alerta})">
                        <i class="fa-solid fa-check me-1"></i>Leída
                    </button>
                </div>`;
        }).join('');

    } catch(e) { console.error('Error alertas contratos:', e); }
}

window.marcarAlertaLeida = async function(id) {
    try {
        await fetchWithAuth(`/alertas/${id}/leida`, 'PATCH');
        await cargarAlertasContratos();
    } catch(e) { console.error('Error marcar leída:', e); }
};

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
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                ${e.sexo
                    ? e.sexo.charAt(0).toUpperCase() + e.sexo.slice(1)
                    : '—'}
            </td>
            <td class="px-3 text-center text-muted" style="font-size:13px;">
                ${e.fecha_nacimiento
                    ? (() => {
                        const [y, m, d] = String(e.fecha_nacimiento).slice(0,10).split('-');
                        const hoy = new Date();
                        let edad = hoy.getFullYear() - parseInt(y);
                        if (hoy.getMonth()+1 < parseInt(m) ||
                        (hoy.getMonth()+1 === parseInt(m) && hoy.getDate() < parseInt(d))) edad--;
                        return edad > 0 ? edad + ' años' : '—';
                    })()
                    : '—'}
            </td>
             <td class="px-3 text-muted" style="font-size:13px;">
                ${e.direccion || '—'}
            </td>
            <td class="px-3 text-center" style="font-size:13px;">
                ${e.tipo_contrato || 'Sin contrato'}
            </td>
            <td class="px-3 text-center text-muted" style="font-size:13px;">
                ${e.regimen_laboral
                    ? e.regimen_laboral.charAt(0).toUpperCase() + e.regimen_laboral.slice(1)
                    : '—'}
            </td>
            <td class="px-3 text-center text-muted" style="font-size:13px;">
                ${e.fecha_ingreso
                    ? (() => { const [y,m,d] = String(e.fecha_ingreso).slice(0,10).split('-'); return `${d}/${m}/${y}`; })()
                    : '—'}
            </td>
                <td class="px-3 text-center">
                    ${tieneCuenta
                        ? `<span class="badge bg-success" style="font-size:11px;">
                            <i class="fa-solid fa-circle-check me-1"></i>Con cuenta</span>`
                        : `<span class="badge bg-secondary" style="font-size:11px;">Sin cuenta</span>`}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarEmpleado(${e.pk_empleado})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Historial contratos"
                        onclick="abrirHistorialContratos(${e.pk_empleado},
                            '${(e.nombre+' '+e.apellido_paterno).replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" title="Renovar contrato"
                        onclick="abrirRenovar(${e.pk_empleado},
                            '${(e.nombre+' '+e.apellido_paterno).replace(/'/g,"\\'")}',
                            '${(e.numero_empleado||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-file-contract" style="font-size:11px;"></i></button>
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
        cuerpo.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando…</td></tr>`;
        try {
            const data  = await fetchWithAuth('/empleados/bajas');
            _registrosBajas = Array.isArray(data) ? data : [];
            const badge = document.getElementById('badgeBajas');
            if (badge) badge.textContent = data.length;
            if (!data.length) {
                cuerpo.innerHTML = `<tr><td colspan="11" class="text-center py-5 text-muted">
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
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
            ${e.sexo ? e.sexo.charAt(0).toUpperCase() + e.sexo.slice(1) : '—'}
        </td>
        <td class="px-3 text-center text-muted" style="font-size:13px;">
            ${e.fecha_nacimiento
                ? (() => {
                    const [y,m,d] = String(e.fecha_nacimiento).slice(0,10).split('-');
                    const hoy = new Date();
                    let edad = hoy.getFullYear() - parseInt(y);
                    if (hoy.getMonth()+1 < parseInt(m) ||
                       (hoy.getMonth()+1 === parseInt(m) && hoy.getDate() < parseInt(d))) edad--;
                    return edad > 0 ? edad + ' años' : '—';
                  })()
                : '—'}
        </td>

        <td class="px-3 text-muted" style="font-size:13px;">${e.direccion||'—'}</td>
        <td class="px-3 text-center text-muted" style="font-size:13px;">
            ${e.fecha_baja ? (() => { const [y,m,d] = String(e.fecha_baja).slice(0,10).split('-'); return `${d}/${m}/${y}`; })() : '—'}
        </td>
        <td class="px-3 text-center" style="font-size:13px;">
            ${e.motivo_baja
                ? `<span class="badge me-1" style="background:#fbe9e7;color:#b2382d;font-size:11px;">${e.motivo_baja}</span>`
                : '<span class="text-muted" style="font-size:12px;">—</span>'}
        </td>
        <td class="px-3 text-center text-muted" style="font-size:13px;">
            ${e.fecha_ingreso ? (() => { const [y,m,d] = String(e.fecha_ingreso).slice(0,10).split('-'); return `${d}/${m}/${y}`; })() : '—'}
        </td>
        <td class="px-3 text-center" style="white-space:nowrap;">
            <button class="btn btn-sm btn-outline-success" title="Reactivar"
                onclick="abrirReactivar(${e.pk_empleado},
                    '${(e.nombre+' '+e.apellido_paterno).replace(/'/g,"\\'")}',
                    '${(e.numero_empleado||'').replace(/'/g,"\\'")}')">
                <i class="fa-solid fa-rotate-right" style="font-size:11px;"></i>
            </button>
        </td>
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
        document.getElementById('fecha_ingreso').readOnly = true;
        document.getElementById('fecha_ingreso').style.background = '#f8f9fa';
        document.getElementById('fk_tipo_contrato').value   = emp.fk_tipo_contrato||'';
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

        // Ocultar sección contrato completa en edición
        const seccionContrato = document.getElementById('seccionContratoInicial')?.closest('.mt-4');
        if (seccionContrato) seccionContrato.classList.add('d-none');

        // Ocultar card contrato activo al abrir formulario nuevo
        const cardContrato = document.getElementById('cardContratoActivo');
        if (cardContrato) cardContrato.classList.add('d-none');

        // ── Cargar y mostrar contrato activo ──
        cargarContratoActivoEdicion(emp.pk_empleado, emp.estado);

    }, 50);
    };

        window.abrirBaja = function(id, nombre, numero) {
            _idBaja = id;
            document.getElementById('bajaNombre').textContent    = nombre;
            document.getElementById('bajaNumeroEmp').textContent = numero;
            new bootstrap.Modal(document.getElementById('modalBaja')).show();
        };

        window.abrirReactivar = function(id, nombre, numero) {
            _idReactivar = id;
            document.getElementById('reactivarNombre').textContent    = nombre;
            document.getElementById('reactivarNumeroEmp').textContent = numero;
            document.getElementById('selectRegimenReactivar').value   = '';
            document.getElementById('reactivar_numero_contrato').value = '';
            document.getElementById('reactivar_fecha_inicio').value   = '';
            document.getElementById('reactivar_fecha_fin').value      = '';
            document.getElementById('reactivar_motivo').value         = '';
            const sel = document.getElementById('selectTipoContratoReactivar');
            sel.innerHTML = '<option value="">Seleccionar tipo…</option>';
            document.querySelectorAll('#fk_tipo_contrato option').forEach(opt => {
                if (opt.value) sel.appendChild(opt.cloneNode(true));
            });
            new bootstrap.Modal(document.getElementById('modalReactivar')).show();
        };

        window.confirmarReactivar = async function() {
        const fk_tipo_contrato = document.getElementById('selectTipoContratoReactivar').value;
        const fecha_inicio     = document.getElementById('reactivar_fecha_inicio').value;
        const fechaFin = document.getElementById('reactivar_fecha_fin').value;
        const numContratoReac = document.getElementById('reactivar_numero_contrato').value.trim();

        if (!fk_tipo_contrato) {
            Swal.fire({ icon:'warning', title:'Requerido', text:'Selecciona un tipo de contrato' });
            return;
        }
        if (!fecha_inicio) {
            Swal.fire({ icon:'warning', title:'Requerido', text:'La fecha de inicio es requerida' });
            return;
        }
        if (fechaFin && new Date(fechaFin) <= new Date(fecha_inicio)) {
            Swal.fire({ icon:'warning', title:'Fecha inválida', text:'La fecha de fin debe ser posterior a la fecha de inicio' });
            return;
        }
        if (!numContratoReac) {
            Swal.fire({ icon:'warning', title:'Campo requerido', text:'El número de contrato es obligatorio' });
            return;
        }

        try {
            let documento_contrato = null;
            const file = document.getElementById('reactivar_documento')?.files[0];
            if (file) {
                const fd = new FormData();
                fd.append('archivo', file);
                const res = await fetch('/archivo/temporal', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body: fd
                });
                const d = await res.json();
                documento_contrato = d.url || null;
            }

            await fetchWithAuth(`/empleados/${_idReactivar}/reactivar`, 'PUT', {
                fk_tipo_contrato,
                regimen_laboral:   document.getElementById('selectRegimenReactivar').value || null,
                numero_contrato:   document.getElementById('reactivar_numero_contrato').value.trim() || null,
                fecha_inicio,
                fecha_fin:         document.getElementById('reactivar_fecha_fin').value || null,
                justificacion: document.getElementById('reactivar_motivo').value.trim() || null,
                documento_contrato
            });

            bootstrap.Modal.getInstance(document.getElementById('modalReactivar')).hide();
            Swal.fire({ icon:'success', title:'Reactivado', timer:2000, showConfirmButton:false });
            listarBajas();
            listar();
        } catch (error) {
            Swal.fire({ icon:'error', title:'Error', text:error.message });
        }
    };

        window.abrirRenovar = function(id, nombre, numero) {
        _idRenovar = id;
        document.getElementById('renovarNombre').textContent    = nombre;
        document.getElementById('renovarNumeroEmp').textContent = numero;
        const sel = document.getElementById('selectTipoContratoRenovar');
        sel.innerHTML = '<option value="">Seleccionar tipo…</option>';
        document.querySelectorAll('#fk_tipo_contrato option').forEach(opt => {
            if (opt.value) sel.appendChild(opt.cloneNode(true));
        });
        document.getElementById('renovar_regimen_laboral').value   = '';
        document.getElementById('renovar_numero_contrato').value   = '';
        document.getElementById('renovar_fecha_inicio').value      = '';
        document.getElementById('renovar_fecha_fin').value         = '';
        document.getElementById('renovar_motivo_renovacion').value = '';
        document.getElementById('renovar_documento_contrato').value = '';
        new bootstrap.Modal(document.getElementById('modalRenovar')).show();
    };

        window.confirmarRenovar = async function() {
            const fk_tipo_contrato  = document.getElementById('selectTipoContratoRenovar').value;
            const fecha_inicio      = document.getElementById('renovar_fecha_inicio').value;
            const numContrato = document.getElementById('renovar_numero_contrato').value.trim();
            const fechaFin = document.getElementById('renovar_fecha_fin').value;
            if (!fk_tipo_contrato) {
                Swal.fire({ icon:'warning', title:'Requerido', text:'Selecciona un tipo de contrato' });
                return;
            }
            if (!fecha_inicio) {
                Swal.fire({ icon:'warning', title:'Requerido', text:'La fecha de inicio es requerida' });
                return;
            }
            if (fechaFin && new Date(fechaFin) <= new Date(fecha_inicio)) {
                Swal.fire({ icon:'warning', title:'Fecha inválida', text:'La fecha de fin debe ser posterior a la fecha de inicio' });
                return;
            }
            if (!numContrato) {
                Swal.fire({ icon:'warning', title:'Campo requerido', text:'El número de contrato es obligatorio' });
                return;
            }

            try {
                let documento_contrato = null;
                const archivoContrato = document.getElementById('renovar_documento_contrato').files[0];
                if (archivoContrato) {
                    const formData = new FormData();
                    formData.append('archivo', archivoContrato);
                    const res = await fetch('/archivo/temporal', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                        body: formData
                    });
                    const data = await res.json();
                    documento_contrato = data.url || null;
                }

                await fetchWithAuth(`/empleados/${_idRenovar}/renovar-contrato`, 'PATCH', {
                    fk_tipo_contrato,
                    regimen_laboral:   document.getElementById('renovar_regimen_laboral').value || null,
                    numero_contrato:   document.getElementById('renovar_numero_contrato').value.trim() || null,
                    fecha_inicio,
                    fecha_fin:         document.getElementById('renovar_fecha_fin').value || null,
                    justificacion: document.getElementById('renovar_motivo_renovacion').value.trim() || null,
                    documento_contrato
                });

                bootstrap.Modal.getInstance(document.getElementById('modalRenovar')).hide();
                Swal.fire({ icon:'success', title:'Contrato renovado', timer:2000, showConfirmButton:false });
                listar();
            } catch (error) {
                Swal.fire({ icon:'error', title:'Error', text:error.message });
            }
        };

    window.confirmarBaja = async function() {
        try {
            const motivo = document.getElementById('selectMotivoBaja').value;
            if (!motivo) {
                Swal.fire({ icon:'warning', title:'Requerido', text:'Selecciona un motivo de baja' });
                return;
            }
            await fetchWithAuth(`/empleados/${_idBaja}/baja`, 'PATCH', { fk_motivo_baja: motivo });
            document.getElementById('selectMotivoBaja').value = '';
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

        window.filtrarTablaBajas = function() {
        const q = (document.getElementById('searchInputBajas')?.value || '').toLowerCase();
        const filtrados = _registrosBajas.filter(e =>
            `${e.numero_empleado} ${e.nombre} ${e.apellido_paterno} ${e.correo||''}`.toLowerCase().includes(q)
        );
        const cuerpo = document.getElementById('bajasBody');
        const info   = document.getElementById('footerInfoBajas');
        if (info) info.textContent = `Mostrando ${filtrados.length} de ${_registrosBajas.length} registros`;
        cuerpo.innerHTML = filtrados.map((e, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i+1}</td>
                <td class="px-3"><span class="fw-bold" style="font-family:monospace;color:#1a3c5e;font-size:12px;">${e.numero_empleado||'—'}</span></td>
                <td class="px-3" style="font-size:13px;">${e.nombre} ${e.apellido_paterno} ${e.apellido_materno||''}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.telefono||'—'}</td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.correo||'—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${e.sexo ? e.sexo.charAt(0).toUpperCase() + e.sexo.slice(1) : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${e.fecha_nacimiento ? (() => {
                        const [y,m,d] = String(e.fecha_nacimiento).slice(0,10).split('-');
                        const hoy = new Date();
                        let edad = hoy.getFullYear() - parseInt(y);
                        if (hoy.getMonth()+1 < parseInt(m) ||
                        (hoy.getMonth()+1 === parseInt(m) && hoy.getDate() < parseInt(d))) edad--;
                        return edad > 0 ? edad + ' años' : '—';
                    })() : '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${e.direccion||'—'}</td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${e.fecha_baja ? (() => { const [y,m,d] = String(e.fecha_baja).slice(0,10).split('-'); return `${d}/${m}/${y}`; })() : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:13px;">
                    ${e.motivo_baja
                        ? `<span class="badge me-1" style="background:#fbe9e7;color:#b2382d;font-size:11px;">${e.motivo_baja}</span>`
                        : '<span class="text-muted" style="font-size:12px;">—</span>'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${e.fecha_ingreso ? (() => { const [y,m,d] = String(e.fecha_ingreso).slice(0,10).split('-'); return `${d}/${m}/${y}`; })() : '—'}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-success" title="Reactivar"
                        onclick="abrirReactivar(${e.pk_empleado},
                            '${(e.nombre+' '+e.apellido_paterno).replace(/'/g,"\\'")}',
                            '${(e.numero_empleado||'').replace(/'/g,"\\'")}')">
                        <i class="fa-solid fa-rotate-right" style="font-size:11px;"></i>
                    </button>
                </td>
        </tr>`).join('');
        initPaginacion({ tbodyId: 'bajasBody', filasPorPagina: 10, sufijo: 'baj' });
    };

    async function cargarContratoActivoEdicion(idEmpleado, estadoEmpleado) {
    const card    = document.getElementById('cardContratoActivo');
    const cuerpo  = document.getElementById('cuerpoContratoActivo');
    const botones = document.getElementById('botonesContratoEdicion');
    if (!card) return;

    card.classList.remove('d-none');

    try {
        const contrato = await fetchWithAuth(`/empleados/${idEmpleado}/contrato-activo`);

        const fmt = (fecha) => {
            if (!fecha) return '—';
            const [y, m, d] = String(fecha).slice(0, 10).split('-');
            return `${d}/${m}/${y}`;
        };

        const labelTipoAlta = {
            contratacion:   'Contratación',
            renovacion:     'Renovación',
            recontratacion: 'Recontratación'
        };

        cuerpo.innerHTML = `
            <div class="col-md-4">
                <div class="small text-muted mb-1" style="font-size:11px;">N° CONTRATO</div>
                <div style="font-size:13px;font-weight:500;color:#1a3c5e;">
                    ${contrato.numero_contrato || '—'}
                </div>
            </div>
            <div class="col-md-4">
                <div class="small text-muted mb-1" style="font-size:11px;">TIPO</div>
                <div style="font-size:13px;">${contrato.tipo_contrato || '—'}</div>
            </div>
            <div class="col-md-4">
                <div class="small text-muted mb-1" style="font-size:11px;">RÉGIMEN</div>
                <div style="font-size:13px;">
                    ${contrato.regimen_laboral
                        ? contrato.regimen_laboral.charAt(0).toUpperCase() + contrato.regimen_laboral.slice(1)
                        : '—'}
                </div>
            </div>
            <div class="col-md-4">
                <div class="small text-muted mb-1" style="font-size:11px;">INICIO</div>
                <div style="font-size:13px;">${fmt(contrato.fecha_inicio)}</div>
            </div>
            <div class="col-md-4">
                <div class="small text-muted mb-1" style="font-size:11px;">FIN</div>
                <div style="font-size:13px;">${fmt(contrato.fecha_fin)}</div>
            </div>
            <div class="col-md-4">
                <div class="small text-muted mb-1" style="font-size:11px;">TIPO ALTA</div>
                <div style="font-size:13px;">
                    ${labelTipoAlta[contrato.tipo_alta] || '—'}
                </div>
            </div>
            ${contrato.documento_contrato ? `
            <div class="col-12 mt-1">
                <a href="${contrato.documento_contrato}" target="_blank"
                   class="btn btn-sm btn-outline-danger">
                    <i class="fa-solid fa-file-pdf me-1"></i>Ver documento
                </a>
            </div>` : ''}
        `;

        // Botones según estado del empleado
        if (estadoEmpleado === 'activo') {
            botones.innerHTML = `
                <button class="btn btn-sm btn-outline-secondary fw-semibold"
                    onclick="abrirHistorialContratos(${idEmpleado}, document.getElementById('nombre').value + ' ' + document.getElementById('apellido_paterno').value)">
                    <i class="fa-solid fa-clock-rotate-left me-1"></i>Historial
                </button>
                <button class="btn btn-sm btn-outline-warning fw-semibold"
                    onclick="bootstrap.Modal.getInstance(document.getElementById('contenedorFormulario')) || mostrarTabla(); abrirRenovar(${idEmpleado}, document.getElementById('nombre').value + ' ' + document.getElementById('apellido_paterno').value, document.getElementById('numero_empleado').value)">
                    <i class="fa-solid fa-file-contract me-1"></i>Renovar
                </button>
                <button class="btn btn-sm btn-outline-danger fw-semibold"
                    onclick="mostrarTabla(); setTimeout(() => abrirBaja(${idEmpleado}, document.getElementById('nombre').value + ' ' + document.getElementById('apellido_paterno').value, document.getElementById('numero_empleado').value), 100)">
                    <i class="fa-solid fa-user-slash me-1"></i>Dar de baja
                </button>`;
        } else {
            botones.innerHTML = `
                <button class="btn btn-sm btn-outline-success fw-semibold"
                    onclick="mostrarTabla(); setTimeout(() => abrirReactivar(${idEmpleado}, document.getElementById('nombre').value + ' ' + document.getElementById('apellido_paterno').value, document.getElementById('numero_empleado').value), 100)">
                    <i class="fa-solid fa-rotate-right me-1"></i>Reactivar
                </button>`;
        }

    } catch (e) {
        // Sin contrato activo
        cuerpo.innerHTML = `
            <div class="col-12">
                <span class="text-muted" style="font-size:13px;">
                    <i class="fa-solid fa-circle-info me-1"></i>
                    Este empleado no tiene contrato activo registrado.
                </span>
            </div>`;
        if (estadoEmpleado === 'activo') {
            botones.innerHTML = `
                <button class="btn btn-sm btn-outline-danger fw-semibold"
                    onclick="mostrarTabla(); setTimeout(() => abrirBaja(${idEmpleado}, document.getElementById('nombre').value + ' ' + document.getElementById('apellido_paterno').value, document.getElementById('numero_empleado').value), 100)">
                    <i class="fa-solid fa-user-slash me-1"></i>Dar de baja
                </button>`;
        }
    }
}

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
    document.getElementById('fk_tipo_contrato').value  = '';
    document.getElementById('regimen_laboral').value   = '';
    document.getElementById('fecha_ingreso').readOnly  = false;
    document.getElementById('fecha_ingreso').style.background = '';

    window._fotoFile       = null;
    window._empleadoCreado = null;
    window._modoEdicion    = false;

    // Mostrar sección contrato en registro nuevo
    const seccionContrato = document.getElementById('seccionContratoInicial')?.closest('.mt-4');
    if (seccionContrato) seccionContrato.classList.remove('d-none');

    // Ocultar card contrato activo al abrir formulario nuevo
    const cardContrato = document.getElementById('cardContratoActivo');
    if (cardContrato) cardContrato.classList.add('d-none');
};

window.mostrarTabla = function() {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};

window.abrirHistorialContratos = async function (idEmpleado, nombreEmpleado) {
        document.getElementById('histContratosTitulo').textContent =
            `Historial de contratos — ${nombreEmpleado}`;
        document.getElementById('histContratosBody').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border spinner-border-sm" style="color:#1a3c5e;"></div>
            </div>`;
        new bootstrap.Modal(document.getElementById('modalHistorialContratos')).show();

        try {
            const data = await fetchWithAuth(`/empleados/${idEmpleado}/contratos`);
            const contratos = Array.isArray(data) ? data : [];

            const fmt = (fecha) => {
                if (!fecha) return '—';
                const [y, m, d] = String(fecha).slice(0, 10).split('-');
                return `${d}/${m}/${y}`;
            };

            const labelTipoAlta = {
                contratacion:   'Contratación',
                renovacion:     'Renovación',
                recontratacion: 'Recontratación'
            };

            const cont = document.getElementById('histContratosBody');

            if (!contratos.length) {
                cont.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="fa-solid fa-file-contract fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        Sin contratos registrados
                    </div>`;
                return;
            }

            cont.innerHTML = `
                <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
                    <div class="position-relative flex-grow-1" style="min-width:160px;">
                        <i class="fa-solid fa-magnifying-glass text-muted"
                            style="position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:11px;pointer-events:none;"></i>
                        <input type="text" id="hc-search" class="form-control form-control-sm ps-4"
                            placeholder="Buscar por número, tipo, régimen…" oninput="filtrarHistContratos()">
                    </div>
                    <select id="hc-filtro-tipo" class="form-select form-select-sm" style="width:150px;"
                        onchange="filtrarHistContratos()">
                        <option value="">Todos</option>
                        <option value="contratacion">Contratación</option>
                        <option value="renovacion">Renovación</option>
                        <option value="recontratacion">Recontratación</option>
                    </select>
                </div>
                <div class="d-flex gap-2 mb-3 flex-wrap">
                    <span class="badge" style="background:#1a3c5e;font-size:11px;">
                        Total: <span id="hc-total">${contratos.length}</span>
                    </span>
                    <span class="badge bg-success" style="font-size:11px;">
                        Activos: ${contratos.filter(c => c.activo).length}
                    </span>
                    <span class="badge bg-secondary" style="font-size:11px;">
                        Inactivos: ${contratos.filter(c => !c.activo).length}
                    </span>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover table-sm mb-0" style="font-size:12px;">
                        <thead style="position:sticky;top:0;background:#1a3c5e;color:#fff;z-index:1;">
                            <tr>
                                <th class="px-3 py-2">N° CONTRATO</th>
                                <th class="px-3 py-2">TIPO</th>
                                <th class="px-3 py-2">RÉGIMEN</th>
                                <th class="px-3 py-2 text-center">INICIO</th>
                                <th class="px-3 py-2 text-center">FIN</th>
                                <th class="px-3 py-2 text-center">ALTA</th>
                                <th class="px-3 py-2">JUSTIFICACIÓN</th>
                                <th class="px-3 py-2 text-center">DOC.</th>
                                <th class="px-3 py-2 text-center">ESTADO</th>
                                <th class="px-3 py-2 text-center">CREADO</th>
                            </tr>
                        </thead>
                        <tbody id="hc-body"></tbody>
                    </table>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                    <div id="hc-info" class="text-muted" style="font-size:11px;"></div>
                    <div class="d-flex align-items-center gap-1">
                        <button class="btn btn-sm text-white px-2 py-1" style="background:#1a3c5e;font-size:11px;"
                            onclick="hcPaginar(-1)">‹ Ant</button>
                        <span id="hc-pag-info" class="text-muted" style="font-size:11px;"></span>
                        <button class="btn btn-sm text-white px-2 py-1" style="background:#1a3c5e;font-size:11px;"
                            onclick="hcPaginar(1)">Sig ›</button>
                    </div>
                </div>`;

            window._hcContratos = contratos;
            window._hcFiltrado  = contratos;
            window._hcPagina    = 1;
            window._hcPorPag    = 8;
            window._hcLabelTipoAlta = labelTipoAlta;
            window._hcFmt       = fmt;
            window.renderHcPagina();

        } catch (e) {
            document.getElementById('histContratosBody').innerHTML = `
                <div class="text-center text-danger py-4">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>Error al cargar el historial
                </div>`;
        }
    };

    window.renderHcPagina = function () {
        const data      = window._hcFiltrado || [];
        const porPag    = window._hcPorPag   || 8;
        const pag       = window._hcPagina   || 1;
        const total     = data.length;
        const totalPags = Math.max(1, Math.ceil(total / porPag));
        if (pag > totalPags) window._hcPagina = totalPags;
        const inicio = (window._hcPagina - 1) * porPag;
        const slice  = data.slice(inicio, inicio + porPag);
        const fmt    = window._hcFmt || (f => f ? String(f).slice(0,10) : '—');
        const label  = window._hcLabelTipoAlta || {};

        const tbody = document.getElementById('hc-body');
        if (!tbody) return;

        tbody.innerHTML = slice.length ? slice.map(c => `
            <tr>
                <td class="px-3" style="font-family:monospace;">${c.numero_contrato || '—'}</td>
                <td class="px-3">${c.tipo_contrato || '—'}</td>
                <td class="px-3">${c.regimen_laboral
                    ? c.regimen_laboral.charAt(0).toUpperCase() + c.regimen_laboral.slice(1)
                    : '—'}</td>
                <td class="px-3 text-center text-muted">${fmt(c.fecha_inicio)}</td>
                <td class="px-3 text-center text-muted">${fmt(c.fecha_fin)}</td>
                <td class="px-3 text-center">
                    <span class="badge" style="background:#e8f0fe;color:#1a3c5e;font-size:10px;">
                        ${label[c.tipo_alta] || c.tipo_alta || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="max-width:160px;">
                    ${c.justificacion
                        ? `<span title="${c.justificacion}">${c.justificacion.length > 40
                            ? c.justificacion.substring(0,40) + '…'
                            : c.justificacion}</span>`
                        : '—'}
                </td>
                <td class="px-3 text-center">
                    ${c.documento_contrato
                        ? `<a href="${c.documento_contrato}" target="_blank" class="btn btn-sm btn-outline-danger py-0 px-1">
                            <i class="fa-solid fa-file-pdf" style="font-size:11px;"></i>
                           </a>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-center">
                    ${(() => {
                        const estadoConfig = {
                            vigente:  { bg: '#d1fae5', text: '#065f46', label: 'Vigente'   },
                            vencido:  { bg: '#fee2e2', text: '#991b1b', label: 'Vencido'   },
                            renovado: { bg: '#dbeafe', text: '#1e40af', label: 'Renovado'  },
                            cancelado:{ bg: '#f3f4f6', text: '#374151', label: 'Cancelado' }
                        };
                        const est = estadoConfig[c.estado_contrato] || { bg: '#f3f4f6', text: '#374151', label: c.estado_contrato || '—' };
                        return `<span class="badge" style="background:${est.bg};color:${est.text};font-size:10px;">${est.label}</span>`;
                    })()}
                </td>
                <td class="px-3 text-muted" style="font-size:11px;">
                    ${c.registrado_por_username
                        ? `<span title="${c.fecha_registro ? new Date(c.fecha_registro).toLocaleString('es-MX') : ''}" 
                                style="cursor:help;">
                            <i class="fa-solid fa-user-clock me-1" style="color:#94a3b8;"></i>${c.registrado_por_username}
                        </span>`
                        : '—'}
                </td>
            </tr>`).join('')
        : `<tr><td colspan="10" class="text-center py-3 text-muted">Sin resultados</td></tr>`;

        const info = document.getElementById('hc-info');
        if (info) info.textContent = `Mostrando ${inicio + 1}–${Math.min(inicio + porPag, total)} de ${total}`;
        const pagInfo = document.getElementById('hc-pag-info');
        if (pagInfo) pagInfo.textContent = `Pág. ${window._hcPagina} / ${totalPags}`;
        const totalEl = document.getElementById('hc-total');
        if (totalEl) totalEl.textContent = total;
    };

    window.hcPaginar = function (dir) {
        const total     = window._hcFiltrado?.length || 0;
        const totalPags = Math.max(1, Math.ceil(total / (window._hcPorPag || 8)));
        window._hcPagina = Math.min(totalPags, Math.max(1, (window._hcPagina || 1) + dir));
        window.renderHcPagina();
    };

    window.filtrarHistContratos = function () {
        const q    = (document.getElementById('hc-search')?.value || '').toLowerCase();
        const tipo = document.getElementById('hc-filtro-tipo')?.value || '';
        window._hcFiltrado = (window._hcContratos || []).filter(c => {
            const txt = `${c.numero_contrato || ''} ${c.tipo_contrato || ''} ${c.regimen_laboral || ''} ${c.justificacion || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || c.tipo_alta === tipo);
        });
        window._hcPagina = 1;
        window.renderHcPagina();
    };

})();

