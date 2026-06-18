// ---------- PERSISTÊNCIA (LOCALSTORAGE) ----------

window.StorageManager = {
    getMemoriaFuncionarios() {
        return JSON.parse(localStorage.getItem("memoriaFuncionarios")) || {};
    },

    saveMemoriaFuncionarios(memoria) {
        localStorage.setItem("memoriaFuncionarios", JSON.stringify(memoria));
    },

    getHistoricoCompetencias() {
        return JSON.parse(localStorage.getItem("historicoCompetencias")) || {};
    },

    saveHistoricoCompetencias(historico) {
        localStorage.setItem("historicoCompetencias", JSON.stringify(historico));
    },

    getUsuarioNome() {
        return localStorage.getItem("usuarioNome") || "";
    },

    saveUsuarioNome(nome) {
        localStorage.setItem("usuarioNome", nome);
    },

    getConfiguracoesUnidade() {
        return JSON.parse(localStorage.getItem("configuracoesUnidade")) || null;
    },

    saveConfiguracoesUnidade(config) {
        localStorage.setItem("configuracoesUnidade", JSON.stringify(config));
    },

    getDadosApuraSUS() {
        return JSON.parse(localStorage.getItem("dadosApuraSUS")) || {};
    },

    saveDadosApuraSUS(dados) {
        localStorage.setItem("dadosApuraSUS", JSON.stringify(dados));
    },

    getJustificativasExcecoes() {
        return JSON.parse(localStorage.getItem("justificativasExcecoes")) || {};
    },

    saveJustificativasExcecoes(justificativas) {
        localStorage.setItem("justificativasExcecoes", JSON.stringify(justificativas));
    }
};

