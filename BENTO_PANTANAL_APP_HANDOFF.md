# Bento Pantanal — especificação e continuidade do aplicativo

Data: 30/09/2026, horário de Cuiabá.
Responsável pelo projeto: Gui / Bento.Host.
Repositório do aplicativo: https://github.com/GuiBRA985/Avistamentos
Site de integração: https://pantanal.bento.host

## Instrução para a nova conversa

Quero continuar a criação de um aplicativo Android real para registrar avistamentos offline e sincronizar com a Rede de Guias do Pantanal.Bento. Use este documento como requisitos definidos. Inspecione o código atual do repositório antes de modificar: ele pode ter evoluído. Não comece do zero sem necessidade. Entregue código executável, instruções claras para VS Code no Windows e caminho para gerar APK. Diferencie funcionalidades implementadas de demonstrações e integrações pendentes. Não invente login, upload, IA ou sincronização funcionando.

## 1. Objetivo

O guia registra animais em locais do Pantanal sem internet. O app guarda foto, descrição por voz ou texto, data, hora e posição do celular. Quando encontra rede, autentica-se na Rede de Guias e envia os registros. Eles ficam vinculados ao guia e alimentam seu mapa pessoal no site.

O caso inicial envolve passeios dentro da propriedade da Pousada Araras. A estrutura deve permitir registros do mesmo guia em outras propriedades, cidades e expedições. Não assumir que todo registro é de Porto Jofre ou que todos os limites da Araras são conhecidos.

## 2. Decisões obrigatórias do app

- Android nativo com funcionamento offline; não substituir por uma página web/PWA como entrega principal.
- A coleta NÃO exige login nem internet.
- Fluxo: abrir → fotografar → capturar GPS → digitar o animal ou gravar descrição → salvar localmente.
- Voz offline deve ser preservada como áudio. Não depender de reconhecimento de voz online para salvar.
- Português e inglês, com seletor e preferência persistente no aparelho.
- Preservar observações e áudio no idioma original; traduzir a interface e os nomes do catálogo de espécies.
- Botão “Sincronizar com Bento” no FIM da lista de registros.
- Login da Rede de Guias obrigatório na sincronização, não na coleta.
- Cada registro sincronizado pertence à conta autenticada do guia.
- Não apagar fotos/áudios locais automaticamente após o envio. Uma futura limpeza deve ser explícita e limitada a arquivos com recebimento confirmado.

## 3. Registro de avistamento

Dados essenciais:

- UUID local único.
- Foto original; a base atual usa uma foto por registro.
- Espécie informada pelo guia, digitada ou escolhida em lista offline.
- Áudio opcional de identificação/descrição.
- Observação textual opcional, quantidade e comportamento quando informados.
- Data/hora de captura.
- Latitude, longitude, precisão e horário da posição GPS.
- Status local de sincronização.
- Guia proprietário após autenticação/envio.
- Expedição/local quando houver associação válida.

GPS registra o telefone, não a posição exata do animal. Sem sinal GPS, permitir nova tentativa e salvar sem coordenadas mediante aviso; não inventar posição. Um registro sem coordenadas continua na lista, mas não gera marcador. GPS pode funcionar sem internet, mas pode demorar ou falhar.

Fotos e áudio precisam ser copiados da área temporária para armazenamento persistente. Metadados devem sobreviver ao fechamento e reinício. Prever falhas de espaço e permissões sem perder registros já salvos.

## 4. Sincronização, identidade e segurança

A sincronização oficial é somente com o servidor Bento. O código é aberto, então terceiros poderão modificá-lo para usar servidores próprios; isso não deve dar acesso ao servidor Bento.

- Identidade e permissões verificadas no servidor, nunca somente por botões no app.
- Não confiar em guideId arbitrário enviado pelo cliente; resolver pela autenticação real.
- Reusar a base de usuários da Rede de Guias, após inspecionar a implementação atual do Pantanal.Bento.
- Estar logado no navegador não torna o app automaticamente autenticado: implementar a ponte de autenticação adequada.
- Antes do envio, mostrar a conta e confirmar autoria dos registros selecionados, especialmente em aparelho compartilhado.
- Vincular o lote/registro à conta ao iniciar envio; impedir atribuição a outra conta em novas tentativas.
- UUID e política de idempotência para impedir duplicação após falhas.
- Upload retomável ou tentativas seguras; manter estado por registro e mídia.
- Marcar como sincronizado somente após confirmação durável do registro e de todas as mídias pelo servidor.
- Não incluir chave administrativa, senha ou credencial da IA no APK/repositório.
- Guardar tokens com armazenamento seguro quando a autenticação for implementada.

## 5. IA e revisão

Desejo que a IA analise a foto depois da sincronização e confira a identificação informada pelo guia. Áudio pode ser transcrito no servidor.

Preservar separadamente:

- Identificação original do guia e mídia original.
- Transcrição.
- Espécie sugerida pela IA e nome científico quando identificável.
- Resultado da comparação e estado de revisão.
- Modelo/versão e informações de análise relevantes.

IA não garante identificação correta. Imagem insuficiente ou divergência deve ir para revisão humana. Não substituir silenciosamente a identificação original nem inventar percentuais de confiança. Custos e limites de IA ainda precisam ser definidos.

## 6. Mapa pessoal e página comercial dos guias

Cada guia VIP terá uma página funcional para vender suas próprias expedições, vinculada ao seu perfil. Guias iniciais: Tchaco Pantaneiro e Jhimy Petit Noel.

O botão atual “Avistamentos — em breve” deverá abrir o mapa do respectivo guia. Quando funcional, usar “Avistamentos”. Registros de demonstração precisam ser claramente identificados.

A página/mapa do guia terá acesso a:

1. **Traslados**: cidades atendidas cadastradas pelo guia.
2. **Avistamentos**: mapa pessoal alimentado pelo aplicativo.
3. **Expedições próprias**: ofertas, roteiros e informações do guia.
4. **Pedir orçamento**: etapa final vinculada ao guia e ao serviço escolhido.

Visitantes consultam registros publicados; o guia autenticado administra seus dados. Filtros por espécie e período são desejados. O servidor recebe o upload e o mapa consulta os dados: abrir o mapa não transfere sozinho as mídias do celular.

Definir política de visibilidade de coordenadas privadas/públicas antes de publicar posições precisas de fauna sensível. Mapa offline no aplicativo ainda não foi implementado e exige provedor/licença apropriados; não prometer que mapa online funcionará sem rede.

## 7. Regra definitiva dos traslados

- Origem padrão SEMPRE: Aeroporto de Várzea Grande (VG).
- O guia escolhe/cadastra as cidades que atende.
- Destino padrão: rodoviária da cidade escolhida pelo visitante.
- O guia encontrará o hóspede nessa rodoviária.
- Mudanças extraordinárias no traslado são negociadas diretamente.
- Hospedagem e escolha de pousada são combinadas entre guia e hóspede; não presumir hotel como destino do traslado padrão.
- Confirmar aeroportos/rodoviárias e coordenadas reais ao implementar rotas; não inventar pontos.

## 8. Modelo comercial do Pantanal.Bento

O site terá duas frentes:

- Pacotes próprios do Pantanal.Bento à venda.
- Expedições próprias dos guias VIP vendidas por suas páginas, com comissão para Bento.

O guia é cliente da plataforma. O viajante/hóspede é cliente do guia. Mostrar claramente quem organiza e conduz cada oferta.

Desejo receber comissão das vendas dos guias. Percentual ou valor fixo, cobrança, pagamento, cancelamento e momento da comissão AINDA NÃO foram definidos. Não inventar essas regras.

Para controlar comissão, registrar pedidos e vendas vinculados ao guia e serviço. Conversa no WhatsApp pode complementar o fluxo, mas um link isolado não comprova fechamento nem controla comissão.

Formulário de orçamento sugerido (a validar na implementação): guia e serviço já selecionados, cidade/destino ou expedição, data, número de pessoas e contato. Não exigir escolha de pousada para traslado padrão.

## 9. Código aberto e distribuição

Quero código aberto: qualquer pessoa pode copiar e adaptar o aplicativo, inclusive mudar a sincronização para servidor próprio. Escolher e adicionar uma licença apropriada explicitamente; repositório público sozinho não define todos os direitos de reutilização.

Intenção de vender o app pronto por R$ 3 na Google Play. Preço é intenção comercial, não publicação realizada. Não basear viabilidade em suposto bônus de primeira compra do Google: a promoção não foi verificada. Não presumir que compra única de R$ 3 financie IA ilimitada.

AAB para futura Google Play; APK instalável para testes. Identidade visual e associação oficial com Bento precisam ficar claras em relação a versões de terceiros.

## 10. Estado conhecido da base

Base entregue e publicada em https://github.com/GuiBRA985/Avistamentos.

Tecnologia na versão inicialmente inspecionada:

- React Native 0.81.5 / React 19.1 / Expo SDK 54.
- TypeScript.
- expo-sqlite, expo-image-picker, expo-location, expo-audio.
- expo-file-system/legacy para cópia persistente das mídias.
- expo-sharing para exportação de backup JSON com mídia Base64.
- Preferência PT/EN no SQLite.
- `eas.json`: perfil preview gera APK; production gera AAB.

Arquivos principais: `App.tsx`, `src/storage.ts`, `index.ts`, `package.json`, `app.json`, `eas.json`, `tsconfig.json`, `README.md`, `VALIDACAO.md`. O repositório tem pasta `doc`; verificar caminhos atuais da documentação. A publicação inicial não incluía arquivo LICENSE nem .gitignore na raiz.

Implementado no código-base:

- Telas Registrar e Registros.
- Foto, tentativa GPS, espécie/texto e áudio.
- Cópia persistente de mídia e SQLite.
- Lista de registros pendentes e backup exportável.
- Interface PT/EN.
- Botão de sincronização ao fim da lista, abrindo tela informativa.

NÃO implementado nessa base:

- Autenticação da Rede de Guias.
- Upload/sincronização real.
- IA e revisão humana.
- Mapa real do guia.
- Venda, orçamento e comissão.
- Download de mapas offline.
- Importação de backup.
- Persistência de rascunhos não salvos.

Validação já realizada: sintaxe TS/TSX e JSON, consultas SQLite e preferência de idioma. Não houve validação completa de tipos, compilação Android, APK gerado ou teste físico confirmado. A demonstração mostrada em conversa era uma interface web simulada, não execução do aplicativo real. Não confundir prévia com funções concluídas.

A conexão GitHub consultada anteriormente reportou leitura/escrita no repositório Avistamentos. Verificar disponibilidade e autorização atuais; não assumir acesso a Pantanal ou outros repositórios. Se necessário, trabalhar via arquivos/ZIP como o usuário já aceitou.

## 11. Ambiente do Gui e início dos testes

Windows, VS Code e celular Android. Node.js foi instalado: `npm.cmd` passou a executar. O último problema relatado foi executar instalação na pasta `C:\Users\guiba`, sem `package.json`. Orientação: abrir a pasta real Avistamentos no VS Code antes dos comandos.

```powershell
# Dentro da pasta que contém package.json:
dir package.json
npm.cmd install
npx.cmd expo install --fix
npm.cmd run typecheck
npx.cmd expo start
```

Executar um comando por vez e resolver o primeiro erro antes de continuar. Expo Go precisa de versão compatível com SDK 54 para testar; não é APK autônomo. Confirmar documentação/versionamento atuais antes de orientar instalação.

Para gerar APK por EAS, após validar o projeto:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build:configure
npx.cmd eas-cli@latest build --platform android --profile preview
```

A conta Expo deve ser do usuário. Compilação depende de internet e condições do serviço. Para comprovar uso offline, instalar APK, ativar modo avião com localização ligada, registrar, salvar, fechar/reabrir e reiniciar aparelho verificando foto/áudio/dados.

## 12. Sequência sugerida de trabalho

1. Inspecionar repositório e corrigir instalação, tipos e compilação.
2. Validar foto, áudio, GPS, persistência e idiomas no Android real.
3. Gerar APK de teste offline.
4. Preparar demonstração web separada se desejada, com dados de exemplo identificados.
5. Inspecionar o Pantanal.Bento atual e integrar autenticação, propriedade e upload seguro.
6. Implementar mapa pessoal e botões nos perfis dos guias.
7. Implementar cidades/traslados aeroporto → rodoviária.
8. Integrar IA/revisão preservando originais.
9. Implementar ofertas/orçamentos e definir comissão antes de cobrança.
10. Preparar licença, distribuição e publicação comercial.

Continuar de forma incremental. A prioridade é uma caderneta confiável no campo; depois conectar ao mapa e à operação comercial.
