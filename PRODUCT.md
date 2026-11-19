# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Motorista** da Tropical Transportes: quem dirige um veículo da frota e abre Solicitações de Serviço para a manutenção pelo Google Forms. Usa o portal no **celular**, muitas vezes **na rua e no sol**, com **internet fraca** e **pouca familiaridade com apps**. Costuma chegar pelo link da mensagem de confirmação do Forms ou pelo Taplink, logo depois de abrir uma Solicitação.

O trabalho dele no portal: saber em que pé está cada Solicitação, ler o recado da manutenção e saber se o veículo já pode rodar.

## Product Purpose

Mostrar ao Motorista a Situação das Solicitações de Serviço que ele abriu, sem que ele precise ligar ou perguntar para a manutenção. Sucesso é o Motorista entender em poucos segundos: qual é a Situação, se há recado para ele, se o Veículo está Liberado e quando é a Previsão de Liberação.

## Operating Context

- O Responsável pela Situação atualiza a planilha numa rodada diária. O portal reflete a planilha; não há tempo real.
- O Motorista entra só com o e-mail usado no formulário, sem senha. Quem souber o e-mail de outro vê as Solicitações dele (risco aceito).
- Um Motorista pode rodar com qualquer veículo da frota. Os veículos que aparecem para ele são os Números de Frota das Solicitações que o e-mail dele abriu, e esse número varia de um a vários.

## Capabilities and Constraints

- Arquivo único `index.html` (CSS e JS inline, logo em base64), publicado no Netlify a partir da `main`, sem build.
- Dados vêm do Apps Script (`apps-script/Code.gs`) como `{ solicitacoes: [...] }`. Campos: `numero, nome, frota, odometro, problema, situacao, dataCadastro(+Ms), dataProgramada, previsaoLiberacao, dataConclusao(+Ms), veiculoLiberado, tecnico, observacoes, ultimaAtualizacao(+Ms)`.
- Todo texto vindo da planilha é controlado por quem responde o formulário e deve passar por `esc()`.
- Termos do domínio estão em `CONTEXT.md` e valem na interface: Solicitação, Situação (nunca "status"), Observações (o recado ao Motorista), Veículo Liberado, Previsão de Liberação, Nº, Número de Frota.
- Seis Situações: Recebida, Programada, Em andamento, Aguardando peça, Finalizada, Cancelada. Uma Solicitação tem uma única Situação, mesmo com vários Itens.
- Veículo Liberado é independente da Situação.
- A Prioridade é interna e nunca aparece.
- Padrão de exibição: Solicitações abertas e as fechadas há até 30 dias, com acesso ao histórico completo.

## Brand Commitments

- Logo da Tropical Transportes e as cores da marca (verde e navy) são obrigatórios.
- Idioma: português do Brasil, em **tom formal e direto**: sem gírias nem expressões coloquiais ("em que pé está", "pode rodar", "não deu"). Use frases claras e curtas, como "Acompanhe suas Solicitações de Serviço" e "Veículo liberado para uso".

## Product Principles

1. A Situação e o recado vêm antes de qualquer outro dado.
2. Legível no sol, com uma mão, por quem não é íntimo de apps: pouco para decidir, alvos grandes, texto direto.
3. Leve e honesto com a conexão: carregar rápido e sempre dizer o que está acontecendo.
4. Usar as palavras do domínio, iguais às da planilha e da manutenção.
5. Nunca mostrar o que é interno da manutenção.

## Accessibility & Inclusion

Contraste alto para uso ao ar livre; texto e alvos de toque generosos; não depender só de cor para indicar a Situação.
