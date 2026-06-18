// ---------- GERENCIADOR DE INTERFACE (UI) ----------

window.UIManager = {
    elements: {},
    modalCentro: null,
    modalLancamento: null,
    currentCellEdit: null, // { month, category, categoryLabel }

    init() {
        this.cacheElements();
        this.checkOnboarding();
        this.bindEvents();
    },

    cacheElements() {
        this.elements = {
            // Onboarding/Login
            loginOverlay: document.getElementById("loginOverlay"),
            loginNome: document.getElementById("loginNome"),
            loginMesInicio: document.getElementById("loginMesInicio"),
            loginAnoInicio: document.getElementById("loginAnoInicio"),
            loginMesFim: document.getElementById("loginMesFim"),
            loginAnoFim: document.getElementById("loginAnoFim"),
            btnSalvarLogin: document.getElementById("btnSalvarLogin"),

            // Dashboard
            welcomeUserName: document.getElementById("welcomeUserName"),
            containerBlocosImportacao: document.getElementById("containerBlocosImportacao"),

            // Matriz Anual
            tabelaMatrizAnual: document.getElementById("tabelaMatrizAnual"),
            cabecalhoMatriz: document.getElementById("cabecalhoMatriz"),
            corpoMatriz: document.getElementById("corpoMatriz"),
            filtroCentroMatriz: document.getElementById("filtroCentroMatriz"),

            // Fechamento RH
            arquivoInput: document.getElementById("arquivo"),
            btnProcessar: document.getElementById("btnProcessar"),
            arquivoSelecionado: document.getElementById("arquivoSelecionado"),
            tabelaFuncionarios: document.getElementById("tabelaFuncionarios"),
            corpoConsolidacao: document.getElementById("corpoConsolidacao"),
            rodapeConsolidacao: document.getElementById("rodapeConsolidacao"),
            blocoClassificacao: document.getElementById("blocoClassificacao"),
            blocoConsolidacao: document.getElementById("blocoConsolidacao"),
            corpoAuditoria: document.getElementById("corpoAuditoria"),
            btnNovoCentro: document.getElementById("btnNovoCentro"),
            btnSalvarCentro: document.getElementById("btnSalvarCentro"),
            novoCentroInput: document.getElementById("novoCentro"),
            btnGerarConsolidacao: document.getElementById("btnGerarConsolidacao"),
            btnCopiarTabela: document.getElementById("btnCopiarTabela"),
            selectAno: document.getElementById("anoSelecionado"),
            selectMes: document.getElementById("mesSelecionado"),
            btnResetarCompetencia: document.getElementById("btnResetarCompetencia"),

            // Modal Célula
            tituloModalLancamento: document.getElementById("tituloModalLancamento"),
            detalheCustoModal: document.getElementById("detalheCustoModal"),
            detalheDataModal: document.getElementById("detalheDataModal"),
            justificativaTexto: document.getElementById("justificativaTexto"),
            btnSalvarLancamento: document.getElementById("btnSalvarLancamento")
        };

        // Modais Bootstrap
        const modalCentroEl = document.getElementById("modalCentro");
        if (modalCentroEl && typeof bootstrap !== "undefined") {
            this.modalCentro = new bootstrap.Modal(modalCentroEl);
        }

        const modalLancamentoEl = document.getElementById("modalLancamento");
        if (modalLancamentoEl && typeof bootstrap !== "undefined") {
            this.modalLancamento = new bootstrap.Modal(modalLancamentoEl);
        }
    },

    checkOnboarding() {
        const nome = window.StorageManager.getUsuarioNome();
        const config = window.StorageManager.getConfiguracoesUnidade();

        if (!nome || !config) {
            this.elements.loginOverlay.classList.remove("d-none");
        } else {
            this.elements.loginOverlay.classList.add("d-none");
            this.renderDashboard();
            this.renderMatrizAnual();
            this.setupFechamentoOptions();
            this.handleCarregarCompetencia();
        }
    },

    bindEvents() {
        const {
            btnSalvarLogin,
            btnProcessar,
            btnNovoCentro,
            btnSalvarCentro,
            btnGerarConsolidacao,
            btnCopiarTabela,
            btnResetarCompetencia,
            selectAno,
            selectMes,
            arquivoInput,
            btnSalvarLancamento
        } = this.elements;

        // Login salvar
        btnSalvarLogin.addEventListener("click", () => this.handleSaveLogin());

        // Mudança de arquivo de folha SIGA
        arquivoInput.addEventListener("change", e => {
            const arquivo = e.target.files[0];
            if (!arquivo) return;
            this.elements.arquivoSelecionado.innerHTML = 
                `Arquivo selecionado: <strong>${arquivo.name}</strong>`;
            
            // Tenta detectar mês e ano pelo nome do arquivo (ex: "04-2026.xlsx")
            const match = arquivo.name.match(/(\d{2})[-_](\d{4})/);
            if (match) {
                const mes = match[1];
                const ano = match[2];
                if (document.querySelector(`#mesSelecionado option[value="${mes}"]`)) {
                    this.elements.selectMes.value = mes;
                }
                if (document.querySelector(`#anoSelecionado option[value="${ano}"]`)) {
                    this.elements.selectAno.value = ano;
                }
            }
        });

        btnProcessar.addEventListener("click", () => this.handleProcessarPlanilha());
        btnNovoCentro.addEventListener("click", () => { if (this.modalCentro) this.modalCentro.show(); });
        btnSalvarCentro.addEventListener("click", () => this.handleSalvarNovoCentro());
        btnGerarConsolidacao.addEventListener("click", () => this.handleGerarConsolidacao());
        btnCopiarTabela.addEventListener("click", () => this.handleCopiarTabela());
        btnResetarCompetencia.addEventListener("click", () => this.handleResetarCompetencia());

        selectAno.addEventListener("change", () => this.handleCarregarCompetencia());
        selectMes.addEventListener("change", () => this.handleCarregarCompetencia());

        btnSalvarLancamento.addEventListener("click", () => this.handleSalvarAjusteCelula());

        // Alteração do centro de custo na tabela
        document.addEventListener("change", e => {
            if (e.target.classList.contains("centro-funcionario")) {
                this.handleMapearFuncionario(e.target);
            }
        });
    },

    handleSaveLogin() {
        const nome = this.elements.loginNome.value.trim();
        const startMonth = this.elements.loginMesInicio.value;
        const startYear = parseInt(this.elements.loginAnoInicio.value);
        const endMonth = this.elements.loginMesFim.value;
        const endYear = parseInt(this.elements.loginAnoFim.value);

        if (!nome) {
            alert("Por favor, informe seu nome.");
            return;
        }

        const config = { startMonth, startYear, endMonth, endYear };
        window.StorageManager.saveUsuarioNome(nome);
        window.StorageManager.saveConfiguracoesUnidade(config);

        this.checkOnboarding();
    },

    setupFechamentoOptions() {
        const selectAno = this.elements.selectAno;
        const config = window.StorageManager.getConfiguracoesUnidade();
        if (!selectAno || !config) return;

        selectAno.innerHTML = "";
        for (let ano = config.startYear; ano <= config.endYear; ano++) {
            selectAno.innerHTML += `<option value="${ano}">${ano}</option>`;
        }
        
        // Ajusta para o ano/mês atuais se estiver no intervalo
        const currentYear = new Date().getFullYear();
        if (currentYear >= config.startYear && currentYear <= config.endYear) {
            selectAno.value = currentYear;
        } else {
            selectAno.value = config.endYear;
        }
    },

    renderDashboard() {
        const nome = window.StorageManager.getUsuarioNome();
        this.elements.welcomeUserName.textContent = nome;

        const config = window.StorageManager.getConfiguracoesUnidade();
        if (!config) return;

        const blocos = this.calcularBlocosDe12Meses(config);
        const container = this.elements.containerBlocosImportacao;
        container.innerHTML = "";

        const dadosApura = window.StorageManager.getDadosApuraSUS();

        blocos.forEach((bloco, idx) => {
            // Calcula status do bloco
            const status = this.verificarStatusBloco(bloco, dadosApura);
            let badgeClass = "bg-danger";
            let badgeText = "Pendente";

            if (status.completo) {
                badgeClass = "bg-success";
                badgeText = `Importado (${status.mesesComDados} meses)`;
            } else if (status.mesesComDados > 0) {
                badgeClass = "bg-warning text-dark";
                badgeText = `Parcial (${status.mesesComDados}/${status.totalMeses} meses)`;
            }

            const blocoHTML = `
                <div class="col-md-6 col-lg-4">
                  <div class="card-bloco-upload h-100 p-4 border rounded shadow-sm bg-white">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <h4 class="fw-bold fs-6 mb-0 text-muted">Bloco ${idx + 1}</h4>
                      <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <h5 class="fw-bold fs-5 mb-2">${bloco.startLabel} a ${bloco.endLabel}</h5>
                    <p class="text-muted fs-8 mb-4">Carregue o relatório de custos do portal ApuraSUS para este intervalo de meses.</p>
                    
                    <div class="upload-zone-compact">
                      <input type="file" id="file_bloco_${idx}" class="input-bloco-file d-none" data-idx="${idx}">
                      <label for="file_bloco_${idx}" class="btn-outline-custom w-100 py-2 d-flex justify-content-center align-items-center">
                        <svg class="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Selecionar Relatório
                      </label>
                    </div>
                  </div>
                </div>
            `;
            container.innerHTML += blocoHTML;
        });

        // Bind events dos uploads dos blocos
        const inputs = container.querySelectorAll(".input-bloco-file");
        inputs.forEach(input => {
            input.addEventListener("change", e => {
                const file = e.target.files[0];
                const blocoIdx = parseInt(e.target.dataset.idx);
                const bloco = blocos[blocoIdx];
                if (file) this.handleProcessarRelatorioApuraSUS(file, bloco);
            });
        });
    },

    calcularBlocosDe12Meses(config) {
        const blocos = [];
        const startTotal = config.startYear * 12 + (parseInt(config.startMonth) - 1);
        const endTotal = config.endYear * 12 + (parseInt(config.endMonth) - 1);

        let tempStart = startTotal;
        while (tempStart <= endTotal) {
            let tempEnd = Math.min(tempStart + 11, endTotal);

            const sy = Math.floor(tempStart / 12);
            const sm = (tempStart % 12) + 1;
            const ey = Math.floor(tempEnd / 12);
            const em = (tempEnd % 12) + 1;

            const smStr = String(sm).padStart(2, '0');
            const emStr = String(em).padStart(2, '0');

            blocos.push({
                startLabel: `${smStr}/${sy}`,
                endLabel: `${emStr}/${ey}`,
                startMonth: sm,
                startYear: sy,
                endMonth: em,
                endYear: ey,
                startTotal: tempStart,
                endTotal: tempEnd
            });

            tempStart = tempEnd + 1;
        }
        return blocos;
    },

    verificarStatusBloco(bloco, dadosApura) {
        let mesesComDados = 0;
        const totalMeses = (bloco.endTotal - bloco.startTotal) + 1;

        for (let m = bloco.startTotal; m <= bloco.endTotal; m++) {
            const year = Math.floor(m / 12);
            const month = (m % 12) + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            if (dadosApura[monthKey]) {
                mesesComDados++;
            }
        }

        return {
            completo: mesesComDados === totalMeses,
            mesesComDados,
            totalMeses
        };
    },

    async handleProcessarRelatorioApuraSUS(file, bloco) {
        try {
            const isCSV = file.name.endsWith(".csv");
            let matrix = [];

            if (isCSV) {
                const text = await file.text();
                matrix = window.DataProcessor.parseCSV(text);
            } else {
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            }

            const totalMesesImportados = window.DataProcessor.importarRelatorioApuraSUS(matrix);
            alert(`Sucesso! Relatório importado. ${totalMesesImportados} meses mapeados com dados.`);
            
            // Re-renderiza dashboard e matriz
            this.renderDashboard();
            this.renderMatrizAnual();
            this.handleCarregarCompetencia(); // Atualiza auditoria
        } catch (err) {
            console.error(err);
            alert("Erro ao ler relatório: " + err.message);
        }
    },

    renderMatrizAnual() {
        const config = window.StorageManager.getConfiguracoesUnidade();
        if (!config) return;

        const cabecalho = this.elements.cabecalhoMatriz;
        const corpo = this.elements.corpoMatriz;
        cabecalho.innerHTML = "<th>Categorias de Custo</th>";
        corpo.innerHTML = "";

        // Lista de meses ordenada
        const meses = [];
        const startTotal = config.startYear * 12 + (parseInt(config.startMonth) - 1);
        const endTotal = config.endYear * 12 + (parseInt(config.endMonth) - 1);

        for (let m = startTotal; m <= endTotal; m++) {
            const year = Math.floor(m / 12);
            const month = (m % 12) + 1;
            const monthStr = String(month).padStart(2, '0');
            meses.push({
                key: `${year}-${monthStr}`,
                label: `${monthStr}/${year}`
            });
            cabecalho.innerHTML += `<th class="text-end">${monthStr}/${year}</th>`;
        }

        // Categorias de custo fixas na visualização analítica unitária
        const categorias = [
            { key: "remuneracaoEstatutario", label: "Remuneração Estatutário" },
            { key: "remuneracaoCLT", label: "Remuneração CLT" },
            { key: "remuneracaoMunicipal", label: "Remuneração Municipal" },
            { key: "beneficioEstatutario", label: "Benefício Estatutário" },
            { key: "beneficioCLT", label: "Benefício CLT" },
            { key: "horaExtra", label: "Hora Extra" }
        ];

        const dadosApura = window.StorageManager.getDadosApuraSUS();
        const justificativas = window.StorageManager.getJustificativasExcecoes();

        categorias.forEach(cat => {
            let tr = `<tr><td class="fw-bold text-muted">${cat.label}</td>`;
            
            meses.forEach(m => {
                const mesDados = dadosApura[m.key] || {};
                const valor = mesDados[cat.key] || 0;
                
                // Verifica status personalizado
                const overrideKey = `${m.key}-${cat.key}`;
                const override = justificativas[overrideKey] || null;
                
                let celulaClasse = "";
                let indicator = "";

                if (valor === 0) {
                    if (override && override.status === "justificado") {
                        celulaClasse = "bg-justified-marker"; // Estilo customizado
                        indicator = " ⚠️ [Justificado]";
                    } else if (override && override.status === "lancado") {
                        celulaClasse = "bg-forced-marker";
                        indicator = " 🟢 [Lançado Manual]";
                    } else {
                        celulaClasse = "bg-warning-marker"; // Marca-texto amarelo
                        indicator = " 🔴 [Pendente]";
                    }
                }

                tr += `
                    <td class="text-end ${celulaClasse} cell-interactive" 
                        data-mes="${m.key}" 
                        data-categoria="${cat.key}" 
                        data-label="${cat.label}" 
                        onclick="window.UIManager.abrirAjusteCelula(this)">
                      ${window.moeda(valor)}${indicator}
                    </td>
                `;
            });

            tr += "</tr>";
            corpo.innerHTML += tr;
        });
    },

    abrirAjusteCelula(element) {
        const month = element.dataset.mes;
        const category = element.dataset.categoria;
        const label = element.dataset.label;

        this.currentCellEdit = { month, category, label };

        this.elements.tituloModalLancamento.textContent = "Ajustar Célula";
        this.elements.detalheCustoModal.textContent = label;
        this.elements.detalheDataModal.textContent = `Referente a: ${month.split("-")[1]}/${month.split("-")[0]}`;

        // Carrega justificativa anterior
        const overrideKey = `${month}-${category}`;
        const justificativas = window.StorageManager.getJustificativasExcecoes();
        const override = justificativas[overrideKey] || {};

        this.elements.justificativaTexto.value = override.justificativa || "";

        // Seleciona status correto
        if (override.status === "justificado") {
            document.getElementById("statusJustificado").checked = true;
        } else if (override.status === "lancado") {
            document.getElementById("statusLancado").checked = true;
        } else {
            document.getElementById("statusPendente").checked = true;
        }

        if (this.modalLancamento) this.modalLancamento.show();
    },

    handleSalvarAjusteCelula() {
        if (!this.currentCellEdit) return;

        const { month, category } = this.currentCellEdit;
        const overrideKey = `${month}-${category}`;

        const selectedStatus = document.querySelector('input[name="statusLancamento"]:checked').value;
        const justificativa = this.elements.justificativaTexto.value.trim();

        const justificativas = window.StorageManager.getJustificativasExcecoes();

        if (selectedStatus === "pendente") {
            // Remove justificativa
            delete justificativas[overrideKey];
        } else {
            justificativas[overrideKey] = {
                status: selectedStatus,
                justificativa
            };
        }

        window.StorageManager.saveJustificativasExcecoes(justificativas);

        if (this.modalLancamento) this.modalLancamento.hide();

        this.renderMatrizAnual();
        this.handleCarregarCompetencia(); // Atualiza tabelas do Fechamento
    },

    // ==================== PARTE ORIGINAL ADAPTADA DO FECHAMENTO ====================

    async handleProcessarPlanilha() {
        const arquivo = this.elements.arquivoInput.files[0];
        if (!arquivo) {
            alert("Selecione uma planilha.");
            return;
        }

        try {
            const buffer = await arquivo.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const nomeAba = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[nomeAba];

            window.DataProcessor.carregarPlanilha(worksheet);
            this.renderTabelaFuncionarios();
            this.elements.blocoConsolidacao.classList.add("d-none");
        } catch (erro) {
            console.error(erro);
            alert("Erro ao processar planilha.");
        }
    },

    renderTabelaFuncionarios() {
        const { tabelaFuncionarios, blocoClassificacao } = this.elements;
        tabelaFuncionarios.innerHTML = "";

        const funcionarios = window.DataProcessor.funcionarios;
        const centros = window.centrosDeCusto;

        funcionarios.forEach((func, idx) => {
            tabelaFuncionarios.innerHTML += `
                <tr>
                    <td>${func.nome}</td>
                    <td>${func.cargo}</td>
                    <td>
                        <select class="form-select centro-funcionario" data-indice="${idx}">
                            <option value="">Selecione...</option>
                            ${centros.map(centro => `
                                <option value="${centro}" ${func.centro === centro ? "selected" : ""}>
                                    ${centro}
                                </option>
                            `).join("")}
                        </select>
                    </td>
                </tr>
            `;
        });

        blocoClassificacao.classList.remove("d-none");
    },

    handleMapearFuncionario(selectEl) {
        const idx = Number(selectEl.dataset.indice);
        const centro = selectEl.value;

        const func = window.DataProcessor.funcionarios[idx];
        func.centro = centro;

        const memoria = window.StorageManager.getMemoriaFuncionarios();
        memoria[func.nome] = centro;
        window.StorageManager.saveMemoriaFuncionarios(memoria);
    },

    handleSalvarNovoCentro() {
        const input = this.elements.novoCentroInput;
        const nome = input.value.trim();

        if (!nome) {
            alert("Informe um nome.");
            return;
        }

        if (window.centrosDeCusto.includes(nome)) {
            alert("Centro já existe.");
            return;
        }

        window.centrosDeCusto.push(nome);
        input.value = "";

        if (this.modalCentro) this.modalCentro.hide();

        this.renderTabelaFuncionarios();
    },

    handleGerarConsolidacao() {
        const funcionarios = window.DataProcessor.funcionarios;
        const semCentro = funcionarios.filter(f => !f.centro);

        if (semCentro.length > 0) {
            alert("Existem funcionários sem Centro de Custo.");
            return;
        }

        window.DataProcessor.gerarConsolidacao();
        this.renderConsolidacao();
        this.salvarCompetenciaAtual();
        this.realizarAuditoriaDivergencias();
    },

    renderConsolidacao() {
        const { corpoConsolidacao, rodapeConsolidacao, blocoConsolidacao } = this.elements;
        corpoConsolidacao.innerHTML = "";
        rodapeConsolidacao.innerHTML = "";

        const consolidacao = window.DataProcessor.consolidacao;
        const total = {
            remuneracaoEstatutario: 0,
            remuneracaoCLT: 0,
            remuneracaoMunicipal: 0,
            beneficioEstatutario: 0,
            beneficioCLT: 0,
            horaExtra: 0
        };

        Object.keys(consolidacao)
            .sort()
            .forEach(centro => {
                const item = consolidacao[centro];

                total.remuneracaoEstatutario += item.remuneracaoEstatutario;
                total.remuneracaoCLT += item.remuneracaoCLT;
                total.remuneracaoMunicipal += item.remuneracaoMunicipal;
                total.beneficioEstatutario += item.beneficioEstatutario;
                total.beneficioCLT += item.beneficioCLT;
                total.horaExtra += item.horaExtra;

                corpoConsolidacao.innerHTML += `
                    <tr>
                        <td>${centro}</td>
                        <td>${window.moeda(item.remuneracaoEstatutario)}</td>
                        <td>${window.moeda(item.remuneracaoCLT)}</td>
                        <td>${window.moeda(item.remuneracaoMunicipal)}</td>
                        <td>${window.moeda(item.beneficioEstatutario)}</td>
                        <td>${window.moeda(item.beneficioCLT)}</td>
                        <td>${window.moeda(item.horaExtra)}</td>
                    </tr>
                `;
            });

        rodapeConsolidacao.innerHTML = `
            <tr class="table-success-footer fw-bold">
                <td>TOTAL GERAL</td>
                <td>${window.moeda(total.remuneracaoEstatutario)}</td>
                <td>${window.moeda(total.remuneracaoCLT)}</td>
                <td>${window.moeda(total.remuneracaoMunicipal)}</td>
                <td>${window.moeda(total.beneficioEstatutario)}</td>
                <td>${window.moeda(total.beneficioCLT)}</td>
                <td>${window.moeda(total.horaExtra)}</td>
            </tr>
        `;

        blocoConsolidacao.classList.remove("d-none");
    },

    realizarAuditoriaDivergencias() {
        const ano = this.elements.selectAno.value;
        const mes = this.elements.selectMes.value;
        const monthKey = `${ano}-${mes}`;

        const consolidacao = window.DataProcessor.consolidacao;
        const dadosApura = window.StorageManager.getDadosApuraSUS();
        const justificativas = window.StorageManager.getJustificativasExcecoes();
        
        // Sumariza totais calculados (Siga) a nível de unidade
        const totalSiga = {
            remuneracaoEstatutario: 0,
            remuneracaoCLT: 0,
            remuneracaoMunicipal: 0,
            beneficioEstatutario: 0,
            beneficioCLT: 0,
            horaExtra: 0
        };

        Object.values(consolidacao).forEach(item => {
            totalSiga.remuneracaoEstatutario += item.remuneracaoEstatutario;
            totalSiga.remuneracaoCLT += item.remuneracaoCLT;
            totalSiga.remuneracaoMunicipal += item.remuneracaoMunicipal;
            totalSiga.beneficioEstatutario += item.beneficioEstatutario;
            totalSiga.beneficioCLT += item.beneficioCLT;
            totalSiga.horaExtra += item.horaExtra;
        });

        const apuraDadosMes = dadosApura[monthKey] || {
            remuneracaoEstatutario: 0,
            remuneracaoCLT: 0,
            remuneracaoMunicipal: 0,
            beneficioEstatutario: 0,
            beneficioCLT: 0,
            horaExtra: 0
        };

        const categorias = [
            { key: "remuneracaoEstatutario", label: "Remuneração Estatutário" },
            { key: "remuneracaoCLT", label: "Remuneração CLT" },
            { key: "remuneracaoMunicipal", label: "Remuneração Municipal" },
            { key: "beneficioEstatutario", label: "Benefício Estatutário" },
            { key: "beneficioCLT", label: "Benefício CLT" },
            { key: "horaExtra", label: "Hora Extra" }
        ];

        const corpoAuditoria = this.elements.corpoAuditoria;
        corpoAuditoria.innerHTML = "";

        categorias.forEach(cat => {
            const vSiga = totalSiga[cat.key];
            const vApura = apuraDadosMes[cat.key];
            const diferenca = vSiga - vApura;

            // Puxa status justificado
            const overrideKey = `${monthKey}-${cat.key}`;
            const override = justificativas[overrideKey] || null;

            let statusBadge = "";
            let rowClass = "";

            if (override && override.status === "justificado") {
                statusBadge = `<span class="badge bg-warning text-dark">Justificado (Ignorado)</span>`;
                rowClass = "table-light text-muted";
            } else if (override && override.status === "lancado") {
                statusBadge = `<span class="badge bg-success">Lançado (Forçado)</span>`;
                rowClass = "";
            } else if (Math.abs(diferenca) < 0.05) { // Quase igual
                statusBadge = `<span class="badge bg-success">✓ Conciliado</span>`;
                rowClass = "";
            } else {
                statusBadge = `<span class="badge bg-danger">🔴 Divergente</span>`;
                rowClass = "table-danger-light";
            }

            corpoAuditoria.innerHTML += `
                <tr class="${rowClass}">
                    <td>Betim / Unidade</td>
                    <td class="fw-bold">${cat.label}</td>
                    <td class="text-end">${window.moeda(vSiga)}</td>
                    <td class="text-end">${window.moeda(vApura)}</td>
                    <td class="text-end fw-bold text-danger">${window.moeda(diferenca)}</td>
                    <td class="text-center">${statusBadge}</td>
                </tr>
            `;
        });
    },

    handleCopiarTabela() {
        const consolidacao = window.DataProcessor.consolidacao;
        if (!consolidacao || Object.keys(consolidacao).length === 0) return;

        let texto = "CENTRO DE CUSTOS\tREMUNERAÇÃO ESTATUTÁRIO\tREMUNERAÇÃO - CLT\tREMUNERAÇÃO MUNICIPAL\tBENEFÍCIO ESTATUTÁRIO\tBENEFÍCIO CLT\tHORA EXTRA\n";

        Object.keys(consolidacao)
            .sort()
            .forEach(centro => {
                const item = consolidacao[centro];
                texto += `${centro}\t${item.remuneracaoEstatutario.toFixed(2)}\t${item.remuneracaoCLT.toFixed(2)}\t${item.remuneracaoMunicipal.toFixed(2)}\t${item.beneficioEstatutario.toFixed(2)}\t${item.beneficioCLT.toFixed(2)}\t${item.horaExtra.toFixed(2)}\n`;
            });

        navigator.clipboard.writeText(texto).then(() => {
            alert("Tabela copiada.");
        });
    },

    salvarCompetenciaAtual() {
        const ano = this.elements.selectAno.value;
        const mes = this.elements.selectMes.value;

        const historico = window.StorageManager.getHistoricoCompetencias();
        historico[ano] ??= {};
        historico[ano][mes] = structuredClone(window.DataProcessor.consolidacao);

        window.StorageManager.saveHistoricoCompetencias(historico);
    },

    handleResetarCompetencia() {
        const ano = this.elements.selectAno.value;
        const mes = this.elements.selectMes.value;

        const historico = window.StorageManager.getHistoricoCompetencias();
        if (!historico[ano]?.[mes]) {
            alert("Não existe nada salvo nesta competência.");
            return;
        }

        const confirmar = confirm(`Deseja apagar ${mes}/${ano}?`);
        if (!confirmar) return;

        delete historico[ano][mes];
        window.StorageManager.saveHistoricoCompetencias(historico);

        alert("Competência removida.");
        
        window.DataProcessor.consolidacao = {};
        this.elements.blocoConsolidacao.classList.add("d-none");
        this.realizarAuditoriaDivergencias();
    },

    handleCarregarCompetencia() {
        const selectAno = this.elements.selectAno;
        const selectMes = this.elements.selectMes;
        if (!selectAno || !selectMes) return;

        const ano = selectAno.value;
        const mes = selectMes.value;

        const historico = window.StorageManager.getHistoricoCompetencias();
        const dados = historico[ano]?.[mes];

        if (!dados) {
            window.DataProcessor.consolidacao = {};
            this.elements.blocoConsolidacao.classList.add("d-none");
            this.realizarAuditoriaDivergencias();
            return;
        }

        window.DataProcessor.consolidacao = dados;
        this.renderConsolidacao();
        this.realizarAuditoriaDivergencias();
    }
};

window.switchTab = function(tab, el) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');

    const titles = { 
        dashboard: 'Painel Geral', 
        relatorio: 'Relatório Anual', 
        rh: 'Fechamento RH', 
        drive: 'Drive', 
        sigss: 'Sigss' 
    };
    const subs = {
        dashboard: 'Status geral de conciliações e importações',
        relatorio: 'Matriz anual de acompanhamento de valores lançados',
        rh: 'Importação da folha SIGA e consolidação por centro de custo',
        drive: 'Integração com armazenamento de arquivos',
        sigss: 'Integração com o sistema Sigss'
    };
    
    document.getElementById('topbarTitle').textContent = titles[tab];
    document.getElementById('topbarSub').textContent = subs[tab];
};
