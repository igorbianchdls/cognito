# Validação do Portal do Contador

Os comandos são executados na raiz do projeto. Consulte também o README do produto em `src/products/portaldocontador/README.md`.

## Consultas e autorização

- `node scripts/shared/shared-smoke.mjs`: banco local fictício; inclui aceitação do convite antes da resposta de criação e preservação das escolhas de acesso locais.
- `node node_modules/tsx/dist/cli.mjs scripts/portaldocontador/smoke.ts`: consulta o banco configurado em transações somente leitura; compara valores com o ERP e valida páginas pequenas sem lacunas ou duplicações.
- `node scripts/portaldocontador/http.mjs`: usa uma sessão Clerk existente do proprietário e a versão preparada na Vercel. `--production` verifica o domínio publicado. Convites são testados apenas com pedidos inválidos ou não autorizados; nenhum e-mail é enviado.

## Regressão de interface sem dados reais

`node scripts/portaldocontador/ui-fixture.mjs` abre um servidor em `http://127.0.0.1:4319`. Usa os componentes reais `PortalPage` e `PortalInvitations`, com adaptadores locais de navegação e respostas fictícias. Não usa credenciais, não acessa o banco e não envia pedidos para o Clerk. Encerrar o processo encerra o servidor.

Verificações no navegador:

1. Consultas: preparar resposta atrasada, clicar em Atualizar, selecionar Empresa 2 e liberar respostas atrasadas. Somente os dados da Empresa 2 devem aparecer.
2. Remover acesso fictício e atualizar. A tabela deve desaparecer e deve surgir a mensagem de empresa indisponível.
3. Convites: digitar um e-mail fictício, preparar resposta atrasada, enviar e trocar de empresa. O campo deve ficar vazio e a lista deve mostrar apenas a nova empresa.
4. Liberar a resposta do convite anterior. A lista da nova empresa não deve mudar. O painel de requisições simuladas deve mostrar o `companyId` original no pedido enviado.

Esses cenários não substituem a navegação autenticada no portal publicado nem a homologação de entrega de um convite real por e-mail.
