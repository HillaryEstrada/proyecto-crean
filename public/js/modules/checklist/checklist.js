(function() {
    if (window._checklistInicializado) return;
    window._checklistInicializado = true;

    // ============================================
    // MÓDULO: checklist.js
    // Descripción: Gestión de checklist diario
    // ============================================

    let dataChecklist = [];

    // ── Inicializar ──────────────────────────────
    (async function init() {
        await cargarChecklist();
        await cargarEquipos();
    })();

    // ─────────────────────────────────────────────
    // 📥 CARGAR CHECKLIST
    // ─────────────────────────────────────────────
    async function cargarChecklist() {
        try {
            const data = await fetchWithAuth('/checklist');
            dataChecklist = data;

            if (!data.length) {
                document.getElementById('estado-vacio').style.display = 'block';
                document.getElementById('tabla-container').style.display = 'none';
                return;
            }

            document.getElementById('estado-vacio').style.display = 'none';
            document.getElementById('tabla-container').style.display = 'block';

            renderTabla(data);

        } catch (error) {
            console.error('Error al cargar checklist:', error);
        }
    }

    // ─────────────────────────────────────────────
    // 🧱 RENDER TABLA
    // ─────────────────────────────────────────────
    function renderTabla(data) {
        const tbody = document.getElementById('tabla-checklist');
        tbody.innerHTML = '';

        data.forEach((item, index) => {

            const resultado = calcularResultado(item);

            const fila = `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        <strong>${item.numero_economico || '-'}</strong>
                    </td>

                    <td>
                        <span class="badge bg-secondary text-capitalize">
                            ${item.tipo_activo}
                        </span>
                    </td>

                    <td>${formatearFecha(item.fecha)}</td>

                    <td>${renderResultado(resultado)}</td>

                    <td>${item.observaciones || '-'}</td>

                    <td>${item.usuario || '-'}</td>

                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1"
                            onclick="verDetalle(${item.pk_checklist})">
                            <i class="fas fa-eye"></i>
                        </button>

                        ${resultado !== 'correcto' ? `
                        <button class="btn btn-sm btn-danger"
                            onclick="reportarFalla(${item.pk_checklist})">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>` : ''}
                    </td>
                </tr>
            `;

            tbody.innerHTML += fila;
        });

        document.getElementById('total-registros').textContent =
            `${data.length} registros`;
    }

    // ─────────────────────────────────────────────
    // 🧠 CALCULAR RESULTADO
    // ─────────────────────────────────────────────
    function calcularResultado(item) {

        const checks = [
            item.nivel_aceite,
            item.nivel_refrigerante,
            item.filtro_aire,
            item.presion_llantas,
            item.nivel_combustible,
            item.engrase_puntos,
            item.inspeccion_visual
        ];

        if (checks.every(v => v === true)) return 'correcto';
        if (checks.some(v => v === false)) return 'falla';

        return 'observacion';
    }

    // ─────────────────────────────────────────────
    // 🎨 RENDER RESULTADO
    // ─────────────────────────────────────────────
    function renderResultado(tipo) {

        if (tipo === 'correcto') {
            return `<span class="badge bg-success">Correcto</span>`;
        }

        if (tipo === 'falla') {
            return `<span class="badge bg-danger">Falla</span>`;
        }

        return `<span class="badge bg-warning text-dark">Observación</span>`;
    }

    // ─────────────────────────────────────────────
    // 📅 FORMATEAR FECHA
    // ─────────────────────────────────────────────
    function formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-MX');
    }

    // ─────────────────────────────────────────────
    // 📦 CARGAR EQUIPOS (SELECT)
    // ─────────────────────────────────────────────
    async function cargarEquipos() {
        try {
            const maquinaria = await fetchWithAuth('/maquinaria');
            const select = document.getElementById('equipo');

            select.innerHTML = maquinaria.map(m => `
                <option value="${m.pk_maquinaria}">
                    ${m.numero_economico} - ${m.modelo}
                </option>
            `).join('');

        } catch (error) {
            console.error('Error al cargar equipos:', error);
        }
    }

    // ─────────────────────────────────────────────
    // 💾 GUARDAR CHECKLIST
    // ─────────────────────────────────────────────
    window.guardarChecklist = async function() {

        const data = {
            tipo_activo: document.getElementById('tipo_activo').value,
            fk_maquinaria: document.getElementById('equipo').value,
            fecha: new Date().toISOString().split('T')[0],

            nivel_aceite: document.getElementById('nivel_aceite').checked,
            nivel_refrigerante: document.getElementById('nivel_refrigerante').checked,
            filtro_aire: document.getElementById('filtro_aire').checked,
            presion_llantas: document.getElementById('presion_llantas').checked,
            nivel_combustible: document.getElementById('nivel_combustible').checked,
            engrase_puntos: document.getElementById('engrase_puntos').checked,
            inspeccion_visual: document.getElementById('inspeccion_visual').checked,

            observaciones: document.getElementById('observaciones').value,
            realizado_por: 1 // después lo sacas del token
        };

        try {
            await fetchWithAuth('/checklist', 'POST', data);

            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'Checklist registrado correctamente'
            });

            location.reload();

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar'
            });
        }
    };

    // ─────────────────────────────────────────────
    // 🔍 VER DETALLE
    // ─────────────────────────────────────────────
    window.verDetalle = function(id) {
        console.log('Ver detalle:', id);
    };

    // ─────────────────────────────────────────────
    // 🚨 REPORTAR FALLA
    // ─────────────────────────────────────────────
    window.reportarFalla = async function(id) {

        const item = dataChecklist.find(c => c.pk_checklist === id);

        try {
            await fetchWithAuth('/falla', 'POST', {
                tipo_activo: item.tipo_activo,
                fk_maquinaria: item.fk_maquinaria,
                descripcion: 'Detectado desde checklist',
                fecha_reporte: new Date().toISOString().split('T')[0]
            });

            Swal.fire({
                icon: 'success',
                title: 'Falla generada'
            });

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al generar falla'
            });
        }
    };

})();