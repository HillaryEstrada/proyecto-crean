(function () {
    let _registrosActivos   = [];
    let _registrosInactivos = [];
    let _idParaDesactivar   = null;

    esperarElemento('garBody', async () => {
        listar();
    });

    // ============================================
    // LISTAR ACTIVOS
    // ============================================
    async function listar() {
        const tabla = document.getElementById('garBody');
        if (!tabla) return;
        try {
            const data        = await fetchWithAuth('/garantia');
            _registrosActivos = Array.isArray(data) ? data : [];
            renderTabla(_registrosActivos);
        } catch (e) {
            console.error('Error listar garantías:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las garantías' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('garBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-gar');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="9" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-shield-halved fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay garantías registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'garBody', filasPorPagina: 10, sufijo: 'gar' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((g, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${g.fecha_inicio ? new Date(g.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${g.fecha_fin ? new Date(g.fecha_fin).toLocaleDateString('es-MX') : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${g.limite_horas ? g.limite_horas + ' hrs' : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${g.limite_km ? g.limite_km.toLocaleString('es-MX') + ' km' : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${g.garantia_pdf
                        ? `<a href="${g.garantia_pdf}" target="_blank" class="btn btn-sm btn-outline-danger">
                               <i class="fa-solid fa-file-pdf"></i>
                           </a>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${g.registrado_por_usuario || '—'}
                </td>
                <td class="px-3 text-center">
                    <span class="badge bg-success" style="font-size:11px;">Activa</span>
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarGarantia(${g.pk_garantia})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Desactivar"
                        onclick="abrirDesactivar(${g.pk_garantia}, '${g.fecha_inicio ? g.fecha_inicio.slice(0,10) : 'Sin fecha'}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'garBody', filasPorPagina: 10, sufijo: 'gar' });
    }

    // ============================================
    // FILTRAR
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registrosActivos.filter(g => {
            const txt = `${g.fecha_inicio || ''} ${g.fecha_fin || ''} ${g.registrado_por_usuario || ''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // SWITCH TABS
    // ============================================
    window.switchTab = function (tab) {
        const va = document.getElementById('vistaActivos');
        const vi = document.getElementById('vistaInactivos');
        const ta = document.getElementById('tabActivos');
        const ti = document.getElementById('tabInactivos');
        if (tab === 'activos') {
            va.classList.remove('d-none'); vi.classList.add('d-none');
            ta.classList.add('active');    ti.classList.remove('active');
        } else {
            va.classList.add('d-none');    vi.classList.remove('d-none');
            ta.classList.remove('active'); ti.classList.add('active');
            listarInactivos();
        }
    };

    // ============================================
    // LISTAR INACTIVOS
    // ============================================
    async function listarInactivos() {
        const cuerpo = document.getElementById('garBodyInactivos');
        const info   = document.getElementById('info-registros-gar-inactivos');
        if (!cuerpo) return;
        cuerpo.innerHTML = `
            <tr><td colspan="8" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2"></div>Cargando…
            </td></tr>`;
        try {
            const data = await fetchWithAuth('/garantia/todas');
            _registrosInactivos = Array.isArray(data) ? data.filter(g => g.estado === 0) : [];

            if (!_registrosInactivos.length) {
                cuerpo.innerHTML = `
                    <tr><td colspan="8" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay garantías inactivas
                    </td></tr>`;
                if (info) info.textContent = 'Sin registros';
                initPaginacion({ tbodyId: 'garBodyInactivos', filasPorPagina: 10, sufijo: 'gar-inactivos' });
                return;
            }

            if (info) info.textContent = `Mostrando ${_registrosInactivos.length} registros`;

            cuerpo.innerHTML = _registrosInactivos.map((g, i) => `
                <tr>
                    <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3 text-muted" style="font-size:13px;">
                        ${g.fecha_inicio ? new Date(g.fecha_inicio).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">
                        ${g.fecha_fin ? new Date(g.fecha_fin).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
                        ${g.limite_horas ? g.limite_horas + ' hrs' : '—'}
                    </td>
                    <td class="px-3 text-center text-muted" style="font-size:13px;">
                        ${g.limite_km ? g.limite_km.toLocaleString('es-MX') + ' km' : '—'}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;">
                        ${g.garantia_pdf
                            ? `<a href="${g.garantia_pdf}" target="_blank" class="btn btn-sm btn-outline-danger">
                                   <i class="fa-solid fa-file-pdf"></i>
                               </a>`
                            : '<span class="text-muted">—</span>'}
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">
                        ${g.registrado_por_usuario || '—'}
                    </td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-success" title="Reactivar"
                            onclick="reactivarGarantia(${g.pk_garantia})">
                            <i class="fa-solid fa-rotate-left" style="font-size:11px;"></i>
                            Reactivar
                        </button>
                    </td>
                </tr>`).join('');

            initPaginacion({ tbodyId: 'garBodyInactivos', filasPorPagina: 10, sufijo: 'gar-inactivos' });
        } catch (e) { console.error('Error inactivos garantía:', e); }
    }

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_garantia').value        = '';
        document.getElementById('f_pdf_actual').value         = '';
        document.getElementById('f_fecha_inicio').value       = '';
        document.getElementById('f_fecha_fin').value          = '';
        document.getElementById('f_limite_horas').value       = '';
        document.getElementById('f_limite_km').value          = '';
        document.getElementById('f_garantia_pdf').value       = '';
        document.getElementById('formTitulo').textContent     = 'Registrar Garantía';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar garantía';
        document.getElementById('pdfActualContainer').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_fecha_inicio').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarGarantia = function (id) {
        const g = _registrosActivos.find(x => x.pk_garantia === id);
        if (!g) return;

        document.getElementById('f_pk_garantia').value        = g.pk_garantia;
        document.getElementById('f_pdf_actual').value         = g.garantia_pdf || '';
        document.getElementById('f_fecha_inicio').value       = g.fecha_inicio ? g.fecha_inicio.slice(0, 10) : '';
        document.getElementById('f_fecha_fin').value          = g.fecha_fin ? g.fecha_fin.slice(0, 10) : '';
        document.getElementById('f_limite_horas').value       = g.limite_horas || '';
        document.getElementById('f_limite_km').value          = g.limite_km || '';
        document.getElementById('f_garantia_pdf').value       = '';
        document.getElementById('formTitulo').textContent     = `Editando garantía #${g.pk_garantia}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';

        const pdfContainer = document.getElementById('pdfActualContainer');
        const pdfLink      = document.getElementById('pdfActualLink');
        if (g.garantia_pdf) {
            pdfLink.href = g.garantia_pdf;
            pdfContainer.classList.remove('d-none');
        } else {
            pdfContainer.classList.add('d-none');
        }

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
    };

    // ============================================
    // CANCELAR FORMULARIO
    // ============================================
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_garantia').value  = '';
        document.getElementById('f_pdf_actual').value   = '';
        document.getElementById('f_fecha_inicio').value = '';
        document.getElementById('f_fecha_fin').value    = '';
        document.getElementById('f_limite_horas').value = '';
        document.getElementById('f_limite_km').value    = '';
        document.getElementById('f_garantia_pdf').value = '';
        document.getElementById('pdfActualContainer').classList.add('d-none');
    };

    // ============================================
    // SUBIR PDF
    // ============================================
    async function subirPDF(file) {
        const formData = new FormData();
        formData.append('archivo', file);
        const res = await fetch('/archivo/temporal', {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
        });
        if (!res.ok) throw new Error('Error al subir el PDF');
        const data = await res.json();
        return data.url;
    }

    // ============================================
    // GUARDAR (CREAR O ACTUALIZAR)
    // ============================================
    window.guardarGarantia = async function () {
        const id          = document.getElementById('f_pk_garantia').value;
        const fecha_inicio = document.getElementById('f_fecha_inicio').value;
        const fecha_fin   = document.getElementById('f_fecha_fin').value;
        const limite_horas = document.getElementById('f_limite_horas').value;
        const limite_km   = document.getElementById('f_limite_km').value;
        const archivoPDF  = document.getElementById('f_garantia_pdf').files[0];
        const pdfActual   = document.getElementById('f_pdf_actual').value;

        try {
            let garantia_pdf = pdfActual || null;
            if (archivoPDF) {
                garantia_pdf = await subirPDF(archivoPDF);
            }

            const payload = {
                fecha_inicio:  fecha_inicio  || null,
                fecha_fin:     fecha_fin     || null,
                limite_horas:  limite_horas  || null,
                limite_km:     limite_km     || null,
                garantia_pdf
            };

            if (id) {
                await fetchWithAuth(`/garantia/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Garantía actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/garantia', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Garantía creada exitosamente',
                    timer: 2000, showConfirmButton: false });
            }

            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ============================================
    // ABRIR MODAL DESACTIVAR
    // ============================================
    window.abrirDesactivar = function (id, label) {
        _idParaDesactivar = id;
        document.getElementById('desactivarNombre').textContent = `Garantía desde: ${label}`;
        new bootstrap.Modal(document.getElementById('modalDesactivar')).show();
    };

    // ============================================
    // CONFIRMAR DESACTIVAR
    // ============================================
    window.confirmarDesactivar = async function () {
        try {
            await fetchWithAuth(`/garantia/${_idParaDesactivar}/desactivar`, 'PATCH');
            bootstrap.Modal.getInstance(document.getElementById('modalDesactivar')).hide();
            Swal.fire({ icon: 'success', title: 'Desactivada',
                text: 'Garantía desactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ============================================
    // REACTIVAR
    // ============================================
    window.reactivarGarantia = async function (id) {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Reactivar garantía',
            text: '¿Deseas reactivar esta garantía?',
            showCancelButton: true,
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1a3c5e'
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetchWithAuth(`/garantia/${id}/activar`, 'PATCH');
            Swal.fire({ icon: 'success', title: 'Reactivada',
                text: 'Garantía reactivada exitosamente',
                timer: 2000, showConfirmButton: false });
            await listar();
            await listarInactivos();
            switchTab('activos');
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();