# Configurar Google e anúncios para os testes

## O que esta branch entrega

- Android: plugin Google Sign-In e autorização restrita a `drive.appdata`.
- Backup manual de moedas e dos níveis FINGO/BINGO/SPINGO no Drive da conta selecionada.
- Não salva cartela, bolas, poderes ou partida em andamento.
- Cada salvamento cria uma cópia; a restauração oferece a cópia mais recente e exige confirmação na Home. Não há mescla ou sincronização automática entre aparelhos.
- Desconectar não apaga progresso local nem backups. Tokens ficam apenas na memória; após fechar o app ou expirar a sessão, entre novamente.
- Os backups ficam na pasta privada do app, não na lista normal de arquivos do Drive. As cópias anteriores são mantidas; a interface oferece somente a mais recente.
- Fireball, Magic e continuação usam anúncio recompensado. Fechar sem concluir, falha de rede ou consentimento indisponível não concede prêmio.
- O navegador mantém o jogo local e deixa login/ads nativos indisponíveis.

## 1. Criar o projeto Google Cloud

O projeto identifica seu jogo perante o Google; não é a publicação na Play Store.

1. Entre no [Google Cloud Console](https://console.cloud.google.com/) e crie um projeto para o jogo.
2. Em APIs e serviços, habilite **Google Drive API**.
3. Em Google Auth Platform, configure nome do app, e-mail de suporte e público externo. Durante o desenvolvimento, mantenha o público de teste e inclua os e-mails que vão testar.
4. Declare o escopo `https://www.googleapis.com/auth/drive.appdata`. Não é necessário pedir acesso a todos os arquivos do usuário.
5. Crie um cliente OAuth do tipo **Aplicativo Web**. Copie o ID público terminado em `.apps.googleusercontent.com`.
6. Crie também um cliente OAuth do tipo **Android**, no mesmo projeto, com pacote `com.bingoplinko.game` e SHA-1 do certificado que assina a instalação.
7. Para obter o SHA-1 de desenvolvimento, execute `android/gradlew.bat signingReport` em uma máquina com Android SDK/JDK 21. Para builds baixados pela Play, cadastre também o SHA-1 da chave de assinatura do app exibido na Play Console (não apenas a chave de upload).
8. Copie `.env.example` para `.env.local`. Preencha `VITE_GOOGLE_WEB_CLIENT_ID` com o cliente **Web**, mesmo no Android.
9. Execute `npm run build:android`, compile e reinstale o Android. Variáveis Vite são incorporadas durante o build.

Não coloque client secret, tokens ou senha no código. Não é necessário criar Firebase nem incluir google-services.json para estas integrações.

Referências: [configuração do plugin](https://www.npmjs.com/package/@capawesome/capacitor-google-sign-in), [pasta privada do Drive](https://developers.google.com/workspace/drive/api/guides/appdata), [configuração de consentimento](https://developers.google.com/workspace/guides/configure-oauth-consent).

## 2. Testar o backup

1. Na Home, abra **Progresso e ajustes** e toque em **Entrar com Google**.
2. Autorize o backup, confira a conta e toque em **Salvar backup**.
3. Em outra instalação com a mesma configuração OAuth, entre na mesma conta e toque em **Restaurar backup**.
4. Confira moedas e os três níveis apresentados e confirme a restauração.
5. Verifique que uma cartela nova é gerada no nível restaurado e que nenhum saldo é somado ou duplicado.
6. Teste cancelamento do login, ausência de internet, sessão expirada e troca de conta. Uma falha não deve substituir o progresso local.

O login sozinho não transfere progresso nem salva automaticamente. O progresso local pertence à instalação; salvar após trocar de conta grava esse progresso na nova conta explicitamente escolhida.

## 3. Anúncios de teste

Esta branch já usa os identificadores oficiais de demonstração do Google:

- App ID Android: `ca-app-pub-3940256099942544~3347511713` em `android/app/src/main/res/values/strings.xml`.
- Unidade recompensada: `ca-app-pub-3940256099942544/5224354917`.
- `VITE_ADMOB_TEST_MODE=true` em `.env.local` (também é o padrão quando ausente).

São anúncios de teste, sem receita. O fluxo de teste usa a unidade oficial e não solicita consentimento UMP de um publicador inexistente. Em modo comercial, a consulta UMP e, quando necessária, a tela de consentimento precedem o carregamento do anúncio.

No Android, teste cada recompensa: concluir concede uma vez; fechar antes do fim não concede; vários toques não abrem vários anúncios. Durante o vídeo, a interface bloqueia ações e silencia a música.

Referências: [IDs de teste](https://developers.google.com/admob/android/test-ads), [plugin AdMob](https://github.com/capacitor-community/admob).

## 4. Configurar anúncios comerciais depois

1. Crie sua conta no [AdMob](https://admob.google.com/), cadastre o app Android e uma unidade de anúncio **recompensado**.
2. Troque `admob_app_id` pelo seu **App ID**, que contém `~`.
3. Preencha `VITE_ADMOB_REWARDED_ID` com sua **unidade de anúncio**, que contém `/`.
4. Configure as mensagens aplicáveis em Privacidade e mensagens do AdMob e use o botão **Privacidade dos anúncios** do menu para rever opções quando exigido.
5. Somente ao preparar a versão comercial, defina `VITE_ADMOB_TEST_MODE=false`, reconstrua e sincronize o Android.
6. Vincule a listagem da loja e conclua as verificações solicitadas pelo AdMob, incluindo verificação do app/app-ads.txt quando exigida.
7. Mantenha IDs de demonstração nas versões destinadas a testes; não clique em anúncios comerciais para testar.

A aprovação da Play e a aprovação de veiculação do AdMob são separadas: [revisão do AdMob](https://support.google.com/admob/answer/10564477).

## 5. Antes de distribuir na Play

- Configurar política de privacidade e preencher Segurança dos dados e declaração de anúncios conforme a configuração final e os SDKs utilizados.
- Conferir OAuth com o certificado da Play e testar login, backup e vídeos em aparelho real.
- Começar pela faixa de teste interno; para contas pessoais sujeitas à regra, realizar teste fechado com 12 inscritos por 14 dias contínuos antes de solicitar produção: [requisitos atuais](https://support.google.com/googleplay/android-developer/answer/14151465).

## Limites da validação desta implementação

Os testes Node usam as funções/hooks de produção e simulam as respostas HTTP e os callbacks do SDK. Isso cobre validação dos dados, escopo solicitado, expiração, crédito único e cancelamento; não confirma o OAuth de uma conta real nem a exibição nativa.
Build web e Capacitor Sync não compilam um APK. Compilação nativa e teste em dispositivo continuam pendentes até existir um ambiente Android configurado e os cadastros necessários.
