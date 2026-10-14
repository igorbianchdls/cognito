# Plano de implementação do login Otto

Data: 13 de outubro de 2026.

Estado da implementação visual: concluída e publicada em 13/10/2026 na publicação `dpl_21D1uiGGCpBdR3oxUDaeBF2QPLS6`. Alterados somente o layout do login, seus estilos, a apresentação de `SignInFlow`, os atributos de estilo dos componentes compartilhados e o carregamento da rota. Cadastro e onboarding mantêm seus ramos anteriores. TypeScript do escopo de autenticação e lint dos arquivos modificados passaram; a Vercel concluiu o build. Conferência visual em 1440×900, 1280×720 e 390×844, com mostrar senha, aviso de recuperação sem email e navegação ao cadastro verificados. O teste de 1280×720 confirmou conteúdo inteiro sem rolagem; em celular não há rolagem horizontal e os campos têm fonte de 16px. Não foram submetidas credenciais reais nem executadas recuperação por email ou MFA. Capturas em `output/login-ui/`; recibos de publicação e verificações em `.cache/login-ui/`.

## Objetivo

Aplicar à rota `/sign-in` a proposta visual aprovada: painel azul com identidade Otto à esquerda e formulário branco à direita. Implementar os textos, campos e botões como elementos reais da interface; a imagem aprovada serve de referência visual.

Referência: `C:/Users/Administrador/Documents/Cognito/output/imagegen/otto-tela-login.png`.

## Situação verificada

- Projeto Next.js com App Router, React, Tailwind e `@clerk/nextjs`.
- A entrada `/` redireciona para `/erp`; `src/proxy.ts` protege as rotas privadas e libera login, cadastro e retorno do Google.
- `src/app/sign-in/[[...sign-in]]/page.tsx` usa `AuthLayout`, `SignInFlow` e um estado de carregamento do Clerk.
- O login local já é personalizado. `SignInFlow.tsx` usa os hooks do Clerk para email/senha, Google, recuperação de senha e verificação adicional.
- `AuthLayout.tsx` apresenta painel verde claro, título institucional e uma prévia ilustrativa do financeiro. Também atende onboarding; cadastro tem um ramo próprio com cartão centralizado.
- `AuthFormParts.tsx` contém campos, título, alerta, senha visível e botão de envio compartilhados com outros fluxos.
- A marca real está em `public/logoOttoIcon.svg` e `public/logoOtto.svg`; a fonte já disponível é Geist.
- Há regras globais de tipografia, cores e raios com `!important`; os estilos do login precisam ser isolados e verificados contra essas regras.
- A página publicada `/sign-in` exibiu inicialmente o mesmo conteúdo institucional encontrado no código. A sessão existente redirecionou para o ERP, impedindo inspeção visual completa do formulário deslogado. O formulário foi analisado pelo código; a verificação visual completa fica para uma sessão sem autenticação.
- Existem alterações locais em andamento em módulos do ERP. A implementação deverá manter o conjunto de mudanças restrito ao login.

## Etapa 0 — Corrigir o destino do login

Estado: concluída e publicada em 13/10/2026. Configuradas `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` e `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` na Vercel (production, preview e development) e no `.env.local`. Republicado o mesmo conjunto de arquivos da versão anterior, sem mudança de código ou visual. A publicação `dpl_D8AMU2yvRZh6niKo9mmoq5byjxee` foi verificada no domínio principal: `/`, `/erp` e `/sign-in` terminam no `/sign-in` do próprio ERP (HTTP 200); `/sign-up` responde 200; `/api/erp/acesso` e `/api/mcp` recusam acesso anônimo com 401. Não foi executado login com credenciais do usuário. Recibos em `.cache/login-routing/`.

Diagnóstico adicional: a resposta publicada de `/sign-in` fornece `signInUrl` e `signUpUrl` vazios ao Clerk. Uma requisição sem sessão a `/erp`, aceitando HTML e seguindo os redirecionamentos, terminou em `https://full-earwig-84.accounts.dev/sign-in` (HTTP 200). Portanto, a tela personalizada existe na aplicação, mas a entrada protegida leva o visitante ao portal hospedado do Clerk.

- Configurar o destino interno de login e cadastro no provedor e no middleware, conforme as opções da versão instalada, para que ambos usem `/sign-in` e `/sign-up`.
- Conferir e aplicar `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` e `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` nos ambientes usados pela publicação; o arquivo de exemplo já contém esses valores, mas isso não os aplica à Vercel.
- Validar o resultado em uma nova publicação de prévia e sessão sem autenticação: `/` e `/erp` devem levar ao login do próprio ERP; `/sign-in` deve renderizar a tela personalizada.
- Manter Google e `/sso-callback` funcionando, sem confundir a URL de entrada com o destino após autenticação.

Essa correção vem antes da mudança visual. A verificação inicial com uma sessão autenticada não cobriu esse caminho.

## Etapa 1 — Estrutura e painel de marca

Modificar `AuthLayout.tsx` com um ramo específico para `mode="sign-in"`. Preservar os ramos de cadastro e onboarding.

- Desktop a partir de 1024px: duas colunas, aproximadamente 58% para marca e 42% para formulário.
- Painel esquerdo: gradiente azul royal, linhas curvas discretas em SVG decorativo, textura leve e conteúdo branco.
- Reutilizar o símbolo oficial do Otto, com apresentação branca no painel e escura no formulário; não incorporar o símbolo inventado pela imagem gerada.
- Título em três linhas: “Sua empresa.”, “Mais simples.”, “Com Otto.”
- Apoio: “Vendas, estoque e financeiro em um só lugar.” e “Mais controle para você. Mais tempo para crescer.”
- Rodapé com ano corrente e direitos reservados.
- Formulário centralizado com largura máxima entre 400 e 440px, espaçamento fluido e marca acima do título.
- Retirar a prévia financeira apenas do login e mover “Criar conta” para abaixo do botão Google.

Criar `src/products/auth/frontend/components/AuthLogin.module.css` para layout, decoração e estilos exclusivos. Se necessário, extrair o painel para `AuthLoginBrandPanel.tsx`. Evitar mudanças nos tokens globais do ERP.

## Etapa 2 — Apresentação do formulário

Modificar a apresentação de `SignInFlow.tsx`, mantendo handlers, estados e integração existentes.

- Título: “Bem-vindo de volta”. Subtítulo: “Acesse sua conta para continuar.”
- Campos “E-mail” e “Senha”, altura de aproximadamente 52px, borda discreta e raio de 8px.
- Manter o controle de mostrar/ocultar senha.
- Posicionar “Esqueceu sua senha?” abaixo do campo de senha, alinhado à direita.
- Botão principal azul “Entrar”, separador “ou” e botão secundário “Continuar com Google”.
- Link inferior: “Não tem uma conta? Criar conta”, apontando para `/sign-up`.
- Preservar mensagens de erro por campo, alerta geral, estado de envio, preenchimento automático e navegação por teclado.
- Aplicar o mesmo acabamento às etapas de recuperação, nova senha e verificação adicional.

Em `AuthFormParts.tsx`, adicionar uma opção explícita de apresentação para o login, caso necessária. Manter a aparência atual como padrão para os demais consumidores. Ajustar o posicionamento do ícone de senha se a altura dos campos mudar.

## Etapa 3 — Carregamento e telas menores

- Ajustar `AuthFlowLoading` na página de login para acompanhar as dimensões do novo formulário e reduzir deslocamento de conteúdo durante o carregamento.
- Abaixo de 1024px: ocultar o painel decorativo e apresentar marca e formulário em uma coluna branca.
- Em celular: margens de 20–24px, botões confortáveis para toque, campos com fonte de pelo menos 16px e rolagem quando o teclado estiver aberto.
- Usar altura mínima baseada na área visível, sem fixar a altura de forma que corte mensagens ou etapas adicionais.
- Manter decoração fora da árvore de acessibilidade e respeitar preferência por movimento reduzido no carregamento.

## Etapa 4 — Preservação dos fluxos

Manter o percurso já implementado:

- Email/senha → finalização da sessão Clerk → `/onboarding` → `/erp` quando a empresa já estiver configurada.
- Google → `/sso-callback` → `/onboarding`.
- Recuperação → código por email → nova senha → continuação da autenticação.
- Verificação adicional → método suportado pelo Clerk → conclusão da sessão.

Não são previstas alterações no provedor, middleware, banco, webhooks ou configuração dos métodos de login. Qualquer problema funcional encontrado na validação deverá ser identificado separadamente da mudança visual.

## Etapa 5 — Validação e entrega

1. Executar checagem TypeScript que inclua os componentes de autenticação; `erp:typecheck` sozinho não cobre esse escopo. Executar lint dos arquivos modificados e build do projeto, distinguindo falhas preexistentes.
2. Inspecionar o login deslogado em 1440×900, 1280×720, 768×1024 e 390×844; verificar também zoom de 200%, foco visível, contraste e ausência de rolagem horizontal.
3. Conferir campos obrigatórios, senha visível, erro de credenciais e estado de envio. Validar fluxos reais com conta de teste apropriada: email/senha, Google, recuperação e MFA quando disponíveis. Se não houver conta ou método configurado, registrar o fluxo como não validado.
4. Verificar cadastro e onboarding para garantir que os componentes compartilhados não sofreram regressão visual.
5. Entregar capturas desktop/mobile, resumo dos arquivos modificados e resultados das verificações em uma prévia revisável. A publicação em produção fica fora desta etapa de planejamento.

## Critérios de aceite

- Login reconhecível como a proposta aprovada, com painel azul, proporção entre colunas, hierarquia tipográfica e formulário branco.
- Logo oficial, conteúdo em português e controles interativos reais.
- Layout utilizável em celular, telas baixas e zoom ampliado.
- Recuperação e verificação adicional mantêm erros, carregamento e navegação utilizáveis.
- Cadastro, onboarding e demais telas do ERP preservam seu comportamento e aparência atuais.
- Checagens realizadas e eventuais limitações documentadas antes da entrega.
