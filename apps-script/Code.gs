/**
 * Portal do Motorista · Tropical Transportes
 *
 * Script vinculado à planilha de respostas do Forms de Solicitações de Serviço.
 * Cole este arquivo inteiro em Extensões → Apps Script (veja LEIAME.md).
 *
 * - doGet: devolve ao portal as Solicitações de um e-mail (JSON).
 * - onEdit: carimba ÚLTIMA ATUALIZAÇÃO quando a manutenção mexe na Solicitação.
 * - aoEnviarFormulario: dá o Nº fixo a cada nova Solicitação.
 * - Menu "Portal do Motorista": preparação da planilha e limpeza inicial.
 *
 * As colunas são encontradas pelo NOME do cabeçalho, nunca pela posição.
 */

// ── Configuração ────────────────────────────────────────────────

var FUSO = 'America/Sao_Paulo';
var DIAS_LIMPEZA = 30;

var COL = {
  carimbo:     'Carimbo de data/hora',
  nome:        'NOME E SOBRENOME DO SOLICITANTE:',
  frota:       'NÚMERO DE FROTA:',
  odometro:    'ODÔMETRO ATUAL:',
  problema:    'DESCREVA ABAIXO OS PROBLEMAS ENCONTRADOS:',
  email:       'Endereço de e-mail',
  situacao:    'SITUAÇÃO',
  previsao:    'PREVISÃO DE LIBERAÇÃO',
  prioridade:  'PRIORIDADE',
  programada:  'DATA PROGRAMADA',
  conclusao:   'DATA CONCLUSÃO',
  liberado:    'VEÍCULO LIBERADO',
  tecnico:     'TÉCNICO RESPONSÁVEL',
  observacoes: 'OBSERVAÇÕES',
  numero:      'Nº',
  atualizacao: 'ÚLTIMA ATUALIZAÇÃO'
};

// Nome antigo da coluna que vira PREVISÃO DE LIBERAÇÃO.
var COL_TEMPO_ANTIGA = 'TEMPO (DIAS)';

var SITUACOES = ['Recebida', 'Programada', 'Em andamento', 'Aguardando peça', 'Finalizada', 'Cancelada'];

// Colunas que, quando editadas, contam como atualização para o Motorista.
var COLS_QUE_ATUALIZAM = ['situacao', 'programada', 'previsao', 'conclusao', 'liberado', 'tecnico', 'observacoes'];

// ── Lógica pura (sem SpreadsheetApp; testável fora do Google) ───

function semAcento_(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Converte o texto da coluna SITUAÇÃO para um dos 6 valores. Em branco = Recebida. */
function normalizarSituacao(valor) {
  var v = semAcento_(valor == null ? '' : valor);
  if (!v) return 'Recebida';
  if (v.indexOf('cancel') === 0 || v.indexOf('recus') === 0) return 'Cancelada';
  if (v.indexOf('finaliz') === 0 || v.indexOf('conclu') === 0) return 'Finalizada';
  if (v.indexOf('aguard') === 0) return 'Aguardando peça';
  // PENDENTE era usado para "ainda não resolvida e não iniciada".
  if (v.indexOf('pendente') === 0) return 'Recebida';
  if (v.indexOf('andamento') !== -1) return 'Em andamento';
  if (v.indexOf('program') === 0) return 'Programada';
  return 'Recebida';
}

/** Mapa nome-da-coluna → índice, comparando sem acento e sem espaços extras. */
function indicesDasColunas(cabecalho) {
  var porNome = {};
  cabecalho.forEach(function (h, i) { porNome[semAcento_(h)] = i; });
  var idx = {};
  Object.keys(COL).forEach(function (chave) {
    var i = porNome[semAcento_(COL[chave])];
    idx[chave] = (i === undefined) ? -1 : i;
  });
  return idx;
}

function ehData_(v) {
  return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
}

function ehSim_(v) {
  if (v === true) return true;
  var s = semAcento_(v == null ? '' : v);
  return s === 'sim' || s === 's' || s === 'true' || s === 'x';
}

/**
 * Monta a lista de Solicitações de um e-mail.
 * @param {Array} cabecalho  linha 1 da planilha
 * @param {Array[]} linhas   demais linhas (valores brutos)
 * @param {string} email
 * @param {function(Date):string} formatarData  dd/MM/yyyy
 */
function montarSolicitacoes(cabecalho, linhas, email, formatarData) {
  var idx = indicesDasColunas(cabecalho);
  var alvo = semAcento_(email || '');
  if (!alvo || idx.email < 0) return [];

  function val(linha, chave) {
    return idx[chave] < 0 ? '' : linha[idx[chave]];
  }
  function texto(linha, chave) {
    var v = val(linha, chave);
    if (ehData_(v)) return formatarData(v);
    return v == null ? '' : String(v).trim();
  }
  function ms(linha, chave) {
    var v = val(linha, chave);
    return ehData_(v) ? v.getTime() : 0;
  }

  var resultado = [];
  linhas.forEach(function (linha, i) {
    if (semAcento_(val(linha, 'email') || '') !== alvo) return;
    resultado.push({
      numero:              texto(linha, 'numero') || String(i + 2),
      nome:                texto(linha, 'nome'),
      frota:               texto(linha, 'frota'),
      odometro:            texto(linha, 'odometro'),
      problema:            texto(linha, 'problema'),
      situacao:            normalizarSituacao(val(linha, 'situacao')),
      dataCadastro:        texto(linha, 'carimbo'),
      dataCadastroMs:      ms(linha, 'carimbo'),
      dataProgramada:      texto(linha, 'programada'),
      previsaoLiberacao:   texto(linha, 'previsao'),
      dataConclusao:       texto(linha, 'conclusao'),
      dataConclusaoMs:     ms(linha, 'conclusao'),
      veiculoLiberado:     ehSim_(val(linha, 'liberado')),
      tecnico:             texto(linha, 'tecnico'),
      observacoes:         texto(linha, 'observacoes'),
      ultimaAtualizacao:   texto(linha, 'atualizacao'),
      ultimaAtualizacaoMs: ms(linha, 'atualizacao')
      // PRIORIDADE é de uso interno e nunca sai daqui.
    });
  });

  resultado.sort(function (a, b) { return b.dataCadastroMs - a.dataCadastroMs; });
  return resultado;
}

// ── Portal: leitura ─────────────────────────────────────────────

function doGet(e) {
  var email = (e && e.parameter && e.parameter.email) || '';
  var aba = abaDeRespostas_();
  var dados = aba.getDataRange().getValues();
  var cabecalho = dados.shift();
  var lista = montarSolicitacoes(cabecalho, dados, email, formatarData_);
  return ContentService
    .createTextOutput(JSON.stringify({ solicitacoes: lista }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Gatilhos ────────────────────────────────────────────────────

/** Gatilho simples: carimba ÚLTIMA ATUALIZAÇÃO quando a manutenção edita a Solicitação. */
function onEdit(e) {
  if (!e || !e.range) return;
  var aba = e.range.getSheet();
  if (!ehAbaDeRespostas_(aba)) return;
  if (e.range.getRow() < 2) return;

  var cabecalho = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  var idx = indicesDasColunas(cabecalho);
  if (idx.atualizacao < 0) return;

  var colsAlvo = COLS_QUE_ATUALIZAM
    .map(function (k) { return idx[k] + 1; })
    .filter(function (c) { return c > 0; });
  var primeira = e.range.getColumn();
  var ultima = primeira + e.range.getNumColumns() - 1;
  var mexeu = colsAlvo.some(function (c) { return c >= primeira && c <= ultima; });
  if (!mexeu) return;

  var agora = new Date();
  var linhas = e.range.getNumRows();
  var valores = [];
  for (var i = 0; i < linhas; i++) valores.push([agora]);
  aba.getRange(e.range.getRow(), idx.atualizacao + 1, linhas, 1).setValues(valores);
}

/** Gatilho instalável (criado por "Preparar planilha"): dá o Nº à nova Solicitação. */
function aoEnviarFormulario(e) {
  var aba = (e && e.range) ? e.range.getSheet() : abaDeRespostas_();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    preencherNumeros_(aba);
  } finally {
    lock.releaseLock();
  }
}

// ── Menu ────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Portal do Motorista')
    .addItem('1. Preparar planilha (uma vez)', 'prepararPlanilha')
    .addItem('2. Finalizar Solicitações antigas (uma vez)', 'finalizarAntigas')
    .addToUi();
}

/**
 * Deixa a planilha pronta para o portal. Pode ser rodado mais de uma vez sem estragar nada.
 * - renomeia TEMPO (DIAS) → PREVISÃO DE LIBERAÇÃO
 * - cria as colunas Nº e ÚLTIMA ATUALIZAÇÃO
 * - numera as Solicitações existentes
 * - lista suspensa em SITUAÇÃO e em VEÍCULO LIBERADO
 * - destaca DATA PROGRAMADA vazia quando a Situação é Programada
 * - cria o gatilho que numera as novas respostas
 */
function prepararPlanilha() {
  var aba = abaDeRespostas_();
  var ui = SpreadsheetApp.getUi();

  renomearColuna_(aba, COL_TEMPO_ANTIGA, COL.previsao);
  garantirColuna_(aba, COL.numero);
  garantirColuna_(aba, COL.atualizacao);

  var idx = indicesDoCabecalho_(aba);
  var faltando = ['situacao', 'programada', 'previsao', 'liberado', 'observacoes']
    .filter(function (k) { return idx[k] < 0; })
    .map(function (k) { return COL[k]; });
  if (faltando.length) {
    ui.alert('Não encontrei estas colunas na planilha:\n\n' + faltando.join('\n') +
             '\n\nConfira o nome exato do cabeçalho e rode de novo.');
    return;
  }

  preencherNumeros_(aba);
  converterSituacoesAntigas_(aba, idx);

  var linhasMax = aba.getMaxRows() - 1;

  aba.getRange(2, idx.situacao + 1, linhasMax, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(SITUACOES, true)
      .setAllowInvalid(false)
      .setHelpText('Escolha uma das 6 Situações. Em branco = Recebida.')
      .build());

  aba.getRange(2, idx.liberado + 1, linhasMax, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Sim', 'Não'], true)
      .setAllowInvalid(false)
      .build());

  [idx.programada, idx.previsao, idx.conclusao].forEach(function (c) {
    if (c < 0) return;
    aba.getRange(2, c + 1, linhasMax, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
    aba.getRange(2, c + 1, linhasMax, 1).setNumberFormat('dd/mm/yyyy');
  });
  aba.getRange(2, idx.atualizacao + 1, linhasMax, 1).setNumberFormat('dd/mm/yyyy hh:mm');

  // Programada sem DATA PROGRAMADA → célula da data em vermelho.
  var letraSit = letraDaColuna_(idx.situacao + 1);
  var letraProg = letraDaColuna_(idx.programada + 1);
  var faixaProg = aba.getRange(2, idx.programada + 1, linhasMax, 1);
  var regras = aba.getConditionalFormatRules().filter(function (r) {
    return !r.getRanges().some(function (g) { return g.getA1Notation() === faixaProg.getA1Notation(); });
  });
  regras.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($' + letraSit + '2="Programada",$' + letraProg + '2="")')
    .setBackground('#f4c7c3')
    .setRanges([faixaProg])
    .build());
  aba.setConditionalFormatRules(regras);

  criarGatilhoDoFormulario_();

  ui.alert('Planilha pronta para o Portal do Motorista.');
}

/**
 * Limpeza antes do lançamento: Solicitações com SITUAÇÃO em branco e mais de 30 dias
 * viram "Finalizada". As mais recentes ficam como estão, para classificar à mão.
 */
function finalizarAntigas() {
  var ui = SpreadsheetApp.getUi();
  var aba = abaDeRespostas_();
  var idx = indicesDoCabecalho_(aba);
  var n = aba.getLastRow() - 1;
  if (n < 1) return;

  var carimbos = aba.getRange(2, idx.carimbo + 1, n, 1).getValues();
  var situacoes = aba.getRange(2, idx.situacao + 1, n, 1).getValues();
  var limite = Date.now() - DIAS_LIMPEZA * 24 * 60 * 60 * 1000;

  var alvo = 0;
  for (var i = 0; i < n; i++) {
    var c = carimbos[i][0];
    if (situacoes[i][0] === '' && ehData_(c) && c.getTime() < limite) alvo++;
  }
  if (!alvo) { ui.alert('Nenhuma Solicitação em branco com mais de ' + DIAS_LIMPEZA + ' dias.'); return; }

  var ok = ui.alert('Marcar ' + alvo + ' Solicitações antigas (mais de ' + DIAS_LIMPEZA +
                    ' dias, SITUAÇÃO em branco) como Finalizada?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;

  var novas = situacoes.map(function (s, i) {
    var c = carimbos[i][0];
    return [(s[0] === '' && ehData_(c) && c.getTime() < limite) ? 'Finalizada' : s[0]];
  });
  aba.getRange(2, idx.situacao + 1, n, 1).setValues(novas);
  ui.alert(alvo + ' Solicitações marcadas como Finalizada.');
}

// ── Auxiliares da planilha ──────────────────────────────────────

function abaDeRespostas_() {
  var abas = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < abas.length; i++) {
    if (ehAbaDeRespostas_(abas[i])) return abas[i];
  }
  throw new Error('Não encontrei a aba de respostas (coluna "' + COL.carimbo + '" e "' + COL.email + '").');
}

function ehAbaDeRespostas_(aba) {
  if (aba.getLastColumn() < 1) return false;
  var idx = indicesDoCabecalho_(aba);
  return idx.carimbo >= 0 && idx.email >= 0;
}

function indicesDoCabecalho_(aba) {
  return indicesDasColunas(aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getValues()[0]);
}

function renomearColuna_(aba, antigo, novo) {
  var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  for (var i = 0; i < cab.length; i++) {
    if (semAcento_(cab[i]) === semAcento_(antigo)) {
      aba.getRange(1, i + 1).setValue(novo);
      return;
    }
  }
}

function garantirColuna_(aba, nome) {
  var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  var existe = cab.some(function (h) { return semAcento_(h) === semAcento_(nome); });
  if (existe) return;
  var col = aba.getLastColumn() + 1;
  if (col > aba.getMaxColumns()) aba.insertColumnAfter(aba.getMaxColumns());
  aba.getRange(1, col).setValue(nome);
}

/**
 * Dá Nº às linhas sem número, continuando do maior Nº existente.
 * As linhas sem número são numeradas pela ordem do Carimbo (mais antiga primeiro),
 * mesmo que a planilha esteja ordenada de outro jeito.
 */
function preencherNumeros_(aba) {
  var idx = indicesDoCabecalho_(aba);
  if (idx.numero < 0) return;
  var n = aba.getLastRow() - 1;
  if (n < 1) return;
  var faixa = aba.getRange(2, idx.numero + 1, n, 1);
  var nums = faixa.getValues();
  var carimbos = idx.carimbo < 0 ? [] : aba.getRange(2, idx.carimbo + 1, n, 1).getValues();
  var maior = 0;
  nums.forEach(function (r) { var v = Number(r[0]); if (v > maior) maior = v; });

  var semNumero = [];
  nums.forEach(function (r, i) { if (r[0] === '' || r[0] == null) semNumero.push(i); });
  if (!semNumero.length) return;

  function ms(i) { var c = carimbos[i] && carimbos[i][0]; return ehData_(c) ? c.getTime() : 0; }
  semNumero.sort(function (a, b) { return (ms(a) - ms(b)) || (a - b); });
  semNumero.forEach(function (i) { maior++; nums[i] = [maior]; });
  faixa.setValues(nums);
}

/**
 * Troca os valores antigos de SITUAÇÃO (PENDENTE, FINALIZADO, EM ANDAMENTO…) pelos 6 oficiais.
 * Células em branco continuam em branco (= Recebida).
 */
function converterSituacoesAntigas_(aba, idx) {
  // A lista suspensa antiga (EM ANDAMENTO/FINALIZADO/PENDENTE) recusa os valores novos
  // e faria o setValues falhar. Ela é removida aqui e recriada logo depois em prepararPlanilha.
  aba.getRange(2, idx.situacao + 1, aba.getMaxRows() - 1, 1).clearDataValidations();

  var n = aba.getLastRow() - 1;
  if (n < 1) return;
  var faixa = aba.getRange(2, idx.situacao + 1, n, 1);
  var valores = faixa.getValues();
  var novos = valores.map(function (r) {
    var v = r[0];
    return [(v === '' || v == null) ? '' : normalizarSituacao(v)];
  });
  faixa.setValues(novos);
}

function criarGatilhoDoFormulario_() {
  var existe = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'aoEnviarFormulario';
  });
  if (existe) return;
  ScriptApp.newTrigger('aoEnviarFormulario')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}

function formatarData_(d) {
  return Utilities.formatDate(d, FUSO, 'dd/MM/yyyy');
}

function letraDaColuna_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
