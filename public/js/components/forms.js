// ---------- UI (GLOBAL) ----------
window.mostrarFormulario = function () {
    const f = document.getElementById('contenedorFormulario');
    const t = document.getElementById('contenedorTabla');
    const b = document.getElementById('btnCancelar');

    if (f) f.classList.remove('d-none');
    if (t) t.classList.add('d-none');
    if (b) b.classList.remove('d-none');
};

// ============================================
// VALIDAR FORMATO DE TEXTO (nombre, ubicación, etc.)
// ============================================
window.validarFormato = function (texto) {
    const errores = [];
    if (!texto || texto.length < 5)                   errores.push('Debe tener al menos 5 caracteres');
    if (texto && texto[0] !== texto[0].toUpperCase()) errores.push('Debe comenzar con mayúscula');
    if (/\s{2,}/.test(texto))                         errores.push('No debe tener espacios dobles');
    if (/^\d+$/.test(texto))                          errores.push('No puede ser solo números');
    return errores;
};

// ============================================
// VALIDAR CORREO
// ============================================
window.validarCorreo = function (correo) {
    if (!correo) return true; // opcional, si está vacío se permite
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
};

// ============================================
// FORMATEAR TELÉFONO (solo números, máx 10, formato ###-###-####)
// Úsalo así en el HTML: oninput="formatearTelefono(this)"
// ============================================
window.formatearTelefono = function (input) {
    let val = input.value.replace(/\D/g, '').slice(0, 10);
    if (val.length > 6)      val = val.slice(0,3) + '-' + val.slice(3,6) + '-' + val.slice(6);
    else if (val.length > 3) val = val.slice(0,3) + '-' + val.slice(3);
    input.value = val;
};