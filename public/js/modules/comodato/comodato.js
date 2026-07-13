(function () {
    let _registros    = [];
    let _productores  = [];
    let _solicitudes  = [];
    let _idEliminar   = null;

    esperarElemento('comodatoBody', async () => { 
        cargarProductores();
        cargarSolicitudes();
        listar(); 
    }, 20, 'comodato/comodato');

    // ════════════════════════════════════════════════════════════════
    // CARGAR DATOS RELACIONADOS (Productores y Solicitudes)
    // ════════════════════════════════════════════════════════════════
    async function cargarProductores() {
        try {
            const data = await fetchWithAuth('/api/productores');
            _productores = Array.isArray(data) ? data : [];
            poblarSelectProductor();
        } catch (e) { console.error('Error cargar productores:', e); }
    }

    async function cargarSolicitudes() {
        try {
            // Solo solicitudes aprobadas
            const data = await fetchWithAuth('/api/solicitudes?estado=aprobada');
            _solicitudes = Array.isArray(data) ? data : [];
            poblarSelectSolicitud();
        } catch (e) { console.error('Error cargar solicitudes:', e); }
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

    function poblarSelectSolicitud() {
        const select = document.getElementById('fk_solicitud');
        if (!select) return;
        select.innerHTML = '<option value="">— Seleccionar solicitud —</option>';
        _solicitudes.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.pk_solicitud;
            opt.textContent = `${s.folio} — ${s.nombre_productor}`;
            select.appendChild(opt);
        });
        // Reinitializar select2 si existe
        if (typeof $ !== 'undefined' && $.fn.select2) {
            try { $(select).select2('destroy').select2(); } catch (e) {}
        }
    }

    // ════════════════════════════════════════════════════════════════
    // LISTAR COMODATOS
    // ════════════════════════════════════════════════════════════════
    async function listar() {
        const tabla = document.getElementById('comodatoBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/api/comodatos');
            _registros = Array.isArray(data) ? data : [];
            renderTabla(_registros);
        } catch (e) { console.error('Error listar comodatos:', e); }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('comodatoBody');
        const footer = document.getElementById('footerInfo');
        
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-handshake fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay comodatos registrados</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'comodatoBody', filasPorPagina: 10, sufijo: 'comodato' });
            return;
        }

        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;

        tabla.innerHTML = data.map((c, i) => {
            const productor = _productores.find(p => p.pk_productor === c.fk_productor) || {};
            const estadoBadge = getEstadoBadge(c.estado);
            
            return `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3" style="font-size:13px;">
                        <strong>${productor.nombre || 'Sin datos'}</strong>
                        <br><small class="text-muted">${productor.nombre_ejido || ''}</small>
                    </td>
                    <td class="px-3" style="font-size:13px;">${c.cultivo || '—'}</td>
                    <td class="px-3 text-center" style="font-size:13px;">${c.superficie_ha || '—'}</td>
                    <td class="px-3 text-center" style="font-size:12px;color:#666;">
                        ${c.fecha_entrega ? new Date(c.fecha_entrega).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td class="px-3 text-center" style="font-size:12px;color:#666;">
                        ${c.fecha_devolucion_esperada ? new Date(c.fecha_devolucion_esperada).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td class="px-3 text-center">${estadoBadge}</td>
                    <td class="px-3 text-center" style="white-space:nowrap;">
                        <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                            onclick="editarComodato(${c.pk_comodato})">
                            <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Eliminar"
                            onclick="abrirEliminar(${c.pk_comodato}, '${productor.nombre || 'Comodato'}')">
                            <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');
        
        initPaginacion({ tbodyId: 'comodatoBody', filasPorPagina: 10, sufijo: 'comodato' });
    }

    // ════════════════════════════════════════════════════════════════
    // FILTRAR TABLA
    // ════════════════════════════════════════════════════════════════
    window.filtrarTabla = function () {
        const q       = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estado  = (document.getElementById('filtroEstado')?.value || '');

        const filtrada = _registros.filter(c => {
            const productor = _productores.find(p => p.pk_productor === c.fk_productor) || {};
            const matchText = !q || 
                `${productor.nombre} ${c.cultivo} ${c.estado}`.toLowerCase().includes(q);
            const matchEstado = !estado || c.estado === estado;
            return matchText && matchEstado;
        });

        renderTabla(filtrada);
    };

    // ════════════════════════════════════════════════════════════════
    // GUARDAR (CREATE / UPDATE)
    // ════════════════════════════════════════════════════════════════
    window.guardar = async function () {
        const fk_productor        = document.getElementById('fk_productor').value.trim();
        const fk_solicitud        = document.getElementById('fk_solicitud').value.trim();
        const cultivo             = document.getElementById('cultivo').value.trim();
        const superficie_ha       = document.getElementById('superficie_ha').value.trim();
        const num_beneficiarios   = document.getElementById('num_beneficiarios').value.trim();
        const fecha_entrega       = document.getElementById('fecha_entrega').value.trim();
        const fecha_devolucion_esperada = document.getElementById('fecha_devolucion_esperada').value.trim();
        const fecha_devolucion_real = document.getElementById('fecha_devolucion_real').value.trim();
        const dias_prestamo       = document.getElementById('dias_prestamo').value.trim();
        const estado              = document.getElementById('estado').value;
        const observaciones       = document.getElementById('observaciones').value.trim();
        const id                  = document.getElementById('pk_comodato').value;

        if (!fk_productor || !fecha_entrega) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Productor y Fecha de Entrega son obligatorios'
            });
            return;
        }

        const payload = {
            fk_productor: parseInt(fk_productor),
            fk_solicitud: fk_solicitud ? parseInt(fk_solicitud) : null,
            cultivo: cultivo || null,
            superficie_ha: superficie_ha ? parseFloat(superficie_ha) : null,
            num_beneficiarios: num_beneficiarios ? parseInt(num_beneficiarios) : null,
            fecha_entrega,
            fecha_devolucion_esperada: fecha_devolucion_esperada || null,
            fecha_devolucion_real: fecha_devolucion_real || null,
            dias_prestamo: dias_prestamo ? parseInt(dias_prestamo) : null,
            estado,
            observaciones: observaciones || null
        };

        try {
            if (id) {
                // UPDATE
                await fetchWithAuth(`/api/comodatos/${id}`, 'PUT', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Comodato actualizado exitosamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // CREATE
                await fetchWithAuth('/api/comodatos', 'POST', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Registrado',
                    text: 'Comodato creado exitosamente',
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
    // EDITAR COMODATO
    // ════════════════════════════════════════════════════════════════
    window.editarComodato = function (id) {
        const comodato = _registros.find(c => c.pk_comodato === id);
        if (!comodato) return;

        document.getElementById('pk_comodato').value = comodato.pk_comodato;
        document.getElementById('fk_productor').value = comodato.fk_productor || '';
        document.getElementById('fk_solicitud').value = comodato.fk_solicitud || '';
        document.getElementById('cultivo').value = comodato.cultivo || '';
        document.getElementById('superficie_ha').value = comodato.superficie_ha || '';
        document.getElementById('num_beneficiarios').value = comodato.num_beneficiarios || '';
        document.getElementById('fecha_entrega').value = comodato.fecha_entrega ? comodato.fecha_entrega.split('T')[0] : '';
        document.getElementById('fecha_devolucion_esperada').value = comodato.fecha_devolucion_esperada ? comodato.fecha_devolucion_esperada.split('T')[0] : '';
        document.getElementById('fecha_devolucion_real').value = comodato.fecha_devolucion_real ? comodato.fecha_devolucion_real.split('T')[0] : '';
        document.getElementById('dias_prestamo').value = comodato.dias_prestamo || '';
        document.getElementById('estado').value = comodato.estado || 'programado';
        document.getElementById('observaciones').value = comodato.observaciones || '';

        const productor = _productores.find(p => p.pk_productor === comodato.fk_productor) || {};
        document.getElementById('tituloFormulario').textContent =
            `Editando: ${productor.nombre || 'Comodato'}`;

        // Reinitializar select2 si existe
        if (typeof $ !== 'undefined' && $.fn.select2) {
            try {
                $('#fk_productor').select2('destroy').select2();
                $('#fk_solicitud').select2('destroy').select2();
            } catch (e) {}
        }

        document.getElementById('contenedorFormulario').classList.remove('d-none');
        document.getElementById('contenedorTabla').classList.add('d-none');
    };

    // ════════════════════════════════════════════════════════════════
    // ELIMINAR COMODATO
    // ════════════════════════════════════════════════════════════════
    window.abrirEliminar = function (id, nombre) {
        _idEliminar = id;
        document.getElementById('eliminarNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/api/comodatos/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
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
            'programado': '<span class="badge bg-warning text-dark">Programado</span>',
            'activo': '<span class="badge bg-info">Activo</span>',
            'finalizado': '<span class="badge bg-success">Finalizado</span>',
            'incumplido': '<span class="badge bg-danger">Incumplido</span>',
            'cancelado': '<span class="badge bg-secondary">Cancelado</span>'
        };
        return badges[estado] || `<span class="badge bg-light text-dark">${estado}</span>`;
    }

})();

// ════════════════════════════════════════════════════════════════
// FUNCIONES GLOBALES (UI)
// ════════════════════════════════════════════════════════════════
window.mostrarFormulario = function () {
    document.getElementById('pk_comodato').value = '';
    document.getElementById('fk_productor').value = '';
    document.getElementById('fk_solicitud').value = '';
    document.getElementById('cultivo').value = '';
    document.getElementById('superficie_ha').value = '';
    document.getElementById('num_beneficiarios').value = '';
    document.getElementById('fecha_entrega').value = '';
    document.getElementById('fecha_devolucion_esperada').value = '';
    document.getElementById('fecha_devolucion_real').value = '';
    document.getElementById('dias_prestamo').value = '';
    document.getElementById('estado').value = 'programado';
    document.getElementById('observaciones').value = '';
    document.getElementById('tituloFormulario').textContent = 'Nuevo contrato de comodato';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};