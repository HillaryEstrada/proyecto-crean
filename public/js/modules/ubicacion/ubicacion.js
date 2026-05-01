(function () {
    let _registros = [];

    esperarElemento('ubBody', async () => {
        listar();
    }, 20, 'ubicacion/ubicacion');

    // ============================================
    // LISTAR
    // ============================================
    async function listar() {
        const tabla = document.getElementById('ubBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/ubicacion');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            console.error('Error listar ubicaciones:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las ubicaciones' });
        }
    }

    // ============================================
    // RENDER TABLA
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('ubBody');
        if (!tabla) return;
        const info  = document.getElementById('info-registros-ub');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-location-dot fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay ubicaciones registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'ubBody', filasPorPagina: 10, sufijo: 'ub' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((u, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${u.nombre || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${u.descripcion || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${u.registrado_por_usuario && u.fecha_registro
                        ? (() => { const s = String(u.fecha_registro).slice(0,10); const [y,m,d] = s.split('-'); return `${u.registrado_por_usuario} • ${d}/${m}/${y}`; })()
                        : '—'}
                </td>
                <td class="px-3 text-center">
                    <button class="btn btn-sm btn-outline-primary" title="Editar"
                        onclick="editarUbicacion(${u.pk_ubicacion})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'ubBody', filasPorPagina: 10, sufijo: 'ub' });
    }

    // ============================================
    // FILTRAR
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registros.filter(u => {
            const txt = `${u.nombre} ${u.descripcion || ''} ${u.registrado_por_usuario || ''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_ubicacion').value        = '';
        document.getElementById('f_nombre').value              = '';
        document.getElementById('f_descripcion').value         = '';
        document.getElementById('formTitulo').textContent      = 'Registrar Ubicación';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar ubicación';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarUbicacion = function (id) {
        const u = _registros.find(x => x.pk_ubicacion === id);
        if (!u) return;

        document.getElementById('f_pk_ubicacion').value       = u.pk_ubicacion;
        document.getElementById('f_nombre').value             = u.nombre || '';
        document.getElementById('f_descripcion').value        = u.descripcion || '';
        document.getElementById('formTitulo').textContent     = `Editando: ${u.nombre}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('err_nombre').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_nombre').focus();
    };

    // ============================================
    // CANCELAR FORMULARIO
    // ============================================
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_ubicacion').value  = '';
        document.getElementById('f_nombre').value        = '';
        document.getElementById('f_descripcion').value   = '';
        document.getElementById('err_nombre').classList.add('d-none');
    };


    // ============================================
    // VALIDAR FORMATO DE TEXTO
    // ============================================
    function validarFormato(texto) {
        const errores = [];
        if (texto.length < 4) {
        errores.push('El nombre debe tener al menos 4 caracteres');
        }
        // Primera letra mayúscula
        if (texto && texto[0] !== texto[0].toUpperCase()) {
            errores.push('Debe comenzar con mayúscula');
        }

        // Dobles espacios
        if (/\s{2,}/.test(texto)) {
            errores.push('No debe tener espacios dobles');
        }

        // Espacios al inicio o al final (después del trim ya no aplica, pero por si acaso)
        if (texto !== texto.trim()) {
            errores.push('No debe tener espacios al inicio o al final');
        }

        // Solo números sin texto
        if (/^\d+$/.test(texto)) {
            errores.push('El nombre no puede ser solo números');
        }

        return errores;
    }
    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarUbicacion = async function () {
        const id          = document.getElementById('f_pk_ubicacion').value;
        const nombre      = document.getElementById('f_nombre').value.trim();
        const descripcion = document.getElementById('f_descripcion').value.trim();

        if (!nombre) {
            document.getElementById('err_nombre').classList.remove('d-none');
            document.getElementById('f_nombre').focus();
            return;
        }
        document.getElementById('err_nombre').classList.add('d-none');

        const erroresFormato = validarFormato(nombre);
        if (erroresFormato.length) {
            Swal.fire({
                icon: 'warning',
                title: 'Revisa el nombre',
                html: erroresFormato.map(e => `<div>• ${e}</div>`).join(''),
                confirmButtonColor: '#1a3c5e'
            });
            document.getElementById('f_nombre').focus();
            return;
        }

        try {
            if (id) {
                await fetchWithAuth(`/ubicacion/${id}`, 'PUT', { nombre, descripcion });
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Ubicación actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/ubicacion', 'POST', { nombre, descripcion });
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Ubicación creada exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();