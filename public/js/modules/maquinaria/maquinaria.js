
setTimeout(() => {

    // ── Autenticación ─────────────────────────────────────
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        window.top.location.href = '/views/auth/login.html';
        return;
    }

    // ════════════════════════════════════════════════════════
    //  1. ESTADO INTERNO
    // ════════════════════════════════════════════════════════

    const tabla = document.getElementById('maqBody');
    const form  = document.getElementById('formMaquinaria');

    let _registrosActivos = [];  // caché para filtrado en cliente
    let _idParaBaja       = null; // PK mientras el modal de baja está abierto

    // ════════════════════════════════════════════════════════
    //  2. INIT
    // ════════════════════════════════════════════════════════

    listar();

    // ════════════════════════════════════════════════════════
    //  3. API — LISTAR ACTIVOS
    //  GET /maquinaria → solo registros activos (sin baja)
    // ════════════════════════════════════════════════════════

    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/maquinaria');
            _registrosActivos = Array.isArray(data) ? data : [];

            const badge = document.getElementById('badgeActivos');
            if (badge) badge.textContent = _registrosActivos.length;

            renderTabla(_registrosActivos);

        } catch (error) {
            console.error('[Maquinaria] Error al listar:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la maquinaria' });
        }
    }

    // ════════════════════════════════════════════════════════
    //  4. API — LISTAR BAJAS
    //  GET /maquinaria/bajas
    // ════════════════════════════════════════════════════════

    async function listarBajas() {
        const cuerpo = document.getElementById('bajasBody');
        if (!cuerpo) return;

        cuerpo.innerHTML = `
            <tr>
              <td colspan="6" class="text-center py-4" style="color:var(--maq-muted);">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando bajas…
              </td>
            </tr>`;

        try {
            const data = await fetchWithAuth('/maquinaria/bajas');
            const bajas = Array.isArray(data) ? data : [];

            const badge = document.getElementById('badgeBajas');
            if (badge) badge.textContent = bajas.length;

            renderBajas(bajas);

        } catch (error) {
            console.error('[Maquinaria] Error al listar bajas:', error);
            cuerpo.innerHTML = `
                <tr>
                  <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Error al cargar bajas. Verifica que el endpoint /maquinaria/bajas exista.
                  </td>
                </tr>`;
        }
    }

    // ════════════════════════════════════════════════════════
    //  5. RENDER — TABLA ACTIVOS
    //  Recibe array (original o filtrado) y pinta #maqBody
    // ════════════════════════════════════════════════════════

    function renderTabla(data) {
        const footer = document.getElementById('footerInfo');

        if (!data || !data.length) {
            tabla.innerHTML = `
                <tr>
                  <td colspan="8" class="text-center py-5" style="color:var(--maq-muted);">
                    <i class="bi bi-truck d-block mb-2" style="font-size:2.5rem;color:#c8d5e3;"></i>
                    No hay maquinaria registrada con esos filtros
                  </td>
                </tr>`;
            if (footer) footer.textContent = 'Sin registros';
            return;
        }

        if (footer)
            footer.textContent = `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((m, index) => `
            <tr>
              <td style="font-size:12px; color:var(--maq-muted);">${index + 1}</td>

              <td>
                <span class="maq-eco">${m.numero_economico || '—'}</span>
              </td>

              <td style="font-size:13px;">${m.tipo_equipo || '—'}</td>

              <td style="font-size:13px;">
                ${m.marca || '—'}
                <span style="color:var(--maq-muted);">${m.modelo ? '· ' + m.modelo : ''}</span>
              </td>

              <td class="text-center" style="font-size:13px;">${m.anio || '—'}</td>

              <td style="font-size:13px; color:var(--maq-muted);">${m.ubicacion || '—'}</td>

              <td class="text-center">${_badgeEstado(m.estado_operativo)}</td>

              <td class="text-center" style="white-space:nowrap;">
                <div class="maq-acciones" style="flex-direction:row; justify-content:center;">
                  <button class="btn-act-maq btn-edit" title="Editar"
                    onclick="editar(
                      ${m.pk_maquinaria},
                      '${m.numero_economico}',
                      '${m.tipo_equipo}',
                      '${m.marca || ''}',
                      '${m.modelo || ''}',
                      '${m.anio || ''}',
                      '${m.ubicacion}'
                    )">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button class="btn-act-maq btn-baja" title="Dar de baja"
                    onclick="abrirBaja(
                      ${m.pk_maquinaria},
                      '${m.numero_economico}',
                      '${m.tipo_equipo}',
                      '${m.marca || ''}',
                      '${m.modelo || ''}'
                    )">
                    <i class="bi bi-slash-circle-fill"></i>
                  </button>
                </div>
              </td>
            </tr>`).join('');
    }

    // ════════════════════════════════════════════════════════
    //  6. RENDER — TABLA BAJAS
    // ════════════════════════════════════════════════════════

    function renderBajas(data) {
        const cuerpo = document.getElementById('bajasBody');
        if (!cuerpo) return;

        if (!data.length) {
            cuerpo.innerHTML = `
                <tr>
                  <td colspan="6" class="text-center py-5" style="color:var(--maq-muted);">
                    <i class="bi bi-slash-circle d-block mb-2" style="font-size:2.5rem;color:#c8d5e3;"></i>
                    No hay equipos dados de baja
                  </td>
                </tr>`;
            return;
        }

        cuerpo.innerHTML = data.map((m, i) => `
            <tr>
              <td style="font-size:12px; color:var(--maq-muted);">${i + 1}</td>
              <td><span class="maq-eco">${m.numero_economico || '—'}</span></td>
              <td style="font-size:13px;">${m.tipo_equipo || '—'}</td>
              <td style="font-size:13px;">
                ${m.marca || '—'}
                <span style="color:var(--maq-muted);">${m.modelo ? '· ' + m.modelo : ''}</span>
              </td>
              <td style="font-size:13px; color:var(--maq-muted);">${m.ubicacion || '—'}</td>
              <td class="text-center">
                <span class="badge-maq badge-maq-baja">Baja</span>
              </td>
            </tr>`).join('');
    }

    // ════════════════════════════════════════════════════════
    //  7. HELPERS VISUALES
    // ════════════════════════════════════════════════════════

    // Badge estado operativo — usa clases del sistema CREAN
    function _badgeEstado(estado) {
        const map = {
            disponible:    'badge-maq-disponible',
            en_uso:        'badge-maq-en_uso',
            mantenimiento: 'badge-maq-mantenimiento',
            revision:      'badge-maq-revision',
            baja:          'badge-maq-baja',
        };
        const labels = {
            disponible: 'Disponible', en_uso: 'En uso',
            mantenimiento: 'Mantenimiento', revision: 'Revisión', baja: 'Baja',
        };
        const cls = map[estado] || 'badge-maq-revision';
        const lbl = labels[estado] || (estado || '—');
        return `<span class="badge-maq ${cls}">${lbl}</span>`;
    }

    // ════════════════════════════════════════════════════════
    //  8. FILTRO (cliente)
    //  Opera sobre _registrosActivos sin nuevo fetch
    // ════════════════════════════════════════════════════════

    window.filtrarTabla = function () {
        const q      = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estado = document.getElementById('filtroEstado')?.value || '';

        const filtrado = _registrosActivos.filter(m => {
            const texto  = `${m.numero_economico} ${m.tipo_equipo} ${m.marca} ${m.modelo}`.toLowerCase();
            const matchQ = !q || texto.includes(q);
            const matchE = !estado || m.estado_operativo === estado;
            return matchQ && matchE;
        });

        renderTabla(filtrado);
    };

    // ════════════════════════════════════════════════════════
    //  9. TABS
    // ════════════════════════════════════════════════════════

    window.switchTab = function (tab) {
        const vistaActivos = document.getElementById('vistaActivos');
        const vistaBajas   = document.getElementById('vistaBajas');
        const tabActivos   = document.getElementById('tabActivos');
        const tabBajas     = document.getElementById('tabBajas');

        if (tab === 'activos') {
            vistaActivos?.classList.remove('d-none');
            vistaBajas?.classList.add('d-none');
            tabActivos?.classList.add('active');
            tabActivos?.classList.remove('active-danger');
            tabBajas?.classList.remove('active', 'active-danger');
        } else {
            vistaActivos?.classList.add('d-none');
            vistaBajas?.classList.remove('d-none');
            tabBajas?.classList.add('active', 'active-danger');
            tabActivos?.classList.remove('active');
            listarBajas();
        }
    };

    // ════════════════════════════════════════════════════════
    //  10. FORMULARIO — SUBMIT
    //  Crea (POST) o actualiza (PUT) según pk_maquinaria
    // ════════════════════════════════════════════════════════

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_maquinaria').value;

            const data = {
                numero_economico: document.getElementById('numero_economico').value,
                tipo_equipo:      document.getElementById('tipo_equipo').value,
                marca:            document.getElementById('marca').value,
                modelo:           document.getElementById('modelo').value,
                anio:             document.getElementById('anio').value,
                ubicacion:        document.getElementById('ubicacion').value,
            };

            try {
                if (id) {
                    await fetchWithAuth(`/maquinaria/${id}`, 'PUT', data);
                    Swal.fire({
                        icon: 'success', title: 'Actualizado',
                        text: 'Maquinaria actualizada exitosamente',
                        timer: 2000, showConfirmButton: false,
                    });
                } else {
                    await fetchWithAuth('/maquinaria', 'POST', data);
                    Swal.fire({
                        icon: 'success', title: 'Registrado',
                        text: 'Maquinaria creada exitosamente',
                        timer: 2000, showConfirmButton: false,
                    });
                }

                form.reset();
                mostrarTabla();
                listar();

            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message });
            }
        });
    }

    // ════════════════════════════════════════════════════════
    //  11. EDITAR
    //  Precarga datos en el formulario y lo muestra
    // ════════════════════════════════════════════════════════

    window.editar = (id, numero, tipo, marca, modelo, anio, ubicacion) => {
        const titulo = document.getElementById('tituloFormulario');
        if (titulo) titulo.textContent = `Editando: ${numero}`;

        mostrarFormulario();

        document.getElementById('pk_maquinaria').value    = id;
        document.getElementById('numero_economico').value = numero;
        document.getElementById('tipo_equipo').value      = tipo;
        document.getElementById('marca').value            = marca;
        document.getElementById('modelo').value           = modelo;
        document.getElementById('anio').value             = anio;
        document.getElementById('ubicacion').value        = ubicacion;
    };

    // ════════════════════════════════════════════════════════
    //  12. BAJA — ABRIR MODAL
    //  Guarda PK y rellena datos del equipo antes de mostrar
    // ════════════════════════════════════════════════════════

    window.abrirBaja = (id, numero, tipo, marca, modelo) => {
        _idParaBaja = id;

        const elNumero = document.getElementById('bajaNumero');
        const elDesc   = document.getElementById('bajaEquipoDesc');
        if (elNumero) elNumero.textContent = numero;
        if (elDesc)   elDesc.textContent   = `${tipo} · ${marca} ${modelo}`.replace(' · ', ' · ').trim();

        // Limpiar campos y errores
        document.getElementById('bajaTipoInput').value   = '';
        document.getElementById('bajaMotivoInput').value = '';
        document.getElementById('err_baja_tipo').classList.add('d-none');
        document.getElementById('err_baja_motivo').classList.add('d-none');

        new bootstrap.Modal(document.getElementById('modalBaja')).show();
    };

    // ════════════════════════════════════════════════════════
    //  13. BAJA — CONFIRMAR (desde el modal)
    //  Valida y llama a desactivar()
    // ════════════════════════════════════════════════════════

    window.confirmarBajaModal = async () => {
        const tipo   = document.getElementById('bajaTipoInput').value;
        const motivo = document.getElementById('bajaMotivoInput').value.trim();

        let valido = true;
        if (!tipo)   { document.getElementById('err_baja_tipo').classList.remove('d-none');   valido = false; }
        if (!motivo) { document.getElementById('err_baja_motivo').classList.remove('d-none'); valido = false; }
        if (!valido) return;

        bootstrap.Modal.getInstance(document.getElementById('modalBaja'))?.hide();
        await desactivar(_idParaBaja);
    };

    // ════════════════════════════════════════════════════════
    //  14. BAJA — DESACTIVAR (API)
    //  PATCH /maquinaria/:id/desactivar → estado_operativo = 'baja'
    // ════════════════════════════════════════════════════════

    window.desactivar = async (id) => {
        try {
            await fetchWithAuth(`/maquinaria/${id}/desactivar`, 'PATCH');
            Swal.fire({
                icon: 'success', title: 'Baja registrada',
                text: 'El equipo fue dado de baja exitosamente',
                timer: 2000, showConfirmButton: false,
            });
            listar(); // refresca tabla de activos

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

}, 100);


// ════════════════════════════════════════════════════════════
//  UI GLOBAL — fuera del setTimeout para disponibilidad inmediata
//  en los onclick del HTML al inyectarse la vista
// ════════════════════════════════════════════════════════════

// Muestra formulario y oculta tabla
window.mostrarFormulario = function () {
    const titulo = document.getElementById('tituloFormulario');
    if (titulo) titulo.textContent = 'Registrar Maquinaria';

    document.getElementById('contenedorFormulario')?.classList.remove('d-none');
    document.getElementById('contenedorTabla')?.classList.add('d-none');
};

// Oculta formulario, limpia estado y muestra tabla
window.mostrarTabla = function () {
    const form = document.getElementById('formMaquinaria');
    if (form) form.reset();

    const pk = document.getElementById('pk_maquinaria');
    if (pk) pk.value = '';

    document.getElementById('contenedorFormulario')?.classList.add('d-none');
    document.getElementById('contenedorTabla')?.classList.remove('d-none');
};