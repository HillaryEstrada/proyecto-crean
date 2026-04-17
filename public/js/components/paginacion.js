window.initPaginacion = function ({
    tbodyId,
    filasPorPagina = 10,
    sufijo = '' // ← clave
}) {
    const suf = sufijo ? '-' + sufijo : '';

    const tablaBody = document.getElementById(tbodyId);
    if (!tablaBody) return;

    function obtenerFilas() {
        return Array.from(tablaBody.querySelectorAll("tr"));
    }

    let paginaActual = 1;

    const btnPrimero   = document.getElementById("btn-primero" + suf);
    const btnAnterior  = document.getElementById("btn-anterior" + suf);
    const btnSiguiente = document.getElementById("btn-siguiente" + suf);
    const btnUltimo    = document.getElementById("btn-ultimo" + suf);
    const paginaInfo   = document.getElementById("pagina-info" + suf);
    const paginaInput  = document.getElementById("pagina-input" + suf);
    const registroInfo = document.getElementById("registro-info" + suf);

    function mostrarPagina(pagina) {
        const filas = obtenerFilas();
        const totalFilas = filas.length;
        const totalPaginas = Math.max(1, Math.ceil(totalFilas / filasPorPagina));

        if (pagina > totalPaginas) pagina = totalPaginas;
        if (pagina < 1) pagina = 1;

        paginaActual = pagina;

        const inicio = (pagina - 1) * filasPorPagina;
        const fin = inicio + filasPorPagina;

        filas.forEach((fila, index) => {
            fila.style.display = (index >= inicio && index < fin) ? "" : "none";
        });

        // UI
        if (paginaInfo) {
            paginaInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
        }

        if (paginaInput) {
            paginaInput.value = paginaActual;
        }

        // 🔥 ya no muestra “1 - 1 de X registros”
        if (registroInfo) {
            registroInfo.textContent = '';
        }

        // Botones
        if (btnAnterior) btnAnterior.disabled = paginaActual === 1;
        if (btnPrimero)  btnPrimero.disabled  = paginaActual === 1;
        if (btnSiguiente) btnSiguiente.disabled = paginaActual === totalPaginas;
        if (btnUltimo)   btnUltimo.disabled   = paginaActual === totalPaginas;
    }

    // Inicial
    mostrarPagina(1);

    // Eventos
    if (btnPrimero) {
        btnPrimero.onclick = () => mostrarPagina(1);
    }

    if (btnUltimo) {
        btnUltimo.onclick = () => {
            const totalPaginas = Math.ceil(obtenerFilas().length / filasPorPagina);
            mostrarPagina(totalPaginas);
        };
    }

    if (btnAnterior) {
        btnAnterior.onclick = () => mostrarPagina(paginaActual - 1);
    }

    if (btnSiguiente) {
        btnSiguiente.onclick = () => mostrarPagina(paginaActual + 1);
    }

    if (paginaInput) {
        paginaInput.onchange = () => {
            const n = parseInt(paginaInput.value);
            const totalPaginas = Math.ceil(obtenerFilas().length / filasPorPagina);

            if (!isNaN(n) && n >= 1 && n <= totalPaginas) {
                mostrarPagina(n);
            } else {
                paginaInput.value = paginaActual;
            }
        };
    }
};