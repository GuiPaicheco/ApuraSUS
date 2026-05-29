// ======================================
// APURA SUS
// CONSOLIDAÇÃO POR CENTRO DE CUSTO
// ======================================

// ---------- CENTROS PADRÃO ----------

let centrosDeCusto = [

    "ACS 01",
    "ACS 02",
    "ACS 03",

    "AUXILIAR ENFERMAGEM 01",

    "CONDOMÍNIO",

    "ENFERMEIRO 01",
    "ENFERMEIRO 02",
    "ENFERMEIRO 03",

    "FARMÁCIA",

    "GERÊNCIA",

    "MÉDICA 01",

    "NASF",

    "PEDIATRA",

    "PROCEDIMENTOS",

    "RECEPCIONISTA",

    "VACINA"

];

// ---------- MEMÓRIA ----------

let memoriaFuncionarios =
    JSON.parse(
        localStorage.getItem(
            "memoriaFuncionarios"
        )
    ) || {};

// ---------- DADOS ----------

let workbook = null;

let dadosPlanilha = [];

let funcionarios = [];

let consolidacao = {};

// ---------- ELEMENTOS ----------

const arquivoInput =
    document.getElementById("arquivo");

const btnProcessar =
    document.getElementById("btnProcessar");

const arquivoSelecionado =
    document.getElementById("arquivoSelecionado");

const tabelaFuncionarios =
    document.getElementById("tabelaFuncionarios");

const corpoConsolidacao =
    document.getElementById("corpoConsolidacao");

const rodapeConsolidacao =
    document.getElementById("rodapeConsolidacao");

// ======================================
// FORMATAÇÃO
// ======================================

function moeda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}

function numero(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return 0;
    }

    const n =
        parseFloat(valor);

    return isNaN(n)
        ? 0
        : n;

}

// ======================================
// UPLOAD
// ======================================

arquivoInput.addEventListener(
    "change",
    evento => {

        const arquivo =
            evento.target.files[0];

        if (!arquivo) return;

        arquivoSelecionado.innerHTML =
            `Arquivo selecionado: <strong>${arquivo.name}</strong>`;

    }
);

// ======================================
// PROCESSAR
// ======================================

btnProcessar.addEventListener(
    "click",
    processarArquivo
);

async function processarArquivo() {

    const arquivo =
        arquivoInput.files[0];

    if (!arquivo) {

        alert(
            "Selecione uma planilha."
        );

        return;

    }

    try {

        const buffer =
            await arquivo.arrayBuffer();

        workbook =
            XLSX.read(
                buffer,
                {
                    type: "array"
                }
            );

        const nomeAba =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[nomeAba];

        carregarPlanilha(
            worksheet
        );

    }
    catch (erro) {

        console.error(erro);

        alert(
            "Erro ao processar planilha."
        );

    }

}

// ======================================
// LIMPEZA
// ======================================

function carregarPlanilha(worksheet) {

    let dados =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                header: 1,
                defval: ""
            }
        );

    // Remove 4 primeiras linhas

    dados =
        dados.slice(4);

    // Remove rodapé

    const indiceRodape =
        dados.findIndex(
            linha =>
                linha.some(
                    valor =>
                        String(valor)
                        .includes(
                            "Prefeitura de Betim"
                        )
                )
        );

    if (indiceRodape !== -1) {

        dados =
            dados.slice(
                0,
                indiceRodape
            );

    }

    // Remove linhas vazias

    dados =
        dados.filter(
            linha =>
                linha.some(
                    valor =>
                        String(valor)
                        .trim() !== ""
                )
        );

    // Remove colunas vazias

    dados =
        removerColunasVazias(
            dados
        );

    console.log(
        "Cabeçalho encontrado:",
        dados[0]
    );

    dadosPlanilha =
        converterParaObjetos(
            dados
        );

    console.log(
        dadosPlanilha
    );

    montarFuncionarios();

}

// ======================================
// REMOVE COLUNAS VAZIAS
// ======================================

function removerColunasVazias(dados) {

    if (!dados.length)
        return dados;

    const totalColunas =
        Math.max(
            ...dados.map(
                linha =>
                    linha.length
            )
        );

    const colunasValidas = [];

    for (
        let col = 0;
        col < totalColunas;
        col++
    ) {

        let possuiValor =
            false;

        for (
            let lin = 0;
            lin < dados.length;
            lin++
        ) {

            const valor =
                String(
                    dados[lin][col] || ""
                ).trim();

            if (valor !== "") {

                possuiValor = true;
                break;

            }

        }

        if (possuiValor) {

            colunasValidas.push(
                col
            );

        }

    }

    return dados.map(
        linha =>
            colunasValidas.map(
                indice =>
                    linha[indice]
            )
    );

}

// ======================================
// CONVERTER OBJETOS
// ======================================

function converterParaObjetos(dados) {

    const cabecalho =
        dados[0].map(
            campo =>
                String(campo)
                    .trim()
                    .toUpperCase()
        );

    const resultado = [];

    for (
        let i = 1;
        i < dados.length;
        i++
    ) {

        const linha =
            dados[i];

        const obj = {};

        cabecalho.forEach(
            (
                campo,
                indice
            ) => {

                obj[campo] =
                    linha[indice];

            }
        );

        resultado.push(
            obj
        );

    }

    return resultado;

}

// ======================================
// FUNCIONÁRIOS
// ======================================

function montarFuncionarios() {

    const bloco =
        document.getElementById(
            "blocoClassificacao"
        );

    tabelaFuncionarios.innerHTML = "";

    const mapaFuncionarios =
        {};

    dadosPlanilha.forEach(
        registro => {

            const nome =
                String(
                    registro["NOME"] || ""
                ).trim();

            if (!nome) return;

            if (
                !mapaFuncionarios[nome]
            ) {

                mapaFuncionarios[nome] = {

                    nome,

                    cargo:
                        registro["CARGO"] || "",

                    centro:
                        memoriaFuncionarios[nome] || ""

                };

            }

        }
    );

    funcionarios =
        Object.values(
            mapaFuncionarios
        );

    funcionarios.sort(
        (a, b) =>
            a.nome.localeCompare(
                b.nome
            )
    );

    funcionarios.forEach(
        (
            funcionario,
            indice
        ) => {

            tabelaFuncionarios.innerHTML += `

            <tr>

                <td>
                    ${funcionario.nome}
                </td>

                <td>
                    ${funcionario.cargo}
                </td>

                <td>

                    <select
                        class="form-select centro-funcionario"
                        data-indice="${indice}"
                    >

                        <option value="">
                            Selecione...
                        </option>

                        ${centrosDeCusto.map(
                            centro => `

                                <option
                                    value="${centro}"
                                    ${funcionario.centro === centro ? "selected" : ""}
                                >
                                    ${centro}
                                </option>

                            `
                        ).join("")}

                    </select>

                </td>

            </tr>

            `;

        }
    );

    bloco.classList.remove(
        "d-none"
    );

}

// ======================================
// MEMÓRIA AUTOMÁTICA
// ======================================

document.addEventListener(
    "change",
    event => {

        if (
            !event.target.classList.contains(
                "centro-funcionario"
            )
        ) {
            return;
        }

        const indice =
            Number(
                event.target.dataset.indice
            );

        const centro =
            event.target.value;

        funcionarios[
            indice
        ].centro =
            centro;

        memoriaFuncionarios[
            funcionarios[
                indice
            ].nome
        ] = centro;

        localStorage.setItem(
            "memoriaFuncionarios",
            JSON.stringify(
                memoriaFuncionarios
            )
        );

    }
);

// ======================================
// CENTROS DE CUSTO
// ======================================

const modalCentro =
    new bootstrap.Modal(
        document.getElementById(
            "modalCentro"
        )
    );

document
    .getElementById(
        "btnNovoCentro"
    )
    .addEventListener(
        "click",
        () => {

            modalCentro.show();

        }
    );

document
    .getElementById(
        "btnSalvarCentro"
    )
    .addEventListener(
        "click",
        salvarCentro
    );

function salvarCentro() {

    const campo =
        document.getElementById(
            "novoCentro"
        );

    const nome =
        campo.value.trim();

    if (!nome) {

        alert(
            "Informe um nome."
        );

        return;

    }

    if (
        centrosDeCusto.includes(
            nome
        )
    ) {

        alert(
            "Centro já existe."
        );

        return;

    }

    centrosDeCusto.push(
        nome
    );

    campo.value = "";

    modalCentro.hide();

    montarFuncionarios();

}

// ======================================
// GERAR CONSOLIDAÇÃO
// ======================================

document
    .getElementById(
        "btnGerarConsolidacao"
    )
    .addEventListener(
        "click",
        () => {

            const semCentro =
                funcionarios.filter(
                    f => !f.centro
                );

            if (
                semCentro.length > 0
            ) {

                alert(
                    "Existem funcionários sem Centro de Custo."
                );

                return;

            }

            gerarConsolidacao();

        }
    );


// ======================================
// CONSOLIDAÇÃO
// ======================================

function gerarConsolidacao() {

    consolidacao = {};

    dadosPlanilha.forEach(registro => {

        const nome =
            String(
                registro["NOME"] || ""
            ).trim();

        const funcionario =
            funcionarios.find(
                f => f.nome === nome
            );

        if (!funcionario)
            return;

        const centro =
            funcionario.centro;

        if (!consolidacao[centro]) {

            consolidacao[centro] = {

                remuneracaoEstatutario: 0,
                remuneracaoCLT: 0,
                remuneracaoMunicipal: 0,

                beneficioEstatutario: 0,
                beneficioMunicipal: 0,

                horaExtra: 0

            };

        }

        // ==================================
        // REMUNERAÇÃO
        // ==================================

        consolidacao[centro].remuneracaoEstatutario +=
            numero(
                registro["COM_INCP_AGENTES"]
            );

        consolidacao[centro].remuneracaoCLT +=
            numero(
                registro["COM_INCP_COMISSIONADO"]
            ) +
            numero(
                registro["COM_INCP_ESTAGIARIO"]
            ) +
            numero(
                registro["COM_INCP_TEMPORARIO"]
            );

        consolidacao[centro].remuneracaoMunicipal +=
            numero(
                registro["COM_INCP_ESTATUTARIO"]
            );

        // ==================================
        // BENEFÍCIOS
        // ==================================

        consolidacao[centro].beneficioEstatutario +=
            numero(
                registro["SEM_INCP_AGENTES"]
            );

        consolidacao[centro].beneficioMunicipal +=
            numero(
                registro["SEM_INCP_COMISSIONADO"]
            ) +
            numero(
                registro["SEM_INCP_ESTAGIARIO"]
            ) +
            numero(
                registro["SEM_INCP_TEMPORARIO"]
            ) +
            numero(
                registro["SEM_INCP_ESTATUTARIO"]
            );

        // ==================================
        // HORA EXTRA
        // ==================================

        consolidacao[centro].horaExtra +=
            numero(
                registro["HORA_EXTRA"]
            );

    });

    renderizarConsolidacao();

}

// ======================================
// TABELA FINAL
// ======================================

function renderizarConsolidacao() {

    const bloco =
        document.getElementById(
            "blocoConsolidacao"
        );

    corpoConsolidacao.innerHTML = "";
    rodapeConsolidacao.innerHTML = "";

    const total = {

        remuneracaoEstatutario: 0,
        remuneracaoCLT: 0,
        remuneracaoMunicipal: 0,

        beneficioEstatutario: 0,
        beneficioMunicipal: 0,

        horaExtra: 0

    };

    Object.keys(
        consolidacao
    )
    .sort()
    .forEach(centro => {

        const item =
            consolidacao[centro];

        total.remuneracaoEstatutario +=
            item.remuneracaoEstatutario;

        total.remuneracaoCLT +=
            item.remuneracaoCLT;

        total.remuneracaoMunicipal +=
            item.remuneracaoMunicipal;

        total.beneficioEstatutario +=
            item.beneficioEstatutario;

        total.beneficioMunicipal +=
            item.beneficioMunicipal;

        total.horaExtra +=
            item.horaExtra;

        corpoConsolidacao.innerHTML += `

        <tr>

            <td>${centro}</td>

            <td>${moeda(item.remuneracaoEstatutario)}</td>

            <td>${moeda(item.remuneracaoCLT)}</td>

            <td>${moeda(item.remuneracaoMunicipal)}</td>

            <td>${moeda(item.beneficioEstatutario)}</td>

            <td>${moeda(item.beneficioMunicipal)}</td>

            <td>${moeda(item.horaExtra)}</td>

        </tr>

        `;

    });

    rodapeConsolidacao.innerHTML = `

    <tr class="table-success fw-bold">

        <td>TOTAL GERAL</td>

        <td>${moeda(total.remuneracaoEstatutario)}</td>

        <td>${moeda(total.remuneracaoCLT)}</td>

        <td>${moeda(total.remuneracaoMunicipal)}</td>

        <td>${moeda(total.beneficioEstatutario)}</td>

        <td>${moeda(total.beneficioMunicipal)}</td>

        <td>${moeda(total.horaExtra)}</td>

    </tr>

    `;

    bloco.classList.remove(
        "d-none"
    );

}

// ======================================
// COPIAR RESULTADO
// ======================================

document
    .getElementById(
        "btnCopiarTabela"
    )
    .addEventListener(
        "click",
        copiarResultado
    );

function copiarResultado() {

    let texto = "";

    texto +=
        "CENTRO DE CUSTOS\tREMUNERAÇÃO ESTATUTÁRIO\tREMUNERAÇÃO - CLT\tREMUNERAÇÃO MUNICIPAL\tBENEFÍCIO ESTATUTÁRIO\tBENEFÍCIO MUNICIPAL\tHORA EXTRA\n";

    Object.keys(
        consolidacao
    )
    .sort()
    .forEach(centro => {

        const item =
            consolidacao[centro];

        texto +=
`${centro}\t${item.remuneracaoEstatutario.toFixed(2)}\t${item.remuneracaoCLT.toFixed(2)}\t${item.remuneracaoMunicipal.toFixed(2)}\t${item.beneficioEstatutario.toFixed(2)}\t${item.beneficioMunicipal.toFixed(2)}\t${item.horaExtra.toFixed(2)}
`;

    });

    navigator.clipboard
        .writeText(texto)
        .then(() => {

            alert(
                "Tabela copiada."
            );

        });

}