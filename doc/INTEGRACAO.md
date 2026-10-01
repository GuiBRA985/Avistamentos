# Ponte futura com a Rede de Guias

Nenhum endpoint foi implementado ou presumido. Precisaremos dos arquivos atuais do Pantanal.Bento para encaixar a autenticação real e o mapa do perfil.

1. O guia seleciona registros pendentes antes de autenticar. Confirmar expressamente a autoria daquele lote, especialmente em celular compartilhado.
2. Login no serviço da Rede de Guias. O servidor deve resolver a identidade pela sessão, nunca confiar em um guideId arbitrário enviado pelo cliente. Guardar tokens em armazenamento seguro, não SQLite sem proteção.
3. Enviar UUID local, data/hora de captura, posição e horário do GPS, precisão, espécie informada, observação e mídias originais. UUID + conta fornece idempotência; ao começar um envio, vincular o registro àquela conta e impedir atribuição a outra conta em tentativas posteriores.
4. Enviar arquivos em etapas retomáveis. Somente marcar como sincronizado quando o servidor confirmar registro e todas as mídias duráveis. Falha não apaga dados; novas tentativas não duplicam pontos.
5. IA de fotografia/transcrição roda no servidor. Preservar espécie informada e áudio; guardar identificação sugerida, modelo, versão e resultado separado. Concordância pode ser marcada como sugestão corroborada, jamais certeza absoluta; divergência ou imagem insuficiente exige revisão humana. Não inventar porcentagens de confiança.
6. Publicar no mapa pessoal do guia com filtros por espécie e período. Registros sem posição permanecem na lista, sem marcador. Coordenadas públicas e privadas devem ter políticas próprias.

Mapa offline, trilhas, perímetro Araras, servidor, login, IA, importação de backup e publicação no site não fazem parte desta base. Uma imagem de mapa online não é mapa offline; a próxima etapa precisará escolher provedor com licença de download offline.
