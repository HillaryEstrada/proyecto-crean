(function () {
    let _registros = [];
    let _idEliminar = null;

    esperarElemento('tcBody', async () => { listar(); }, 20, 'admin/tipo_contrato');

    async function listar() {
        const tabla = document.getElementById('tcBody');
        if (!tabla) return;
        try {
            const data = await fetchWithAuth('/tipo_contrato');
            _registros = data;
            renderTabla(data);
        } catch (e) { console.error('Error listar tipos de contrato:', e); }
    }

    function renderTabla(data) {
        const tabla  = document.getElementById('tcBody');
        const footer = document.getElementById('footerInfo');
        if (!data.length) {
            tabla.innerHTML = `
                <tr><td colspan="3" class="text-center py-5 text-muted">
                    <i class="fa-solid fa-file-contract fa-2x d-block mb-2" style="color:#c8d5e3;"></i>
                    No hay tipos de contrato registrados</td></tr>`;
            if (footer) footer.textContent = 'Sin registros';
            initPaginacion({ tbodyId: 'tcBody', filasPorPagina: 10, sufijo: 'tc' });
            return;
        }
        if (footer) footer.textContent =
            `Mostrando ${data.length} de ${_registros.length} registros`;
        tabla.innerHTML = data.map((t, i) => `
            <tr>
                <td class="px-3 text-muted" style="font-size:12px;">${i + 1}</td>
                <td class="px-3" style="font-size:13px;">${t.nombre}</td>
                <td class="px-3 text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary me-1" title="Editar"
                        onclick="editarTipo(${t.pk_tipo_contrato})">
                        <i class="fa-solid fa-pen" style="font-size:11px;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Eliminar"
                        onclick="abrirEliminar(${t.pk_tipo_contrato}, '${t.nombre.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash" style="font-size:11px;"></i>
                    </button>
                </td>
            </tr>`).join('');
        initPaginacion({ tbodyId: 'tcBody', filasPorPagina: 10, sufijo: 'tc' });
    }

    window.filtrarTabla = function () {
        const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
        renderTabla(_registros.filter(t => t.nombre.toLowerCase().includes(q)));
    };

    window.guardar = async function () {
        const nombre = document.getElementById('nombre').value.trim();
        const id     = document.getElementById('pk_tipo_contrato').value;

        if (!nombre) {
            Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El nombre es obligatorio' });
            return;
        }

        try {
            if (id) {
                await fetchWithAuth(`/tipo_contrato/${id}`, 'PUT', { nombre });
                Swal.fire({ icon: 'success', title: 'Actualizado',
                    text: 'Tipo de contrato actualizado exitosamente',
                    timer: 2000, showConfirmButton: false });
            } else {
                await fetchWithAuth('/tipo_contrato', 'POST', { nombre });
                Swal.fire({ icon: 'success', title: 'Registrado',
                    text: 'Tipo de contrato creado exitosamente',
                    timer: 2000, showConfirmButton: false });
            }
            mostrarTabla();
            listar();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        }
    };

    window.editarTipo = function (id) {
        const tipo = _registros.find(t => t.pk_tipo_contrato === id);
        if (!tipo) return;

        document.getElementById('pk_tipo_contrato').value = tipo.pk_tipo_contrato;
        document.getElementById('nombre').value           = tipo.nombre;
        document.getElementById('tituloFormulario').textContent =
            `Editando: ${tipo.nombre}`;

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
            await fetchWithAuth(`/tipo_contrato/${_idEliminar}`, 'DELETE');
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
    document.getElementById('pk_tipo_contrato').value  = '';
    document.getElementById('nombre').value            = '';
    document.getElementById('tituloFormulario').textContent = 'Nuevo tipo de contrato';

    document.getElementById('contenedorFormulario').classList.remove('d-none');
    document.getElementById('contenedorTabla').classList.add('d-none');
};

window.mostrarTabla = function () {
    document.getElementById('contenedorFormulario').classList.add('d-none');
    document.getElementById('contenedorTabla').classList.remove('d-none');
};