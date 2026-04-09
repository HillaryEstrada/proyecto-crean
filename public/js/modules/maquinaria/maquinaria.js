// ============================================
// JAVASCRIPT: maquinaria.js
// Descripción: Maneja la lógica del frontend para maquinaria
// ============================================

setTimeout(() => {

    // VERIFICAR AUTENTICACIÓN
    if (!isAuthenticated()) {
        window.location.href = '/views/auth/login.html';
        return;
    }

    // VERIFICAR ROL
    if (!isAdmin()) {
        alert('Solo los administradores pueden acceder a esta sección');
        cargarVista('inicio');
        return;
    }

    // Referencias DOM
    const form = document.getElementById('formMaquinaria');
    const tabla = document.getElementById('tablaMaquinaria');

    // Cargar datos
    listar();

    // ==========================
    // SUBMIT FORMULARIO
    // ==========================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('pk_maquinaria').value;

            const data = {
                numero_economico: document.getElementById('numero_economico').value,
                tipo_equipo: 'tractor',
                marca: document.getElementById('marca').value,
                modelo: document.getElementById('modelo').value,
                anio: document.getElementById('anio').value,
                ubicacion: document.getElementById('ubicacion').value
            };

            try {
                if (id) {
                    await fetchWithAuth(`/maquinaria/${id}`, 'PUT', data);
                    alert('Maquinaria actualizada exitosamente');
                } else {
                    await fetchWithAuth('/maquinaria', 'POST', data);
                    alert('Maquinaria creada exitosamente');
                }

                form.reset();
                mostrarTabla();
                listar();

            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // ==========================
    // LISTAR
    // ==========================
    async function listar() {
        if (!tabla) return;

        try {
            const data = await fetchWithAuth('/maquinaria');

            tabla.innerHTML = '';

            if (data.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No hay maquinaria registrada</td>
                    </tr>
                `;
                return;
            }

            data.forEach(m => {
                tabla.innerHTML += `
                    <tr>
                        <td>${m.pk_maquinaria}</td>
                        <td>${m.numero_economico}</td>
                        <td>${m.marca || 'N/A'}</td>
                        <td>${m.modelo || 'N/A'}</td>
                        <td>${m.anio || 'N/A'}</td>
                        <td>${m.ubicacion || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning"
                                onclick="editar(
                                    ${m.pk_maquinaria},
                                    '${m.numero_economico}',
                                    '${m.marca || ''}',
                                    '${m.modelo || ''}',
                                    '${m.anio || ''}',
                                    '${m.ubicacion || ''}'
                                )">
                                Editar
                            </button>

                            <button class="btn btn-sm btn-secondary"
                                onclick="desactivar(${m.pk_maquinaria})">
                                Baja
                            </button>
                        </td>
                    </tr>
                `;
            });

        } catch (error) {
            console.error('Error al listar maquinaria:', error);
            alert('Error al cargar la maquinaria');
        }
    }

    // ==========================
    // EDITAR
    // ==========================
    window.editar = (id, numero, marca, modelo, anio, ubicacion) => {
        mostrarFormulario();

        document.getElementById('pk_maquinaria').value = id;
        document.getElementById('numero_economico').value = numero;
        document.getElementById('marca').value = marca;
        document.getElementById('modelo').value = modelo;
        document.getElementById('anio').value = anio;
        document.getElementById('ubicacion').value = ubicacion;
    };

    // ==========================
    // DESACTIVAR
    // ==========================
    window.desactivar = async (id) => {
        if (!confirm('¿Dar de baja esta maquinaria?')) return;

        try {
            await fetchWithAuth(`/maquinaria/${id}/desactivar`, 'PATCH');
            alert('Maquinaria dada de baja');
            listar();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

}, 100);


// ==========================
// FUNCIONES UI
// ==========================

window.mostrarFormulario = function () {
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');

    if (f) f.classList.remove('d-none');
    if (t) t.classList.add('d-none');
    if (b) b.classList.remove('d-none');
};

window.mostrarTabla = function () {
    const form = document.getElementById('formMaquinaria');
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');
    const id = document.getElementById('pk_maquinaria');

    if (form) form.reset();
    if (id) id.value = '';
    if (f) f.classList.add('d-none');
    if (t) t.classList.remove('d-none');
    if (b) b.classList.add('d-none');
};