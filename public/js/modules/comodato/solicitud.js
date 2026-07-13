(function () {
    let _registros   = [];
    let _productores = [];
    let _idEliminar  = null;

    esperarElemento('solicitudBody', async () => { 
        cargarProductores();
        listar(); 
    }, 20, 'comodato/solicitud');

    // ════════════════════════════════════════════════════════════════
    // CARGAR PRODUCTORES
    // ════════════════════════════════════════════════════════════════
    async function cargarProductores() {
        try {
            const data = await fetchWithAuth('/api/productores');
            _productores = Array.isArray(data) ? data : [];
            poblarSelectProductor();
        } catch (e) { console.error('Error cargar productores:', e); }
    }

    function poblarSelectProductor() {
        const select = document.getElementById('fk_productor');
        if (!select) return;
        select.innerHTML = '<option value="">— Seleccionar productor —</option>';
        _productores.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.pk_productor;
            opt.textContent = `${p.nombre} (${p.nombre_ejido || 'Sin ejido'})`;
            select.appendChild(opt);
        });
        // Reinitializar select2 si existe
        if (typeof $ !== 'undefined' && $.fn.select2) {
            try { $(select).select2('destroy').select2(); } catch (e) {}
        }
    }

    // ════════════════════════════════════════════════════════════════
    // LISTAR SOLICITUDES
    // ════════════════════════════════════════════════════════════════
    async function listar() {
        const tabla = document.getElementById('solicitudBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/api/solicitudes');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) { console.error('Error listar solicitudes:', e); }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('solicitudBody');
        const footer = document.getElementById('footerInfo');
        
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-clipboard-list fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay solicitudes registradas</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'solicitudBody', filasPorPagina: 10, sufijo: 'solicitud' });
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((s, i) => {
            const productor = _productores.find(p => p.pk_productor === s.fk_productor) || {};
            const estadoBadge = getEstadoBadge(s.estado);
            
            return `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3" style="font-size:12px;font-family:monospace;">
                        <strong>${s.folio || '—'}</strong>
                    </td>
                    <td class="px-3" style="font-size:13px;">
                        <strong>${productor.nombre || 'Sin datos'}</strong>
                        <br><small class="text-muted">${productor.nombre_ejido || ''}</small>
                    </td>
                    <td class="px-3" style="font-size:13px;">${s.cultivo || '—'}</td>
                    <td class="px-3 text-center" style="font-size:13px;">${s.superficie_ha || '—'}</td>
                    <td class="px-3 text-center" style="font-size:12px;color:#666;">
                        ${s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td class="px-3 text-center">${estadoBadge}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                            onclick="editarSolicitud(${s.pk_solicitud})">
                            <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Eliminar"
                            onclick="abrirEliminar(${s.pk_solicitud}, '${s.folio || 'Solicitud'}')">
                            <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');
        
        initPaginacion({ tbodyId: 'solicitudBody', filasPorPagina: 10, sufijo: 'solicitud' });
    }

    // ════════════════════════════════════════════════════════════════
    // FILTRAR TABLA
    // ════════════════════════════════════════════════════════════════
    window.filtrarTabla = function () {
        const q       = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estado  = (document.getElementById('filtroEstado')?.value || '');

        const filtrada = _registros.filter(s => {
            const productor = _productores.find(p => p.pk_productor === s.fk_productor) || {};
            const matchText = !q || 
                `${s.folio} ${productor.nombre} ${s.cultivo}`.toLowerCase().includes(q);
            const matchEstado = !estado || s.estado === estado;
            return matchText && matchEstado;
        });

        renderTabla(filtrada);
    };

    // ════════════════════════════════════════════════════════════════
    // GUARDAR (CREATE / UPDATE)
    // ════════════════════════════════════════════════════════════════
    window.guardar = async function () {
        const folio              = document.getElementById('folio').value.trim();
        const fk_productor       = document.getElementById('fk_productor').value.trim();
        const fecha_solicitud    = document.getElementById('fecha_solicitud').value.trim();
        const cultivo            = document.getElementById('cultivo').value.trim();
        const superficie_ha      = document.getElementById('superficie_ha').value.trim();
        const num_beneficiarios  = document.getElementById('num_beneficiarios').value.trim();
        const documento_ceder    = document.getElementById('documento_ceder').value.trim();
        const estado             = document.getElementById('estado').value;
        const observaciones      = document.getElementById('observaciones').value.trim();
        const telefono           = document.getElementById('telefono').value.trim();
        const id                 = document.getElementById('pk_solicitud').value;

        if (!folio || !fk_productor || !fecha_solicitud) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Folio, Productor y Fecha de Solicitud son obligatorios'
            });
            return;
        }

        const payload = {
            folio,
            fk_productor: parseInt(fk_productor),
            fecha_solicitud,
            cultivo: cultivo || null,
            superficie_ha: superficie_ha ? parseFloat(superficie_ha) : null,
            num_beneficiarios: num_beneficiarios ? parseInt(num_beneficiarios) : null,
            documento_ceder: documento_ceder || null,
            estado,
            observaciones: observaciones || null,
            telefono: telefono || null
        };

        try {
            if (id) {
                // UPDATE
                await fetchWithAuth(`/api/solicitudes/${id}`, 'PUT', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Actualizada',
                    text: 'Solicitud actualizada exitosamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // CREATE
                await fetchWithAuth('/api/solicitudes', 'POST', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Registrada',
                    text: 'Solicitud creada exitosamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            mostrarTabla();
            listar();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        }
    };

    // ════════════════════════════════════════════════════════════════
    // EDITAR SOLICITUD
    // ════════════════════════════════════════════════════════════════
    window.editarSolicitud = function (id) {
        const solicitud = _registros.find(s => s.pk_solicitud === id);
        if (!solicitud) return;

        document.getElementById('pk_solicitud').value = solicitud.pk_solicitud;
        document.getElementById('folio').value = solicitud.folio || '';
        document.getElementById('fk_productor').value = solicitud.fk_productor || '';
        document.getElementById('fecha_solicitud').value = solicitud.fecha_solicitud ? solicitud.fecha_solicitud.split('T')[0] : '';
        document.getElementById('cultivo').value = solicitud.cultivo || '';
        document.getElementById('superficie_ha').value = solicitud.superficie_ha || '';
        document.getElementById('num_beneficiarios').value = solicitud.num_beneficiarios || '';
        document.getElementById('documento_ceder').value = solicitud.documento_ceder || '';
        document.getElementById('estado').value = solicitud.estado || 'pendiente';
        document.getElementById('observaciones').value = solicitud.observaciones || '';
        document.getElementById('telefono').value = solicitud.telefono || '';

        document.getElementById('tituloFormulario').textContent =
            `Editando: ${solicitud.folio}`;

        // Reinitializar select2 si existe
        if (typeof $ !== 'undefined' && $.fn.select2) {
            try {
                $('#fk_productor').select2('destroy').select2();
            } catch (e) {}
        }

        document.getElementById('contenedorFormulario').classList.remove('d-none');
        document.getElementById('contenedorTabla').classList.add('d-none');
    };

    // ════════════════════════════════════════════════════════════════
    // ELIMINAR SOLICITUD
    // ════════════════════════════════════════════════════════════════
    window.abrirEliminar = function (id, folio) {
        _idEliminar = id;
        document.getElementById('eliminarFolio').textContent = folio;
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/api/solicitudes/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({
                icon: 'success',
                title: 'Eliminada',
                timer: 2000,
                showConfirmButton: false
            });
            listar();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        }
    };

    // ════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════
    function getEstadoBadge(estado) {
        const badges = {
            'pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
            'aprobada': '<span class="badge bg-success">Aprobada</span>',
            'rechazada': '<span class="badge bg-danger">Rechazada</span>',
            'cancelada': '<span class="badge bg-secondary">Cancelada</span>'
        };
        return badges[estado] || `<span class="badge bg-light text-dark">${estado}</span>`;
    }

})();

// ════════════════════════════════════════════════════════════════
// FUNCIONES GLOBALES (UI)
// ════════════════════════════════════════════════════════════════
window.mostrarFormulario = function () {
    // Obtener fecha actual para el campo
    const hoy = new Date().toISOString().split('T')[0];
    
    document.getElementById('pk_solicitud').value = '';
    document.getElementById('folio').value = '';
    document.getElementById('fk_productor').value = '';
    document.getElementById('fecha_solicitud').value = hoy;
    document.getElementById('cultivo').value = '';
    document.getElementById('superficie_ha').value = '';
    document.getElementById('num_beneficiarios').value = '';
    document.getElementById('documento_ceder').value = '';
    document.getElementById('estado').value = 'pendiente';
    document.getElementById('observaciones').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('tituloFormulario').textContent = 'Nueva solicitud de comodato';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};