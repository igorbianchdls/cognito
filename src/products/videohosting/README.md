# Video Hosting

Hospedar vídeos de venda (VSL) e colocá-los em páginas com um script: autoplay sem som com aviso, barra acelerada, "continuar de onde parou", botões que aparecem no momento certo e controles que a empresa escolhe. Depois: métricas, pixels, testes A/B, planos e Bunny Stream.

## Onde fica

- **Telas** (`src/app/videohosting`, seção Video Hosting do menu): Vídeos (`/videohosting`, publicar a partir de um vídeo do Drive), página do vídeo (`/videohosting/[id]`: prévia, código para colar, título, aparência, botões, domínios, tirar do ar) e Configurações (`/videohosting/configuracoes`: padrão do player e domínios da empresa).
- **Supabase:** schema `videohosting` (`supabase/migrations/20261122210000_videohosting_schema.sql`): `videos` (código público, origem no Drive, provedor, aparência própria, domínios próprios), `presets` (padrão da empresa), `ctas` (botões com início e fim em segundos) e `domains`. Acesso pelos papéis do ERP, como Drive e Analytics; o código público, o provedor e o status só o servidor altera.
- **Aparência** (`shared/settings.ts`): padrão do Otto ← padrão da empresa ← vídeo, campo a campo; valor inválido cai para a camada de baixo.
- **Rota pública** `GET /api/videohosting/v/[código]` (`server/embed.ts`): confere o domínio da página (Origin/Referer), devolve a aparência, os botões e links assinados por 4 horas para o arquivo e a capa. Nunca devolve dados da empresa.
- **Script** `public/videohosting.js`: `<script async src="https://ottogestao.com.br/videohosting.js" data-video="CÓDIGO"></script>`. Shadow DOM (o CSS da página não interfere), HLS via hls.js quando o provedor entregar HLS.

## Regras do player

- **Autoplay sem som:** começa mudo com o aviso "Seu vídeo já começou". Ao clicar, liga o som e, com "voltar ao início", recomeça do zero. Botões só aparecem depois disso.
- **Continuar:** guarda o ponto no navegador a cada 5 s; ao voltar, pergunta se continua ou recomeça. Ao terminar, esquece.
- **Domínios:** os do vídeo substituem os da empresa; sem nenhum, toca em qualquer site. A prévia no próprio Otto sempre toca.

## Provedores

Hoje o arquivo vem do Drive (MP4, link assinado). `provider = 'bunny'` e os campos `provider_*` já existem para a integração com Bunny Stream (HLS, várias qualidades).

## Testes

`pnpm videohosting:smoke` (no CI): camadas de aparência, domínios e o que a página recebe. O player foi testado no Chromium com um vídeo real (autoplay mudo, volta ao início, botão no segundo certo, barra acelerada, continuar, controles desligados, domínio bloqueado).
