// ---------- INICIALIZAÇÃO DO SISTEMA ----------

document.addEventListener("DOMContentLoaded", () => {
    // Inicializa o gerenciador de interface
    window.UIManager.init();
    
    // Carrega os dados da competência padrão (ano e mês selecionados por padrão)
    window.UIManager.handleCarregarCompetencia();
});
