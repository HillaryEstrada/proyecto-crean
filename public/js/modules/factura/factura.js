(function () {
    let _registros   = [];
    let _proveedores = [];

    esperarElemento('facBody', async () => {
        await cargarProveedores();
        listar();
    }, 20, 'factura/factura');

    // ── CARGAR PROVEEDORES ──
    async function cargarProveedores() {
        try {
            const data   = await fetchWithAuth('/proveedor');
            _proveedores = Array.isArray(data) ? data : [];
            const select = document.getElementById('f_fk_proveedor');
            if (!select) return;
            select.innerHTML = `<option value="">— Sin proveedor —</option>` +
                _proveedores.map(p =>
                    `<option value="${p.pk_proveedor}">${p.nombre}</option>`
                ).join('');
        } catch (e) { console.error('Error cargar proveedores:', e); }
    }

    // ── LISTAR ──
    async function listar() {
        const tabla = document.getElementById('facBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/factura');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las facturas' });
        }
    }

    // ── RENDER TABLA ──
    function renderTabla(data) {
        const tabla = document.getElementById('facBody');
        const info  = document.getElementById('info-registros-fac');

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="10" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-file-invoice fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay facturas registradas
                </td></tr>`;
            if (info) info.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'facBody', filasPorPagina: 10, sufijo: 'fac' });
            return;
        }

        if (info) info.textContent = `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((f, i) => {
            // Formatear garantía resumida
            const garantiaParts = [];
            if (f.garantia_duracion_dias)  garantiaParts.push(`${f.garantia_duracion_dias}d`);
            if (f.garantia_limite_horas)   garantiaParts.push(`${f.garantia_limite_horas}hrs`);
            if (f.garantia_limite_km)      garantiaParts.push(`${f.garantia_limite_km}km`);
            const garantiaText = garantiaParts.length
                ? garantiaParts.join(' / ')
                : '—';

            const badgeTipo = f.tipo_activo === 'maquinaria'
                ? `<span class="badge" style="background:#1a3c5e;font-size:11px;">
                       <i class="fa-solid fa-tractor me-1"></i>Maquinaria</span>`
                : `<span class="badge bg-info text-dark" style="font-size:11px;">
                       <i class="fa-solid fa-car me-1"></i>Vehículo</span>`;

            const fecha = f.fecha_factura
                ? (() => {
                    const [y, m, d] = String(f.fecha_factura).slice(0, 10).split('-');
                    return `${d}/${m}/${y}`;
                  })()
                : '—';

            return `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3">
                    <span class="fw-semibold" style="color:#1a3c5e;font-size:13px;">
                        ${f.numero_factura || '—'}
                    </span>
                </td>
                <td class="px-3 text-muted" style="font-size:13px;">${f.proveedor_nombre || '—'}</td>
                <td class="px-3 text-center">${badgeTipo}</td>
                <td class="px-3 text-muted" style="font-size:12px;">
                    ${[ f.modelo_referencia].filter(Boolean).join(' · ') || '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:13px;">
                    ${f.costo_adquisicion
                        ? '$' + parseFloat(f.costo_adquisicion).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                        : '—'}
                </td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">${fecha}</td>
                <td class="px-3 text-center text-muted" style="font-size:12px;">${garantiaText}</td>
                <td class="px-3 text-center">
                    ${f.pdf_factura
                        ? `<a href="${f.pdf_factura}" target="_blank" class="btn btn-sm btn-outline-danger">
                               <i class="fa-solid fa-file-pdf"></i></a>`
                        : '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="editarFactura(${f.pk_factura})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        initPaginacion({ tbodyId: 'facBody', filasPorPagina: 10, sufijo: 'fac' });
    }

    // ── FILTRAR ──
    window.filtrarTabla = function () {
        const q    = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipoActivo')?.value || '';
        renderTabla(_registros.filter(f => {
            const txt = `${f.numero_factura} ${f.proveedor_nombre || ''} ${f.modelo_referencia || ''}`.toLowerCase();
            return (!q || txt.includes(q)) && (!tipo || f.tipo_activo === tipo);
        }));
    };

    // ── TIPO ACTIVO CHANGE (dinámico en formulario) ──
    window.onTipoActivoChange = function () {
        const tipo = document.getElementById('f_tipo_activo').value;
        const seccion = document.getElementById('seccionGarantia');
        const campoHoras = document.getElementById('campoLimiteHoras');
        const campoKm    = document.getElementById('campoLimiteKm');

        if (!tipo) {
            seccion.classList.add('d-none');
            return;
        }

        seccion.classList.remove('d-none');

        if (tipo === 'maquinaria') {
            campoHoras.classList.remove('d-none');
            campoKm.classList.add('d-none');
            document.getElementById('f_garantia_limite_km').value = '';
        } else {
            campoKm.classList.remove('d-none');
            campoHoras.classList.add('d-none');
            document.getElementById('f_garantia_limite_horas').value = '';
        }
    };

    // ── RESET FORMULARIO ──
    function resetForm() {
        ['f_pk_factura','f_pdf_actual','f_numero_factura','f_fecha_factura',
         'f_costo_adquisicion','f_fk_proveedor','f_pdf_factura',
         'f_tipo_activo','f_modelo_referencia',
         'f_garantia_duracion_dias','f_garantia_limite_horas','f_garantia_limite_km'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        ['err_numero','err_fecha','err_tipo_activo','err_garantia'].forEach(id =>
            document.getElementById(id)?.classList.add('d-none')
        );
        document.getElementById('pdfActualContainer')?.classList.add('d-none');
        document.getElementById('seccionGarantia')?.classList.add('d-none');
        document.getElementById('campoLimiteHoras')?.classList.add('d-none');
        document.getElementById('campoLimiteKm')?.classList.add('d-none');
    }

    // ── ABRIR FORMULARIO (CREAR) ──
    window.abrirFormulario = function () {
        resetForm();
        document.getElementById('formTitulo').textContent      = 'Registrar Factura';
        document.getElementById('btnGuardarLabel').textContent = 'Guardar factura';
        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_numero_factura').focus();
    };

    // ── EDITAR ──
    window.editarFactura = function (id) {
        const f = _registros.find(x => x.pk_factura === id);
        if (!f) return;

        resetForm();

        document.getElementById('f_pk_factura').value          = f.pk_factura;
        document.getElementById('f_pdf_actual').value          = f.pdf_factura || '';
        document.getElementById('f_numero_factura').value      = f.numero_factura || '';
        document.getElementById('f_fecha_factura').value       = f.fecha_factura ? f.fecha_factura.slice(0, 10) : '';
        document.getElementById('f_costo_adquisicion').value   = f.costo_adquisicion || '';
        document.getElementById('f_fk_proveedor').value        = f.fk_proveedor || '';
        document.getElementById('f_tipo_activo').value         = f.tipo_activo || '';
        document.getElementById('f_modelo_referencia').value   = f.modelo_referencia || '';
        document.getElementById('f_garantia_duracion_dias').value  = f.garantia_duracion_dias || '';
        document.getElementById('f_garantia_limite_horas').value   = f.garantia_limite_horas || '';
        document.getElementById('f_garantia_limite_km').value      = f.garantia_limite_km || '';

        // Disparar cambio de tipo para mostrar sección garantía
        onTipoActivoChange();

        // PDF actual
        if (f.pdf_factura) {
            document.getElementById('pdfActualLink').href = f.pdf_factura;
            document.getElementById('pdfActualContainer').classList.remove('d-none');
        }

        document.getElementById('formTitulo').textContent      = `Editando: ${f.numero_factura}`;
        document.getElementById('btnGuardarLabel').textContent = 'Guardar cambios';
        document.getElementById('vistaTabla').classList.add('d-none');
        document.getElementById('vistaFormulario').classList.remove('d-none');
        document.getElementById('f_numero_factura').focus();
    };

    // ── CANCELAR ──
    window.cancelarFormulario = function () {
        resetForm();
        document.getElementById('vistaFormulario').classList.add('d-none');
        document.getElementById('vistaTabla').classList.remove('d-none');
    };

    // ── SUBIR PDF ──
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

    // ── GUARDAR ──
    window.guardarFactura = async function () {
        const id             = document.getElementById('f_pk_factura').value;
        const numero_factura = document.getElementById('f_numero_factura').value.trim();
        const fecha_factura  = document.getElementById('f_fecha_factura').value;
        const tipo_activo    = document.getElementById('f_tipo_activo').value;
        const dias           = document.getElementById('f_garantia_duracion_dias').value;
        const horas          = document.getElementById('f_garantia_limite_horas').value;
        const km             = document.getElementById('f_garantia_limite_km').value;
        const archivoPDF     = document.getElementById('f_pdf_factura').files[0];
        const pdfActual      = document.getElementById('f_pdf_actual').value;

        // Validaciones
        let valido = true;
        if (!numero_factura) {
            document.getElementById('err_numero').classList.remove('d-none'); valido = false;
        } else document.getElementById('err_numero').classList.add('d-none');

        if (!fecha_factura) {
            document.getElementById('err_fecha').classList.remove('d-none'); valido = false;
        } else document.getElementById('err_fecha').classList.add('d-none');

        if (!tipo_activo) {
            document.getElementById('err_tipo_activo').classList.remove('d-none'); valido = false;
        } else document.getElementById('err_tipo_activo').classList.add('d-none');

        if (tipo_activo && !dias && !horas && !km) {
            document.getElementById('err_garantia').classList.remove('d-none'); valido = false;
        } else document.getElementById('err_garantia').classList.add('d-none');

        if (!valido) return;

        try {
            let pdf_factura = pdfActual || null;
            if (archivoPDF) pdf_factura = await subirPDF(archivoPDF);

            const payload = {
                numero_factura,
                fecha_factura,
                costo_adquisicion:       document.getElementById('f_costo_adquisicion').value || null,
                fk_proveedor:            document.getElementById('f_fk_proveedor').value || null,
                pdf_factura,
                tipo_activo,
                modelo_referencia:       document.getElementById('f_modelo_referencia').value.trim() || null,
                garantia_duracion_dias:  dias  || null,
                garantia_limite_horas:   tipo_activo === 'maquinaria' ? (horas || null) : null,
                garantia_limite_km:      tipo_activo === 'vehiculo'   ? (km    || null) : null,
            };

            if (id) {
                await fetchWithAuth(`/factura/${id}`, 'PUT', payload);
                Swal.fire({ icon: 'success', title: 'Actualizada',
                    text: 'Factura actualizada exitosamente', timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/factura', 'POST', payload);
                Swal.fire({ icon: 'success', title: 'Registrada',
                    text: 'Factura creada exitosamente', timer: 2000, showConfirmButton: false });
            }

            cancelarFormulario();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

})();