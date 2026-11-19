# Portal do Motorista: como colocar no ar

O portal tem duas partes:

- **`apps-script/Code.gs`**: um script que fica **dentro da planilha de respostas** do Forms. Ele prepara a planilha, numera as Solicitações, carimba a Última Atualização e entrega ao portal as Solicitações de cada e-mail.
- **`index.html`**: a página que o Motorista abre, publicada no Netlify.

Os termos usados aqui (Situação, Solicitação, Observações…) estão definidos em [CONTEXT.md](CONTEXT.md).

---

## 1. Instalar o script na planilha (uma vez)

1. Abra a **planilha de respostas** do formulário de Solicitações de Serviço.
2. Menu **Extensões → Apps Script**.
3. Apague tudo o que estiver no arquivo `Código.gs` e cole o conteúdo inteiro de [`apps-script/Code.gs`](apps-script/Code.gs). Não cole o `Code.test.js`: ele só serve para testar no computador.
4. Clique em **Salvar** (ícone de disquete).
5. Volte para a planilha e **recarregue a página** (F5). Aparece o menu **Portal do Motorista**.

## 2. Preparar a planilha (uma vez)

1. Menu **Portal do Motorista → 1. Preparar planilha**.
2. O Google pede autorização na primeira vez: escolha sua conta, depois **Avançado → Acessar (não seguro)** e **Permitir**. O aviso aparece porque o script é seu e não foi publicado na loja.

Isso faz o seguinte:

- renomeia **TEMPO (DIAS)** para **PREVISÃO DE LIBERAÇÃO** (agora é uma data);
- cria as colunas **Nº** e **ÚLTIMA ATUALIZAÇÃO** no fim da planilha e numera as Solicitações existentes;
- converte os valores antigos de **SITUAÇÃO**: PENDENTE → Recebida, EM ANDAMENTO → Em andamento, FINALIZADO → Finalizada;
- põe lista suspensa em **SITUAÇÃO** (Recebida, Programada, Em andamento, Aguardando peça, Finalizada, Cancelada) e em **VEÍCULO LIBERADO** (Sim/Não);
- deixa a **DATA PROGRAMADA** vermelha quando a Situação é Programada e a data está vazia;
- passa a dar Nº automaticamente a cada nova resposta do Forms.

Pode rodar de novo sem problema: nada é duplicado.

## 3. Limpar as Solicitações antigas (uma vez, antes de divulgar)

1. Menu **Portal do Motorista → 2. Finalizar Solicitações antigas**.
2. Confirme. Toda Solicitação com **SITUAÇÃO em branco e mais de 30 dias** vira **Finalizada**.
3. As dos últimos 30 dias continuam em branco (aparecem como **Recebida**). Classifique essas à mão antes de divulgar o link.

## 4. Publicar o script como app da Web

1. No Apps Script, clique em **Implantar → Nova implantação**.
2. Em "Selecionar tipo" (engrenagem), escolha **App da Web**.
3. **Executar como:** Eu. **Quem pode acessar:** Qualquer pessoa.
4. Clique em **Implantar** e **copie o URL do app da Web** (termina em `/exec`).
5. No [`index.html`](index.html), troque o endereço na linha do `API_URL`:
   ```js
   const API_URL = "https://script.google.com/macros/s/COLE_AQUI_O_ID_DA_IMPLANTACAO/exec";
   ```
   pelo URL copiado.

> Se você alterar o `Code.gs` depois, use **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão**. Assim o URL continua o mesmo e o `index.html` não precisa mudar.

## 5. Publicar o portal no Netlify

1. Envie as alterações para o GitHub (`tropicaltransportes/portal-motoristas`).
2. No Netlify: **Add new site → Import an existing project → GitHub** e escolha `portal-motoristas`.
3. **Build command:** deixe vazio. **Publish directory:** `.` (ponto).
4. **Deploy**. Depois, em **Site configuration → Change site name**, dê um nome fácil, por exemplo `portal-motorista-tropical`.
5. Abra o site, digite um e-mail que já respondeu o formulário e confira se as Solicitações aparecem.

É um site **separado** do site de gestão, para que um link errado nunca mostre a planilha inteira.

## 6. Divulgar o link

- **Taplink**: adicione um botão "Acompanhar minha solicitação" com o link do Netlify.
- **Forms**: em **Configurações → Apresentação → Mensagem de confirmação**, escreva algo como
  *"Recebemos sua solicitação! Acompanhe a situação em: <link do portal>. Use o mesmo e-mail deste formulário."*

## 7. Rotina diária da manutenção

Todo dia, o Responsável pela Situação passa por todas as Solicitações abertas e atualiza:

| Coluna | Quando preencher |
|---|---|
| **SITUAÇÃO** | Sempre que a etapa mudar |
| **DATA PROGRAMADA** | Ao marcar Programada (obrigatória, fica vermelha se faltar) |
| **PREVISÃO DE LIBERAÇÃO** | Quando houver uma data prevista para devolver o veículo |
| **TÉCNICO RESPONSÁVEL** | Quando alguém assumir o serviço |
| **OBSERVAÇÕES** | Recado **para o Motorista**: ele lê exatamente o que estiver escrito. Não use para anotação interna. |
| **VEÍCULO LIBERADO** | Sim quando o veículo puder rodar, mesmo com a Solicitação ainda aberta |
| **DATA CONCLUSÃO** | Ao marcar Finalizada |

**ÚLTIMA ATUALIZAÇÃO** é preenchida sozinha quando qualquer uma dessas colunas muda. Ordenar por ela, da mais antiga para a mais nova, mostra quais Solicitações estão esquecidas.

**Não precisa** mexer em **Nº** nem em **ÚLTIMA ATUALIZAÇÃO**. **PRIORIDADE** continua sendo só de uso interno e o Motorista nunca a vê.

---

## O que o Motorista vê

- Entra só com o e-mail que usou no formulário (maiúsculas e espaços não importam). O celular **lembra o e-mail**; o botão **Trocar e-mail** esquece.
- Abas no topo para **filtrar por veículo** (Números de Frota das Solicitações daquele e-mail), com a quantidade de abertas em cada uma. Só aparecem quando há mais de um veículo.
- Por padrão: Solicitações **abertas** (a atualizada mais recentemente primeiro) e, recolhidas embaixo, as **Finalizadas/Canceladas dos últimos 30 dias**.
- Botão **Ver histórico completo** para ver todas.
- Em cada Solicitação: a **Situação em letra grande**, frota, Nº, previsão de liberação, Veículo liberado, o que foi relatado e o **trilho de etapas** Recebida → Programada → Em andamento → Finalizada. O **recado da manutenção** aparece dentro da etapa atual. "Aguardando peça" ocupa o lugar de "Em andamento" no trilho.

## Testar o script no computador

```powershell
node apps-script/Code.test.js
```
