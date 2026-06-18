// ---------- UTILITÁRIOS ----------

window.moeda = function(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
};

window.numero = function(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return 0;
    }
    const n = parseFloat(valor);
    return isNaN(n) ? 0 : n;
};
