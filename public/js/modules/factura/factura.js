(function () {
    let _registros   = [];
    let _proveedores = [];

    esperarElemento('facBody', async () => {
        await cargarProveedores();
        listar();
    });

    // ============================================
    // CARGAR PROVEEDORES PARA SELECT
    // ============================================
    async function cargarProveedores() {
        try {
            const data   = await fetchWithAuth('/proveedor');
            _proveedores = Array.isArray(data) ? data : [];
            const select = document.getElementById('f_fk_proveedor');
            if (!select) return;
            const opciones = _proveedores.map(p =>
                `<option value="${p.pk_proveedor}">${p.nombre}</option>`
            ).join('');
            select.innerHTML = `<option value="">— Sin proveedor —</option>${opciones}`;
        } catch (e) {
            console.error('Error cargar proveedores:', e);
        }
    }

    // ============================================
    // LISTAR
    // ============================================
    async function listar() {
        const tabla = document.getElementById('facBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/factura');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            console.error('Error listar facturas:', e);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las facturas' });
        }
    }

    // ============================================
    // RENDER TABLA
    // ============================================
    function renderTabla(data) {
        const tabla = document.getElementById('facBody');
        if (!tabla) return;
        const info = document.getElementById('info-registros-fac');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-file-invoice fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay facturas registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'facBody', filasPorPagina: 10, sufijo: 'fac' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((f, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${f.numero_factura || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">
                    ${f.proveedor_nombre || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${f.costo_adquisicion
                        ? '$' + parseFloat(f.costo_adquisicion).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                        : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">
                    ${f.fecha_factura
                        ? new Date(f.fecha_factura).toLocaleDateString('es-MX')
                        : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${f.pdf_factura
                        ? `<a href="${f.pdf_factura}" target="_blank" class="btn btn-sm btn-outline-danger">
                               <i class="fa-solid fa-file-pdf"></i>
                           </a>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-center">
                    <span class="badge bg-success" style="font-size:11px;">Activo</span>
                </td>
                <td class="px-3 text-center">
                    <button class="btn btn-sm btn-outline-primary" title="Editar"
                        onclick="editarFactura(${f.pk_factura})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'facBody', filasPorPagina: 10, sufijo: 'fac' });
    }

    // ============================================
    // FILTRAR
    // ============================================
    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registros.filter(f => {
            const txt = `${f.numero_factura} ${f.proveedor_nombre || ''}`.toLowerCase();
            return !q || txt.includes(q);
        }));
    };

    // ============================================
    // ABRIR FORMULARIO (CREAR)
    // ============================================
    window.abrirFormulario = function () {
        document.getElementById('f_pk_factura').value          = '';
        document.getElementById('f_pdf_actual').value          = '';
        document.getElementById('f_numero_factura').value      = '';
        document.getElementById('f_fecha_factura').value       = '';
        document.getElementById('f_costo_adquisicion').value   = '';
        document.getElementById('f_fk_proveedor').value        = '';
        document.getElementById('f_pdf_factura').value         = '';
        document.getElementById('formTitulo').textContent      = 'Registrar Factura';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar factura';
        document.getElementById('err_numero').classList.add('d-none');
        document.getElementById('err_fecha').classList.add('d-none');
        document.getElementById('pdfActualContainer').classList.add('d-none');

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_numero_factura').focus();
    };

    // ============================================
    // EDITAR
    // ============================================
    window.editarFactura = function (id) {
        const f = _registros.find(x => x.pk_factura === id);
        if (!f) return;

        document.getElementById('f_pk_factura').value        = f.pk_factura;
        document.getElementById('f_pdf_actual').value        = f.pdf_factura || '';
        document.getElementById('f_numero_factura').value    = f.numero_factura || '';
        document.getElementById('f_fecha_factura').value     = f.fecha_factura
            ? f.fecha_factura.slice(0, 10) : '';
        document.getElementById('f_costo_adquisicion').value = f.costo_adquisicion || '';
        document.getElementById('f_fk_proveedor').value      = f.fk_proveedor || '';
        document.getElementById('f_pdf_factura').value       = '';
        document.getElementById('formTitulo').textContent    = `Editando: ${f.numero_factura}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('err_numero').classList.add('d-none');
        document.getElementById('err_fecha').classList.add('d-none');

        // Mostrar PDF actual si existe
        const pdfContainer = document.getElementById('pdfActualContainer');
        const pdfLink      = document.getElementById('pdfActualLink');
        if (f.pdf_factura) {
            pdfLink.href = f.pdf_factura;
            pdfContainer.classList.remove('d-none');
        } else {
            pdfContainer.classList.add('d-none');
        }

        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_numero_factura').focus();
    };

    // ============================================
    // CANCELAR FORMULARIO
    // ============================================
    window.cancelarFormulario = function () {
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
        document.getElementById('f_pk_factura').value        = '';
        document.getElementById('f_pdf_actual').value        = '';
        document.getElementById('f_numero_factura').value    = '';
        document.getElementById('f_fecha_factura').value     = '';
        document.getElementById('f_costo_adquisicion').value = '';
        document.getElementById('f_fk_proveedor').value      = '';
        document.getElementById('f_pdf_factura').value       = '';
        document.getElementById('err_numero').classList.add('d-none');
        document.getElementById('err_fecha').classList.add('d-none');
        document.getElementById('pdfActualContainer').classList.add('d-none');
    };

    // ============================================
    // SUBIR PDF A CLOUDINARY
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
    window.guardarFactura = async function () {
        const id             = document.getElementById('f_pk_factura').value;
        const numero_factura = document.getElementById('f_numero_factura').value.trim();
        const fecha_factura  = document.getElementById('f_fecha_factura').value;
        const costo          = document.getElementById('f_costo_adquisicion').value;
        const fk_proveedor   = document.getElementById('f_fk_proveedor').value;
        const archivoPDF     = document.getElementById('f_pdf_factura').files[0];
        const pdfActual      = document.getElementById('f_pdf_actual').value;

        // Validaciones
        let valido = true;
        if (!numero_factura) {
            document.getElementById('err_numero').classList.remove('d-none');
            valido = false;
        } else {
            document.getElementById('err_numero').classList.add('d-none');
        }
        if (!fecha_factura) {
            document.getElementById('err_fecha').classList.remove('d-none');
            valido = false;
        } else {
            document.getElementById('err_fecha').classList.add('d-none');
        }
        if (!valido) return;

        try {
            // Subir PDF si se seleccionó uno nuevo
            let pdf_factura = pdfActual || null;
            if (archivoPDF) {
                pdf_factura = await subirPDF(archivoPDF);
            }

            const payload = {
                numero_factura,
                fecha_factura,
                costo_adquisicion: costo || null,
                fk_proveedor:      fk_proveedor || null,
                pdf_factura
            };

            if (id) {
                await fetchWithAuth(`/factura/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Factura actualizada exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/factura', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Factura creada exitosamente',
                    timer: 2000, showConfirmButton: false });
            }

            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();