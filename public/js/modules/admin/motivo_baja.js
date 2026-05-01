(function () {
    let _registros  = [];
    let _idEliminar = null;

    esperarElemento('mbBody', async () => { listar(); }, 20, 'admin/motivo_baja');

    async function listar() {
        const tabla = document.getElementById('mbBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/motivo_baja');
            _registros = data;
            renderTabla(data);
        } catch (e) { console.error('Error listar motivos de baja:', e); }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('mbBody');
        const footer = document.getElementById('footerInfo');
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="3" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-user-slash fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay motivos de baja registrados</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'mbBody', filasPorPagina: 10, sufijo: 'mb' });
            return;
        }
        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;
        tabla.innerHTML = data.map((m, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                <td class="px-3" style="font-size:13px;">${m.nombre}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarMotivo(${m.pk_motivo_baja})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Eliminar"
                        onclick="abrirEliminar(${m.pk_motivo_baja}, '${m.nombre.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');
        initPaginacion({ tbodyId: 'mbBody', filasPorPagina: 10, sufijo: 'mb' });
    }

    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registros.filter(m => m.nombre.toLowerCase().includes(q)));
    };

    window.guardar = async function () {
        const nombre = document.getElementById('nombre').value.trim();
        const id     = document.getElementById('pk_motivo_baja').value;

        if (!nombre) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El nombre es obligatorio' });
            return;
        }

        try {
            if (id) {
                await fetchWithAuth(`/motivo_baja/${id}`, 'PUT', { nombre });
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Motivo de baja actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/motivo_baja', 'POST', { nombre });
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Motivo de baja creado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            mostrarTabla();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    window.editarMotivo = function (id) {
        const motivo = _registros.find(m => m.pk_motivo_baja === id);
        if (!motivo) return;

        document.getElementById('pk_motivo_baja').value = motivo.pk_motivo_baja;
        document.getElementById('nombre').value         = motivo.nombre;
        document.getElementById('tituloFormulario').textContent =
            `Editando: ${motivo.nombre}`;

        document.getElementById('contenedorFormulario').classList.remove('d-none');
        document.getElementById('contenedorTabla').classList.add('d-none');
    };

    window.abrirEliminar = function (id, nombre) {
        _idEliminar = id;
        document.getElementById('eliminarNombre').textContent = nombre;
        new bootstrap.Modal(document.getElementById('modalEliminar')).show();
    };

    window.confirmarEliminar = async function () {
        try {
            await fetchWithAuth(`/motivo_baja/${_idEliminar}`, 'DELETE');
            bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
            Swal.fire({ icon: 'success', title: 'Eliminado',
                timer: 2000, showConfirmButton: false });
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };
})();

// ── UI Global ─────────────────────────────────
window.mostrarFormulario = function () {
    document.getElementById('pk_motivo_baja').value        = '';
    document.getElementById('nombre').value                = '';
    document.getElementById('tituloFormulario').textContent = 'Nuevo motivo de baja';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};