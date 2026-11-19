// Testa a lógica pura do Code.gs fora do Google.  Rodar com:  node apps-script/Code.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);
const { normalizarSituacao, montarSolicitacoes, indicesDasColunas } = ctx;

const fmt = d => d.toISOString().slice(0, 10).split('-').reverse().join('/');

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   ' + nome); }
  catch (e) { falhas++; console.log('FALHA ' + nome + '\n     ' + e.message); }
}

// Cabeçalho real da planilha (com TEMPO já renomeado e as 2 colunas novas).
const CAB = ['Carimbo de data/hora', 'NOME E SOBRENOME DO SOLICITANTE:', 'NÚMERO DE FROTA:', 'ODÔMETRO ATUAL:',
  'DESCREVA ABAIXO OS PROBLEMAS ENCONTRADOS:', 'Endereço de e-mail', 'SITUAÇÃO', 'PREVISÃO DE LIBERAÇÃO',
  'PRIORIDADE', 'DATA PROGRAMADA', 'DATA CONCLUSÃO', 'VEÍCULO LIBERADO', 'TÉCNICO RESPONSÁVEL', 'OBSERVAÇÕES',
  'Nº', 'ÚLTIMA ATUALIZAÇÃO'];

function linha(o) {
  return [o.carimbo || new Date('2026-11-01T10:00:00Z'), o.nome || 'João Silva', o.frota || '123', o.odo || '100000',
    o.problema || 'Freio', o.email || 'joao@x.com', o.situacao || '', o.previsao || '', o.prioridade || 'Alta',
    o.programada || '', o.conclusao || '', o.liberado || '', o.tecnico || '', o.obs || '', o.numero || '',
    o.atualizacao || ''];
}

teste('situação em branco vira Recebida', () => {
  assert.strictEqual(normalizarSituacao(''), 'Recebida');
  assert.strictEqual(normalizarSituacao(null), 'Recebida');
});

teste('situações canônicas e variações antigas', () => {
  const casos = {
    'Programada': 'Programada', 'PROGRAMADO': 'Programada', 'Em andamento': 'Em andamento',
    'andamento': 'Em andamento', 'Aguardando peça': 'Aguardando peça', 'PENDENTE': 'Recebida', 'EM ANDAMENTO': 'Em andamento',
    'FINALIZADO': 'Finalizada',
    'Finalizada': 'Finalizada', 'Concluído': 'Finalizada', 'Cancelada': 'Cancelada', 'Recusada': 'Cancelada',
    'qualquer coisa': 'Recebida'
  };
  for (const [entrada, esperado] of Object.entries(casos)) {
    assert.strictEqual(normalizarSituacao(entrada), esperado, entrada);
  }
});

teste('acha as colunas pelo nome, mesmo fora de ordem', () => {
  const embaralhado = [...CAB].reverse();
  const idx = indicesDasColunas(embaralhado);
  assert.strictEqual(embaralhado[idx.email], 'Endereço de e-mail');
  assert.strictEqual(embaralhado[idx.situacao], 'SITUAÇÃO');
  assert.strictEqual(embaralhado[idx.numero], 'Nº');
});

teste('só devolve as Solicitações do e-mail pedido, ignorando maiúsculas e espaços', () => {
  const linhas = [linha({ email: 'joao@x.com' }), linha({ email: 'maria@x.com' }), linha({ email: ' JOAO@x.com ' })];
  const r = montarSolicitacoes(CAB, linhas, 'Joao@X.com', fmt);
  assert.strictEqual(r.length, 2);
});

teste('e-mail vazio não devolve nada', () => {
  assert.strictEqual(montarSolicitacoes(CAB, [linha({ email: '' })], '', fmt).length, 0);
});

teste('nunca devolve a prioridade', () => {
  const r = montarSolicitacoes(CAB, [linha({})], 'joao@x.com', fmt);
  assert.ok(!('prioridade' in r[0]));
  assert.ok(!JSON.stringify(r).includes('Alta'));
});

teste('mais recentes primeiro', () => {
  const r = montarSolicitacoes(CAB, [
    linha({ carimbo: new Date('2026-10-01T00:00:00Z'), numero: 1 }),
    linha({ carimbo: new Date('2026-11-10T00:00:00Z'), numero: 2 })
  ], 'joao@x.com', fmt);
  assert.strictEqual(JSON.stringify(r.map(s => s.numero)), '["2","1"]');
});

teste('datas formatadas, liberado em Sim/Não e Nº', () => {
  const r = montarSolicitacoes(CAB, [linha({
    programada: new Date('2026-11-20T12:00:00Z'), previsao: new Date('2026-11-22T12:00:00Z'),
    liberado: 'Sim', numero: 42, obs: 'João, a peça chega quinta.'
  })], 'joao@x.com', fmt)[0];
  assert.strictEqual(r.dataProgramada, '20/11/2026');
  assert.strictEqual(r.previsaoLiberacao, '22/11/2026');
  assert.strictEqual(r.veiculoLiberado, true);
  assert.strictEqual(r.numero, '42');
  assert.strictEqual(r.observacoes, 'João, a peça chega quinta.');
});

teste('sem Nº ainda: usa o número da linha', () => {
  const r = montarSolicitacoes(CAB, [linha({}), linha({})], 'joao@x.com', fmt);
  assert.strictEqual(JSON.stringify(r.map(s => s.numero).sort()), '["2","3"]');
});

teste('liberado "Não" ou vazio é falso', () => {
  const r = montarSolicitacoes(CAB, [linha({ liberado: 'Não' }), linha({})], 'joao@x.com', fmt);
  assert.ok(r.every(s => s.veiculoLiberado === false));
});

process.exitCode = falhas ? 1 : 0;
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
