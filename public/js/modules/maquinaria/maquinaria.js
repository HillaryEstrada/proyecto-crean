// ============================================
// JAVASCRIPT: maquinaria.js
// Descripción: Lógica del frontend para el módulo de maquinaria
// Arquitectura: MVC monolítico – partial view inyectada por cargarVista()
// Depende de: auth.js (fetchWithAuth, isAuthenticated, isAdmin)
//             Bootstrap 5 (modal), SweetAlert2 (alertas)
// ============================================

setTimeout(() => {

    // ============================================
    // REFERENCIAS DOM
    // ============================================

    const form  = document.getElementById('formMaquinaria');
    const tabla = document.getElementById('maqBody');

    // ============================================
    // ESTADO INTERNO
    // Almacena los registros activos en memoria para permitir
    // filtrado en cliente sin hacer nuevas peticiones al servidor
    // ============================================

    let _registrosActivos = [];

    // ============================================
    // CARGA INICIAL
    // ============================================

    listar();

    // ============================================
    // HELPERS VISUALES
    // Generan HTML de badges y celdas especiales.
    // Usan clases Bootstrap puras, sin CSS personalizado.
    // ============================================

    // Devuelve un badge Bootstrap según el estado operativo que viene del API
    function badgeEstado(estado) {
        const map = {
            disponible:    `<span class="badge bg-success">Disponible</span>`,
            en_uso:        `<span class="badge bg-warning text-dark">En uso</span>`,
            mantenimiento: `<span class="badge bg-danger">Mantenimiento</span>`,
            revision:      `<span class="badge bg-secondary">Revisión</span>`,
            baja:          `<span class="badge bg-dark">Baja</span>`
        };
        return map[estado] || `<span class="badge bg-light text-dark">${estado || '—'}</span>`;
    }

    // Convierte el texto del estado físico a letra con color (B / R / M)
    function estadoFisicoLetra(estado) {
        const mapa = {
            bueno:   ['B', 'text-success'],
            regular: ['R', 'text-warning'],
            malo:    ['M', 'text-danger']
        };
        const [letra, clase] = mapa[estado] || ['—', 'text-muted'];
        return `<strong class="${clase}">${letra}</strong>`;
    }

    // ============================================
    // SUBMIT DEL FORMULARIO
    // Determina si es creación (pk vacío) o edición (pk con valor)
    // y llama al endpoint correspondiente
    // ============================================

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
                ubicacion:        document.getElementById('ubicacion').value
            };

            try {
                if (id) {
                    // PUT /maquinaria/:id — actualizar registro existente
                    await fetchWithAuth(`/maquinaria/${id}`, 'PUT', data);
                    Swal.fire({
                        icon: 'success', title: 'Actualizado',
                        text: 'Maquinaria actualizada exitosamente',
                        timer: 2000, showConfirmButton: false
                    });
                } else {
                    // POST /maquinaria — crear nuevo registro
                    await fetchWithAuth('/maquinaria', 'POST', data);
                    Swal.fire({
                        icon: 'success', title: 'Registrado',
                        text: 'Maquinaria creada exitosamente',
                        timer: 2000, showConfirmButton: false
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

    // ============================================
    // LISTAR MAQUINARIA ACTIVA
    // GET /maquinaria → recibe solo los activos (el model excluye bajas)
    // Guarda en _registrosActivos para filtrado cliente posterior
    // ============================================

    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/maquinaria');

            // Guardar en estado interno para que filtrarTabla() opere sin fetch
            _registrosActivos = data;

            // Actualizar badge del tab Activos
            const badge = document.getElementById('badgeActivos');
            if (badge) badge.textContent = data.length;

            renderTabla(data);

        } catch (error) {
            console.error('Error al listar maquinaria:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la maquinaria' });
        }
    }

    // ============================================
    // RENDER TABLA ACTIVOS
    // Recibe un array (puede ser el original o uno filtrado)
    // y pinta el tbody #maqBody
    // ============================================

    function renderTabla(data) {
        const footer = document.getElementById('footerInfo');

        if (!data.length) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="fa-solid fa-tractor fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                        No hay maquinaria registrada con esos filtros
                    </td>
                </tr>`;
            if (footer) footer.textContent = 'Sin registros';
            return;
        }

        // Mostrar conteo real vs total almacenado
        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registrosActivos.length} registros`;

        tabla.innerHTML = data.map((m, index) => `
            <tr>
                <!-- Número progresivo -->
                <td class="px-3 text-muted" style="font-size:12px;">${index + 1}</td>

                <!-- Número económico en monospace para legibilidad -->
                <td class="px-3">
                    <span class="fw-bold" style="font-family:monospace; color:#1a3c5e; font-size:12px;">
                        ${m.numero_economico}
                    </span>
                </td>

                <td class="px-3" style="font-size:13px;">${m.tipo_equipo || '—'}</td>

                <td class="px-3" style="font-size:13px;">
                    ${m.marca || '—'}
                    <span class="text-muted">${m.modelo ? '· ' + m.modelo : ''}</span>
                </td>

                <td class="px-3 text-center" style="font-size:13px;">${m.anio || '—'}</td>

                <td class="px-3 text-muted" style="font-size:13px;">${m.ubicacion || '—'}</td>

                <td class="px-3 text-center">${badgeEstado(m.estado_operativo)}</td>

                <!-- Acciones: editar y dar de baja -->
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editar(
                            ${m.pk_maquinaria},
                            '${m.numero_economico}',
                            '${m.tipo_equipo}',
                            '${m.marca || ''}',
                            '${m.modelo || ''}',
                            '${m.anio || ''}',
                            '${m.ubicacion}'
                        )">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Dar de baja"
                        onclick="abrirBaja(
                            ${m.pk_maquinaria},
                            '${m.numero_economico}',
                            '${m.tipo_equipo}',
                            '${m.marca || ''}',
                            '${m.modelo || ''}'
                        )">
                        <i class="fa-solid fa-ban" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ============================================
    // FILTRAR TABLA (cliente)
    // Filtra _registrosActivos en memoria según los inputs de búsqueda.
    // No hace fetch al servidor — opera sobre lo ya cargado por listar().
    // ============================================

    window.filtrarTabla = function () {
        const q      = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const estado = document.getElementById('filtroEstado')?.value || '';

        const filtrado = _registrosActivos.filter(m => {
            const texto    = `${m.numero_economico} ${m.tipo_equipo} ${m.marca} ${m.modelo}`.toLowerCase();
            const matchQ   = !q || texto.includes(q);
            const matchEst = !estado || m.estado_operativo === estado;
            return matchQ && matchEst;
        });

        renderTabla(filtrado);
    };

    // ============================================
    // TABS: ACTIVOS / BAJAS
    // Alterna la visibilidad de las dos vistas sin recargar
    // ============================================

    window.switchTab = function (tab) {
        const vistaActivos = document.getElementById('vistaActivos');
        const vistaBajas   = document.getElementById('vistaBajas');
        const tabActivos   = document.getElementById('tabActivos');
        const tabBajas     = document.getElementById('tabBajas');

        if (tab === 'activos') {
            vistaActivos.classList.remove('d-none');
            vistaBajas.classList.add('d-none');
            tabActivos.classList.add('active');
            tabBajas.classList.remove('active');
        } else {
            vistaActivos.classList.add('d-none');
            vistaBajas.classList.remove('d-none');
            tabActivos.classList.remove('active');
            tabBajas.classList.add('active');
            // Cargar bajas al cambiar a esa pestaña
            listarBajas();
        }
    };

    // ============================================
    // LISTAR BAJAS
    // GET /maquinaria/bajas
    //
    // NOTA BACKEND: este endpoint requiere ser agregado en:
    //   routes/maquinaria/maquinaria.routes.js  → router.get('/bajas', controller.listarBajas)
    //   controllers/maquinaria/maquinaria.controller.js → exports.listarBajas
    //   models/maquinaria/maquinaria.model.js →
    //     listarBajas: () => Conexion.query(
    //       "SELECT * FROM maquinaria WHERE estado_operativo = 'baja' ORDER BY pk_maquinaria ASC"
    //     )
    // ============================================

    async function listarBajas() {
        const cuerpo = document.getElementById('bajasBody');
        if (!cuerpo) return;

        // Indicador de carga mientras llega la respuesta
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando bajas…
                </td>
            </tr>`;

        try {
            const data = await fetchWithAuth('/maquinaria/bajas');

            // Actualizar badge del tab Bajas
            const badge = document.getElementById('badgeBajas');
            if (badge) badge.textContent = data.length;

            if (!data.length) {
                cuerpo.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-5 text-muted">
                            <i class="fa-solid fa-ban fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                            No hay equipos dados de baja
                        </td>
                    </tr>`;
                return;
            }

            cuerpo.innerHTML = data.map((m, i) => `
                <tr>
                    <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                    <td class="px-3">
                        <span class="fw-bold" style="font-family:monospace; color:#1a3c5e; font-size:12px;">
                            ${m.numero_economico}
                        </span>
                    </td>
                    <td class="px-3" style="font-size:13px;">${m.tipo_equipo || '—'}</td>
                    <td class="px-3" style="font-size:13px;">
                        ${m.marca || '—'}
                        <span class="text-muted">${m.modelo ? '· ' + m.modelo : ''}</span>
                    </td>
                    <td class="px-3 text-muted" style="font-size:13px;">${m.ubicacion || '—'}</td>
                    <td class="px-3 text-center"><span class="badge bg-dark">Baja</span></td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error al listar bajas:', error);
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-3">
                        <i class="fa-solid fa-triangle-exclamation me-1"></i>
                        Error al cargar bajas. Verifica que el endpoint /maquinaria/bajas exista.
                    </td>
                </tr>`;
        }
    }

    // ============================================
    // EDITAR
    // Precarga los datos del registro en el formulario visible
    // y actualiza el título del card para indicar edición
    // ============================================

    window.editar = (id, numero, tipo, marca, modelo, anio, ubicacion) => {
        // Indicar en el título qué equipo se está editando
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

    // ============================================
    // ABRIR MODAL DE BAJA
    // Muestra el modal con los datos del equipo seleccionado.
    // Guarda el ID en _idParaBaja para que confirmarBajaModal() lo use.
    // ============================================

    let _idParaBaja = null; // almacena el ID mientras el modal está abierto

    window.abrirBaja = (id, numero, tipo, marca, modelo) => {
        _idParaBaja = id;

        // Mostrar datos del equipo en el modal
        const elNumero = document.getElementById('bajaNumero');
        const elDesc   = document.getElementById('bajaEquipoDesc');
        if (elNumero) elNumero.textContent = numero;
        if (elDesc)   elDesc.textContent   = `${tipo} · ${marca} ${modelo}`.trim().replace(' ·', '');

        // Limpiar el formulario del modal antes de mostrarlo
        document.getElementById('bajaTipoInput').value   = '';
        document.getElementById('bajaMotivoInput').value = '';
        document.getElementById('err_baja_tipo').classList.add('d-none');
        document.getElementById('err_baja_motivo').classList.add('d-none');

        new bootstrap.Modal(document.getElementById('modalBaja')).show();
    };

    // ============================================
    // CONFIRMAR BAJA DESDE EL MODAL
    // Valida los campos del modal y luego llama a desactivar()
    // que hace el PATCH al servidor
    // ============================================

    window.confirmarBajaModal = async () => {
        const tipo   = document.getElementById('bajaTipoInput').value;
        const motivo = document.getElementById('bajaMotivoInput').value.trim();

        // Validación local antes de hacer la petición
        let valido = true;
        if (!tipo)   { document.getElementById('err_baja_tipo').classList.remove('d-none');   valido = false; }
        if (!motivo) { document.getElementById('err_baja_motivo').classList.remove('d-none'); valido = false; }
        if (!valido) return;

        // Cerrar modal y proceder con la baja
        bootstrap.Modal.getInstance(document.getElementById('modalBaja')).hide();
        await desactivar(_idParaBaja);
    };

    // ============================================
    // DESACTIVAR (baja lógica)
    // PATCH /maquinaria/:id/desactivar
    // Marca el registro con estado_operativo = 'baja' en la DB
    // ============================================

    window.desactivar = async (id) => {
        try {
            await fetchWithAuth(`/maquinaria/${id}/desactivar`, 'PATCH');
            Swal.fire({
                icon: 'success', title: 'Baja registrada',
                text: 'El equipo fue dado de baja exitosamente',
                timer: 2000, showConfirmButton: false
            });
            // Recargar tabla de activos para reflejar el cambio
            listar();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

}, 100);


// ============================================
// UI GLOBAL
// Se declaran fuera del setTimeout para que estén disponibles
// en los onclick del HTML desde el momento en que se inyecta la vista.
// ============================================

// Muestra el formulario y oculta el contenedor de tabla
window.mostrarFormulario = function () {
    const titulo = document.getElementById('tituloFormulario');
    if (titulo) titulo.textContent = 'Registrar Maquinaria';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
    document.getElementById('btnCancelar').classList.remove('d-none');
};

// Oculta el formulario, limpia el estado del form y muestra la tabla
window.mostrarTabla = function () {
    const form = document.getElementById('formMaquinaria');
    if (form) form.reset();

    // Limpiar ID oculto para evitar editar en lugar de crear al volver
    const pk = document.getElementById('pk_maquinaria');
    if (pk) pk.value = '';

    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
    document.getElementById('btnCancelar').classList.add('d-none');
};