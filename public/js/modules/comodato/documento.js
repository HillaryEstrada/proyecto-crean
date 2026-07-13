// ============================================
// MÓDULO: documento.js
// Descripción: Gestión de documentos oficiales en comodatos
// Patrón: IIFE, fetchWithAuth, esperarElemento, initPaginacion, Swal
// Clave de módulo: comodato/documento
// ============================================

(function () {
    let _registros  = [];
    let _idEliminar = null;
    let _comodatos  = [];

    // ── Inicialización ──────────────────────────────
    esperarElemento('docBody', async () => {
        await cargarComodatos();
        await listar();
    }, 20, 'comodato/documento');

    // ── Cargar comodatos para el selector ───────────
    async function cargarComodatos() {
        try {
            const data = await fetchWithAuth('/comodato');
            _comodatos = Array.isArray(data) ? data : [];

            const sel = document.getElementById('fk_comodato');
            if (!sel) return;

            sel.innerHTML = '<option value="">— Sin comodato vinculado —</option>';
            _comodatos.forEach(c => {
                const label = `#${c.pk_comodato} · ${c.cultivo || 'Sin cultivo'} (${c.estado || ''})`;
                sel.innerHTML += `<option value="${c.pk_comodato}">${label}</option>`;
            });
        } catch (e) {
            console.error('Error cargando comodatos:', e);
        }
    }

    // ── Info del comodato seleccionado ───────────────
    window.cargarInfoComodato = function () {
        const id    = document.getElementById('fk_comodato')?.value;
        const panel = document.getElementById('infoComodato');
        if (!panel) return;

        if (!id) { panel.classList.add('d-none'); return; }

        const c = _comodatos.find(x => String(x.pk_comodato) === String(id));
        if (!c)  { panel.classList.add('d-none'); return; }

        document.getElementById('infoCultivo').textContent        = c.cultivo || '—';
        document.getElementById('infoEstadoComodato').textContent = c.estado  || '—';
        panel.classList.remove('d-none');
    };

    // ── Listar documentos ───────────────────────────
    async function listar() {
        const tabla = document.getElementById('docBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/documento/todos');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) {
            console.error('Error listando documentos:', e);
        }
    }

    // ── Render tabla ────────────────────────────────
    function renderTabla(data) {
        const tabla  = document.getElementById('docBody');
        const footer = document.getElementById('footerInfo');
        if (!tabla) return;

        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="7" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-file-contract fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay documentos registrados
                </td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'docBody', filasPorPagina: 10, sufijo: 'do' });
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((d, i) => `
            <tr>
                <td class="px-3 text-muted text-center" style="font-size:12px;">${i + 1}</td>
                <td class="px-3" style="font-size:13px;">
                    <span class="fw-semibold">${d.numero_folio || '—'}</span>
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${badgeTipo(d.tipo_documento)}
                </td>
                <td class="px-3" style="font-size:12px;">
                    ${d.cultivo || '<span class="text-muted">—</span>'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${d.fecha_documento ? d.fecha_documento.substring(0, 10) : '—'}
                </td>
                <td class="px-3 text-center" style="font-size:12px;">
                    ${badgeEstado(d.estado)}
                </td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-secondary me-1" title="Ver detalle"
                        onclick="verDetalleDocumento(${d.pk_documento})">
                        <i class="fa-solid fa-eye" style="font-size:11px;"></i>
                    </button>
                    ${d.estado !== 'cancelado' ? `
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="abrirEditar(${d.pk_documento})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" title="Cambiar estado"
                        onclick="abrirCambioEstado(${d.pk_documento}, '${d.estado}')">
                        <i class="fa-solid fa-rotate" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Cancelar documento"
                        onclick="abrirEliminar(${d.pk_documento}, '${(d.numero_folio || '').replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>` : ''}
                </td>
            </tr>`).join('');

        initPaginacion({ tbodyId: 'docBody', filasPorPagina: 10, sufijo: 'do' });
    }

    // ── Filtrado dinámico ───────────────────────────
    window.filtrarTabla = function () {
        const q      = (document.getElementById('searchInput')?.value   || '').toLowerCase();
        const tipo   = (document.getElementById('filtroTipo')?.value    || '');
        const estado = (document.getElementById('filtroEstado')?.value  || '');

        renderTabla(_registros.filter(d => {
            const texto = `${d.numero_folio} ${d.cultivo} ${d.tipo_documento}`.toLowerCase();
            return (!q      || texto.includes(q))
                && (!tipo   || d.tipo_documento === tipo)
                && (!estado || d.estado         === estado);
        }));
    };

    // ── Guardar documento ───────────────────────────
    window.guardarDocumento = async function () {
        const fk_comodato    = document.getElementById('fk_comodato').value    || null;
        const tipo_documento = document.getElementById('tipo_documento').value;
        const numero_folio   = document.getElementById('numero_folio').value.trim();
        const fecha_documento = document.getElementById('fecha_documento').value || null;
        const estado         = document.getElementById('estado').value;
        const contenidoRaw   = document.getElementById('contenido_json').value.trim();

        if (!tipo_documento) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Selecciona el tipo de documento.' });
            return;
        }
        if (!numero_folio) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El número de folio es obligatorio.' });
            return;
        }

        let contenido_json = null;
        if (contenidoRaw) {
            try {
                contenido_json = JSON.parse(contenidoRaw);
            } catch {
                Swal.fire({ icon: 'warning', title: 'JSON inválido', text: 'El contenido JSON no tiene formato válido.' });
                return;
            }
        }

        try {
            await fetchWithAuth('/documento', 'POST', {
                fk_comodato, tipo_documento, numero_folio,
                fecha_documento, estado, contenido_json
            });
            Swal.fire({ icon: 'success', title: 'Documento creado',
                text: 'El documento fue registrado exitosamente.',
                timer: 2000, showConfirmButton: false });
            mostrarTabla();
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Ver detalle ─────────────────────────────────
    window.verDetalleDocumento = async function (id) {
        try {
            const d = await fetchWithAuth(`/documento/${id}`);
            const jsonStr = d.contenido_json
                ? `<pre class="mb-0" style="font-size:11px;max-height:150px;overflow:auto;">${JSON.stringify(d.contenido_json, null, 2)}</pre>`
                : '—';

            document.getElementById('modalDetalleBody').innerHTML = `
                <div class="row g-3" style="font-size:13px;">
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FOLIO</div>
                            <div class="fw-semibold">${d.numero_folio || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">TIPO</div>
                            <div>${badgeTipo(d.tipo_documento)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">ESTADO</div>
                            <div>${badgeEstado(d.estado)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA DOCUMENTO</div>
                            <div>${d.fecha_documento ? d.fecha_documento.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">COMODATO</div>
                            <div>${d.fk_comodato ? `#${d.fk_comodato} · ${d.cultivo || ''}` : '—'}</div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">CONTENIDO JSON</div>
                            ${jsonStr}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">REGISTRADO POR</div>
                            <div>${d.registrado_por_usuario || '—'}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 rounded-3" style="background:#f0f4f8;">
                            <div class="text-muted mb-1" style="font-size:11px;">FECHA REGISTRO</div>
                            <div>${d.fecha_registro ? d.fecha_registro.substring(0,10) : '—'}</div>
                        </div>
                    </div>
                </div>`;
            new bootstrap.Modal(document.getElementById('modalDetalle')).show();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Editar documento ────────────────────────────
    window.abrirEditar = function (id) {
        const d = _registros.find(x => x.pk_documento === id);
        if (!d) return;

        document.getElementById('editId').value       = d.pk_documento;
        document.getElementById('editTipo').value     = d.tipo_documento  || '';
        document.getElementById('editFolio').value    = d.numero_folio    || '';
        document.getElementById('editFecha').value    = d.fecha_documento ? d.fecha_documento.substring(0,10) : '';
        document.getElementById('editEstado').value   = d.estado          || 'borrador';
        document.getElementById('editContenido').value = d.contenido_json
            ? JSON.stringify(d.contenido_json, null, 2)
            : '';

        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    };

    window.confirmarEditar = async function () {
        const id             = document.getElementById('editId').value;
        const tipo_documento = document.getElementById('editTipo').value;
        const numero_folio   = document.getElementById('editFolio').value.trim();
        const fecha_documento = document.getElementById('editFecha').value || null;
        const estado         = document.getElementById('editEstado').value;
        const contenidoRaw   = document.getElementById('editContenido').value.trim();

        if (!tipo_documento || !numero_folio) {
            Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Tipo y folio son obligatorios.' });
            return;
        }

        let contenido_json = null;
        if (contenidoRaw) {
            try {
                contenido_json = JSON.parse(contenidoRaw);
            } catch {
                Swal.fire({ icon: 'warning', title: 'JSON inválido', text: 'El contenido JSON no tiene formato válido.' });
                return;
            }
        }

        try {
            await fetchWithAuth(`/documento/${id}`, 'PUT', {
                tipo_documento, numero_folio, fecha_documento, estado, contenido_json
            });
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
            Swal.fire({ icon: 'success', title: 'Documento actualizado',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Cambiar estado ──────────────────────────────
    window.abrirCambioEstado = function (id, estadoActual) {
        document.getElementById('estadoDocId').value  = id;
        document.getElementById('nuevoEstado').value  = estadoActual;
        new bootstrap.Modal(document.getElementById('modalEstado')).show();
    };

    window.confirmarCambioEstado = async function () {
        const id     = document.getElementById('estadoDocId').value;
        const estado = document.getElementById('nuevoEstado').value;
        try {
            await fetchWithAuth(`/documento/${id}/estado`, 'PATCH', { estado });
            bootstrap.Modal.getInstance(document.getElementById('modalEstado')).hide();
            Swal.fire({ icon: 'success', title: 'Estado actualizado',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Cancelar / eliminar ─────────────────────────
    window.abrirEliminar = function (id, folio) {
        _idEliminar = id;
        document.getElementById('eliminarFolio').textContent = folio || 'Sin folio';
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/documento/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ icon: 'success', title: 'Documento cancelado',
                timer: 2000, showConfirmButton: false });
            await listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    // ── Helpers de badges ───────────────────────────
    function badgeTipo(tipo) {
        const mapa = {
            autorizacion_salida: ['primary',   'Autorización salida'],
            guia_traslado:       ['info',      'Guía traslado'],
            recibo_recepcion:    ['secondary', 'Recibo recepción'],
            oficio_comodato:     ['dark',      'Oficio comodato'],
            penalizacion:        ['danger',    'Penalización'],
            otro:                ['light',     'Otro'],
        };
        const [color, label] = mapa[tipo] || ['light', tipo || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

    function badgeEstado(estado) {
        const mapa = {
            borrador:  ['warning',   'Borrador'],
            emitido:   ['success',   'Emitido'],
            cancelado: ['secondary', 'Cancelado'],
        };
        const [color, label] = mapa[estado] || ['light', estado || '—'];
        return `<span class="badge bg-${color}">${label}</span>`;
    }

})();

// ── UI Global ──────────────────────────────────────
window.mostrarFormulario = function () {
    document.getElementById('pk_documento').value    = '';
    document.getElementById('fk_comodato').value     = '';
    document.getElementById('tipo_documento').value  = '';
    document.getElementById('numero_folio').value    = '';
    document.getElementById('fecha_documento').value = '';
    document.getElementById('estado').value          = 'borrador';
    document.getElementById('contenido_json').value  = '';
    document.getElementById('tituloFormulario').textContent = 'Nuevo documento oficial';
    document.getElementById('infoComodato').classList.add('d-none');

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};