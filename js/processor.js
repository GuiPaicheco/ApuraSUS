// ---------- PROCESSAMENTO DE DADOS (SIGA/RH E APURASUS) ----------

window.DataProcessor = {
    // Estados de processamento de folha (SIGA/RH)
    dadosPlanilha: [],
    funcionarios: [],
    consolidacao: {},

    // Converte a aba do XLSX da folha de pagamento (SIGA) para JSON e limpa os dados
    carregarPlanilha(worksheet) {
        let dados = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ""
        });

        // Remove 4 primeiras linhas (cabeçalhos extras do sistema)
        dados = dados.slice(4);

        // Remove o rodapé da prefeitura se presente
        const indiceRodape = dados.findIndex(linha =>
            linha.some(valor => String(valor).includes("Prefeitura de Betim"))
        );

        if (indiceRodape !== -1) {
            dados = dados.slice(0, indiceRodape);
        }

        // Remove linhas totalmente vazias
        dados = dados.filter(linha =>
            linha.some(valor => String(valor).trim() !== "")
        );

        // Remove colunas vazias
        dados = this.removerColunasVazias(dados);

        // Converte a matriz de dados para um array de objetos usando a primeira linha limpa como cabeçalho
        this.dadosPlanilha = this.converterParaObjetos(dados);
        
        // Mapeia e gera a lista de funcionários únicos
        this.montarFuncionarios();
    },

    // Remove colunas que não contêm nenhum dado útil em nenhuma linha
    removerColunasVazias(dados) {
        if (!dados.length) return dados;

        const totalColunas = Math.max(...dados.map(linha => linha.length));
        const colunasValidas = [];

        for (let col = 0; col < totalColunas; col++) {
            let possuiValor = false;
            for (let lin = 0; lin < dados.length; lin++) {
                const valor = String(dados[lin][col] || "").trim();
                if (valor !== "") {
                    possuiValor = true;
                    break;
                }
            }
            if (possuiValor) {
                colunasValidas.push(col);
            }
        }

        return dados.map(linha =>
            colunasValidas.map(indice => linha[indice])
        );
    },

    // Mapeia array de arrays em array de objetos usando o cabeçalho
    converterParaObjetos(dados) {
        const cabecalho = dados[0].map(campo =>
            String(campo).trim().toUpperCase()
        );

        const resultado = [];
        for (let i = 1; i < dados.length; i++) {
            const linha = dados[i];
            const obj = {};
            cabecalho.forEach((campo, indice) => {
                obj[campo] = linha[indice];
            });
            resultado.push(obj);
        }
        return resultado;
    },

    // Filtra funcionários únicos da planilha e recupera o centro de custo salvo
    montarFuncionarios() {
        const mapaFuncionarios = {};
        const memoria = window.StorageManager.getMemoriaFuncionarios();

        this.dadosPlanilha.forEach(registro => {
            const nome = String(registro["NOME"] || "").trim();
            if (!nome) return;

            if (!mapaFuncionarios[nome]) {
                mapaFuncionarios[nome] = {
                    nome: nome,
                    cargo: registro["CARGO"] || "",
                    centro: memoria[nome] || ""
                };
            }
        });

        this.funcionarios = Object.values(mapaFuncionarios);
        this.funcionarios.sort((a, b) => a.nome.localeCompare(b.nome));
    },

    // Consolida os valores financeiros por centro de custo para o fechamento
    gerarConsolidacao() {
        this.consolidacao = {};

        this.dadosPlanilha.forEach(registro => {
            const nome = String(registro["NOME"] || "").trim();
            const funcionario = this.funcionarios.find(f => f.nome === nome);
            if (!funcionario) return;

            const centro = funcionario.centro;
            if (!centro) return; 

            if (!this.consolidacao[centro]) {
                this.consolidacao[centro] = {
                    remuneracaoEstatutario: 0,
                    remuneracaoCLT: 0,
                    remuneracaoMunicipal: 0,
                    beneficioEstatutario: 0,
                    beneficioCLT: 0, 
                    horaExtra: 0
                };
            }

            // Remuneração
            this.consolidacao[centro].remuneracaoEstatutario += window.numero(registro["COM_INCP_AGENTES"]);
            this.consolidacao[centro].remuneracaoCLT += 
                window.numero(registro["COM_INCP_COMISSIONADO"]) +
                window.numero(registro["COM_INCP_ESTAGIARIO"]) +
                window.numero(registro["COM_INCP_TEMPORARIO"]);
            this.consolidacao[centro].remuneracaoMunicipal += window.numero(registro["COM_INCP_ESTATUTARIO"]);

            // Benefícios
            this.consolidacao[centro].beneficioEstatutario += window.numero(registro["SEM_INCP_AGENTES"]);
            this.consolidacao[centro].beneficioCLT += 
                window.numero(registro["SEM_INCP_COMISSIONADO"]) +
                window.numero(registro["SEM_INCP_ESTAGIARIO"]) +
                window.numero(registro["SEM_INCP_TEMPORARIO"]) +
                window.numero(registro["SEM_INCP_ESTATUTARIO"]);

            // Hora Extra
            this.consolidacao[centro].horaExtra += window.numero(registro["HORA_EXTRA"]);
        });
    },

    // parses the ApuraSUS report (matrix form)
    importarRelatorioApuraSUS(matrix) {
        let headerRowIndex = -1;
        const months = []; // { index, monthKey }
        
        // Localiza a linha do cabeçalho que possui datas formatadas
        for (let i = 0; i < matrix.length; i++) {
            const row = matrix[i];
            const hasMonthHeader = row.some(cell => /^\d{2}\/\d{4}$/.test(String(cell).trim()));
            if (hasMonthHeader) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            throw new Error("Não foi possível encontrar o cabeçalho com os meses (MM/AAAA) no arquivo.");
        }
        
        const headerRow = matrix[headerRowIndex];
        headerRow.forEach((cell, idx) => {
            const trimmed = String(cell).trim();
            if (/^\d{2}\/\d{4}$/.test(trimmed)) {
                const parts = trimmed.split("/");
                const monthKey = `${parts[1]}-${parts[0]}`; // YYYY-MM
                months.push({ index: idx, monthKey });
            }
        });
        
        const dadosExistentes = window.StorageManager.getDadosApuraSUS();
        
        // Normaliza strings para comparação robusta
        const normalizar = (str) => {
            return String(str || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // remove acentos
                .replace(/[^a-z0-9]/g, " ")      // limpa caracteres especiais
                .replace(/\s+/g, " ")
                .trim();
        };
        
        // Inicializa chaves no objeto acumulador
        months.forEach(m => {
            dadosExistentes[m.monthKey] = {
                remuneracaoEstatutario: 0,
                remuneracaoCLT: 0,
                remuneracaoMunicipal: 0,
                beneficioEstatutario: 0,
                beneficioCLT: 0,
                horaExtra: 0
            };
        });
        
        // Mapeia e acumula os valores
        for (let i = headerRowIndex + 1; i < matrix.length; i++) {
            const row = matrix[i];
            if (!row || row.length === 0) continue;
            
            const rowNameRaw = row[0];
            if (!rowNameRaw) continue;
            
            const rowName = normalizar(rowNameRaw);
            let category = null;
            
            if (rowName.includes("remuneracao") && rowName.includes("estatutario") && !rowName.includes("municipal")) {
                category = "remuneracaoEstatutario";
            } else if (rowName.includes("remuneracao") && rowName.includes("clt")) {
                category = "remuneracaoCLT";
            } else if (rowName.includes("remuneracao") && rowName.includes("municipal")) {
                category = "remuneracaoMunicipal";
            } else if (rowName.includes("beneficio") && rowName.includes("estatutario") && !rowName.includes("municipal")) {
                category = "beneficioEstatutario";
            } else if (rowName.includes("beneficio") && (rowName.includes("clt") || rowName.includes("municipal"))) {
                // Agrupa Benefícios a Pessoal - CLT e Benefício Estatutário Municipal no "Benefício CLT"
                category = "beneficioCLT";
            } else if (rowName.includes("hora extra")) {
                category = "horaExtra";
            }
            
            if (!category) continue;
            
            months.forEach(m => {
                const cellValRaw = row[m.index];
                if (cellValRaw !== undefined && cellValRaw !== null && String(cellValRaw).trim() !== "") {
                    let valStr = String(cellValRaw).trim();
                    if (valStr.includes(",") && valStr.includes(".")) {
                        valStr = valStr.replace(/\./g, ""); // remove separador de milhar
                    }
                    valStr = valStr.replace(/,/g, "."); // converte virgula decimal em ponto
                    const val = parseFloat(valStr) || 0;
                    
                    dadosExistentes[m.monthKey][category] += val;
                }
            });
        }
        
        window.StorageManager.saveDadosApuraSUS(dadosExistentes);
        return months.length;
    },

    // Divide uma string CSV em linhas e colunas
    parseCSV(text) {
        const lines = [];
        let row = [];
        let inQuotes = false;
        let cell = "";
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ';' || char === ',') {
                // No Brasil, o delimitador comum de CSV é o ponto e vírgula
                if (inQuotes) {
                    cell += char;
                } else {
                    row.push(cell);
                    cell = "";
                }
            } else if (char === '\r' || char === '\n') {
                if (inQuotes) {
                    cell += char;
                } else {
                    if (char === '\r' && nextChar === '\n') {
                        i++;
                    }
                    row.push(cell);
                    lines.push(row);
                    row = [];
                    cell = "";
                }
            } else {
                cell += char;
            }
        }
        if (cell || row.length > 0) {
            row.push(cell);
            lines.push(row);
        }
        return lines;
    }
};
