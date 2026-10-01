# Bento Pantanal — base Android 0.1

App React Native + Expo SDK 54. Coleta sem login e sem servidor: câmera, GPS, espécie digitada ou descrição gravada, SQLite e mídia em armazenamento persistente do app. Não é uma página web.

## Abrir no Windows / VS Code
1. Instale Node.js LTS (22 ou 24) em https://nodejs.org e VS Code em https://code.visualstudio.com.
2. Extraia este ZIP e abra a pasta `bento-pantanal-app` no VS Code.
3. Abra Terminal → Novo Terminal e execute:

```powershell
npm install
npx expo install --fix
npm run typecheck
npx expo start
```

As versões são da linha SDK 54; não atualize só React Native ou só Expo isoladamente. `expo install --fix` alinha os módulos ao SDK instalado. O primeiro download requer internet.

## Testar no celular
Para teste rápido, use uma versão do Expo Go compatível com SDK 54, disponível em https://expo.dev/go (Android). Conecte computador e celular à mesma rede, inicie Expo e abra o QR code. Expo Go depende do ambiente de desenvolvimento para carregar o app: ele não é o APK final e não serve para validar abertura offline independente.

## Gerar o APK que funciona sozinho
Compilação em nuvem evita instalar emulador no seu computador:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Crie sua conta Expo se necessário. O EAS vinculará o projeto à sua conta; preserve `eas.json` com o perfil `preview` / `buildType: apk`. A compilação requer internet e pode ter fila ou limites do plano Expo. Baixe o APK pelo endereço apresentado, instale no Android autorizando a instalação dessa fonte e abra. O JavaScript é incluído no APK; o computador não precisa ficar ligado.

Alternativa local: Android Studio + SDK Android + JDK compatível e `npx expo run:android`. Para a primeira instalação, prefira o APK preview.

## Teste real em modo avião (no APK)
1. Abra o app e autorize câmera, microfone e localização.
2. Ative modo avião e mantenha a localização do celular ligada.
3. Fotografe, selecione/digite o animal ou grave a voz e pare a gravação.
4. Confira as coordenadas e precisão; salve.
5. Feche completamente o app, abra e confira foto, áudio e dados em Registros.
6. Reinicie o celular e confira novamente.
7. Tente GPS com permissão negada: deve oferecer salvar explicitamente sem coordenadas.
8. Exporte backup e guarde o JSON em outro lugar. Ele contém mídia em Base64 e coordenadas; não há importação no app nesta versão, mas o formato é recuperável por software.

GPS pode funcionar sem internet, mas em mata fechada/primeira posição pode demorar ou falhar. Há limite de 25 segundos e nova tentativa manual. GPS registra a posição do telefone, não a posição exata do animal fotografado. Nova tentativa registra horário próprio da posição. Não inventamos coordenadas nem reutilizamos uma posição antiga sem identificação.

Foto é copiada da área temporária para documentos do app ao salvar; SQLite só recebe o registro após a cópia da mídia. Não há exclusão automática, sincronização falsa nem resultado IA simulado. Uma foto por registro, áudio opcional, captura em primeiro plano. O usuário deve salvar antes de encerrar: rascunhos não sobrevivem a encerramento do processo. Limpar dados/desinstalar perde arquivos locais. A foto permanece no sandbox do app, não é salva automaticamente na galeria.

## Arquivos
- `App.tsx`: telas Registrar, Registros e Enviar.
- `src/storage.ts`: SQLite, cópia persistente da mídia, backup.
- `app.json`: nome, identificador Android e permissões.
- `eas.json`: APK para teste e AAB para futura Google Play.
- `docs/INTEGRACAO.md`: contrato proposto para próxima etapa.

## Estado da entrega
Base de código, não APK compilado. Não há credenciais ou banco remoto configurado. A instalação/compilação e as funções de câmera, áudio, GPS e persistência precisam ser validadas no aparelho físico. Consulte `VALIDACAO.md` para o que foi verificado neste ambiente.

Documentação oficial consultada: https://docs.expo.dev/versions/v54.0.0/sdk/audio/ ; https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/ ; https://docs.expo.dev/versions/v54.0.0/sdk/filesystem-legacy/ ; https://docs.expo.dev/build-reference/apk/ .

## Português / English
Use o seletor no cabeçalho. A preferência é salva no SQLite e funciona offline. Telas, botões, mensagens e nomes da lista de espécies possuem tradução. Textos e áudios registrados pelo guia são preservados no idioma original. Diálogos de permissão do Android seguem o idioma do sistema.

O acesso “Sincronizar com Bento” fica no fim da lista de registros. Nesta base ele abre a etapa de integração, sem autenticação ou envio implementados.
