# Portal do Motorista

Onde o Motorista acompanha em que pé estão as Solicitações de Serviço que abriu para a manutenção da Tropical Transportes.

## Language

### Pessoas

**Motorista**:
Quem dirige um veículo da frota e abre Solicitações de Serviço. É identificado pelo e-mail informado no formulário.
_Avoid_: Usuário, cliente, solicitante

**Responsável pela Situação**:
A única pessoa da manutenção que atualiza a Situação das Solicitações, numa rodada diária.
_Avoid_: Mecânico, técnico (o técnico executa, mas não atualiza a Situação)

**Técnico Responsável**:
Quem executa a Solicitação de Serviço.
_Avoid_: Mecânico

### Solicitação

**Solicitação de Serviço**:
Um pedido de manutenção de um veículo, aberto por um Motorista. Pode conter vários Itens, mas tem uma única Situação.
_Avoid_: Pedido, chamado, OS, ticket

**Nº da Solicitação**:
O número fixo que identifica uma Solicitação de Serviço e nunca muda.
_Avoid_: Linha, ID, protocolo

**Item**:
Um problema relatado dentro de uma Solicitação de Serviço (ex.: "troca de pneu", "barulho no freio"). Não tem Situação própria.
_Avoid_: Serviço, tarefa

**Número de Frota**:
O número que identifica o veículo da Solicitação.
_Avoid_: Prefixo, carro

**Observações**:
O recado da manutenção escrito diretamente para o Motorista sobre a sua Solicitação. É um recado só, substituído a cada atualização.
_Avoid_: Resposta, comentário, nota

**Veículo Liberado**:
Indica que o veículo pode voltar a rodar. É independente da Situação: um veículo pode ser liberado com a Solicitação ainda aberta.

**Previsão de Liberação**:
A data em que a manutenção espera liberar o veículo.
_Avoid_: Tempo (dias), prazo estimado

**Data Programada**:
A data marcada para executar a Solicitação. Toda Solicitação Programada tem uma.

**Última Atualização**:
A data em que a Situação, a Data Programada ou as Observações da Solicitação mudaram pela última vez.

**Prioridade**:
A urgência que a manutenção atribui à Solicitação. Uso interno; o Motorista não vê.

### Situação

**Situação**:
A etapa em que a Solicitação de Serviço está. Só um valor por vez, entre: Recebida, Programada, Em andamento, Aguardando peça, Finalizada, Cancelada.
_Avoid_: Status, estado

**Recebida**:
A Solicitação chegou e ainda não foi analisada. É a Situação de toda Solicitação que ninguém classificou.

**Programada**:
A Solicitação tem Data Programada definida e ainda não começou.

**Em andamento**:
A execução da Solicitação começou.

**Aguardando peça**:
A execução está parada esperando peça ou material.
_Avoid_: Pendente

**Finalizada**:
Todos os Itens da Solicitação foram concluídos.
_Avoid_: Concluída, Concluído, Fechada

**Cancelada**:
A Solicitação não será executada (duplicada, improcedente ou resolvida de outra forma).
_Avoid_: Recusada

**Solicitação Aberta**:
Uma Solicitação cuja Situação não é Finalizada nem Cancelada.
