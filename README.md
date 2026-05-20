# zipdf

Sistema web moderno para compactação de PDFs com processamento 100% local no navegador. O arquivo não é enviado para servidores, não é armazenado e a UI permanece responsiva graças ao uso de Web Worker.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Ghostscript WASM como engine padrão para compressão agressiva de PDFs com imagens
- QPDF WASM como engine rápida para otimização estrutural
- `pdf-lib` como engine JavaScript/fallback client-side
- Web Workers para processamento fora da thread principal
- Internacionalização inicial em `pt-BR` e `en`
- Zustand preparado para preferências e expansão SaaS
- Deploy estático/serverless na Vercel, sem backend inicial

## Como executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Comandos úteis:

```bash
npm run typecheck
npm run lint
npm run build
```

## Fluxo implementado

1. Usuário seleciona ou arrasta um PDF.
2. O app valida extensão, MIME, assinatura `%PDF-`, tamanho e arquivo vazio.
3. A UI exibe o PDF selecionado e aguarda o usuário clicar em iniciar compressão.
4. O arquivo é enviado por transferência de `ArrayBuffer` para um Web Worker local.
5. O worker executa a engine selecionada: QPDF WASM, Ghostscript WASM ou JavaScript.
6. Se QPDF WASM for selecionado e não carregar, o app usa JavaScript como fallback local.
7. O resultado volta para a UI sem upload, armazenamento ou backend.
8. A UI exibe tamanho original, tamanho final, redução, tempo, progresso, erros e download.
9. O usuário pode alterar engine ou nível e testar outra compressão no mesmo PDF sem selecionar o arquivo novamente.

## Internacionalização

O projeto tem dicionários tipados em `i18n/dictionaries.ts` e seleção de idioma por `localStorage`.

Idiomas disponíveis:

- `pt-BR`
- `en`

Para adicionar outro idioma, inclua o locale em `i18n/config.ts`, copie a estrutura do dicionário e conecte eventuais textos novos pelo tipo `Dictionary`. Mensagens vindas do worker usam chaves, não texto final, para manter o processamento independente do idioma da interface.

## Privacidade

O projeto foi desenhado para não fazer upload de PDFs. O processamento acontece no navegador do usuário e o download é gerado com `URL.createObjectURL`. Não há backend, API externa de compressão, banco de dados ou persistência de arquivos.

Mensagem exibida no produto:

> Seus arquivos nunca saem do seu dispositivo.

## Sobre a compressão

O projeto carrega QPDF WASM single-thread em `public/wasm/pdf-compressor.js`. O motor roda dentro do Web Worker do navegador, usa o filesystem virtual do Emscripten e grava o resultado em memória para download local.

Ghostscript WASM é integrado via `@okathira/ghostpdl-wasm` e também roda no worker, com `pdfwrite`, `PDFSETTINGS` e downsample de imagens. Ele é mais pesado, mas costuma reduzir muito mais PDFs de slides, scans e apresentações convertidas para PDF.

`pdf-lib` permanece como engine JavaScript e fallback caso QPDF WASM falhe. Ele consegue regravar a estrutura interna do PDF, usar object streams e remover alguma sobrecarga. Isso pode reduzir PDFs gerados por ferramentas de escritório ou com estrutura redundante, mas não faz downsample de imagens.

### Engines

- Ghostscript WASM: padrão. Usa `pdfwrite` com presets de imagem. Melhor para PDFs compostos por imagens, com maior consumo de memória e possível perda visual.
- QPDF WASM: melhor para otimização estrutural, recompressão de streams e ajustes leves de imagem.
- JavaScript: usa `pdf-lib`, é leve e compatível, mas tem menor poder de compressão.

Observação de licença: o pacote Ghostscript WASM usado no projeto é AGPL-3.0-or-later. Para SaaS fechado ou distribuição proprietária, avalie licença comercial com a Artifex ou substitua por uma engine com licença compatível.

### Presets de compressão

Com QPDF WASM ativo, os presets usam estratégias diferentes:

- Alta qualidade: preserva object streams e recomprime streams Flate com nível 6.
- Balanceado: gera object streams, recomprime streams Flate e usa nível 7.
- Máxima compressão: usa nível 9, `--decode-level=all` e ativa otimização agressiva de imagens JPEG com `--optimize-images`, `--jpeg-quality=40` e thresholds mínimos de imagem.

Mesmo assim, `Balanceado` e `Máxima compressão` podem gerar arquivos do mesmo tamanho em PDFs sem imagens JPEG otimizáveis, PDFs já bem compactados ou casos em que a recompressão de imagem não reduz o arquivo. O QPDF só aplica otimizações de imagem quando elas efetivamente ajudam.

Para PDFs compostos majoritariamente por imagens, como apresentações exportadas para PDF, a maior redução normalmente exige downsample de resolução. QPDF recomprime imagens, mas não rasteriza páginas nem reduz DPI como Ghostscript.

Algumas combinações, especialmente QPDF em PDFs de slides já comprimidos, podem gerar um arquivo maior que o original. Nesses casos, a UI descarta o resultado maior, mantém o PDF original como melhor resultado e sugere testar outra engine/preset.

Com Ghostscript WASM ativo, os presets usam:

- Alta qualidade: `PDFSETTINGS=/printer`, imagens coloridas/cinza em 300 DPI.
- Balanceado: `PDFSETTINGS=/ebook`, imagens coloridas/cinza em 150 DPI.
- Máxima compressão: padrão atual. `PDFSETTINGS=/screen`, imagens coloridas/cinza em 96 DPI.

Durante a execução do Ghostscript, o motor WASM roda de forma síncrona dentro do worker. Por isso, a UI exibe tempo em tempo real, mensagem de processamento e progresso estimado até a etapa finalizar.

O cancelamento de QPDF/Ghostscript encerra o Web Worker em execução e cria um worker novo. Isso interrompe motores WASM síncronos de forma confiável e mantém o PDF selecionado pronto para outra tentativa.

### Build do QPDF WASM

O build single-thread pode ser reproduzido com Docker e Emscripten:

```bash
docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  emscripten/emsdk:3.1.74 \
  bash scripts/build-qpdf-wasm.sh
```

Ou, se `emcc`, `emcmake` e `cmake` já estiverem instalados localmente:

```bash
npm run wasm:build:qpdf
```

O script baixa o QPDF, prepara `zlib` e `libjpeg` via `embuilder`, compila o target `qpdf` com `-sMODULARIZE=1`, `-sALLOW_MEMORY_GROWTH=1` e exporta `FS`/`callMain`. Os artefatos finais são:

```text
public/wasm/qpdf.js
public/wasm/qpdf.wasm
```

Também existe um instalador de fallback para um pacote prebuilt:

```bash
npm run wasm:install:qpdf-prebuilt
```

## Limitações do processamento local

- PDFs muito grandes consomem memória proporcional ao tamanho do arquivo e ao resultado intermediário.
- Navegadores mobile podem encerrar a aba se a memória disponível for baixa.
- PDFs criptografados ou corrompidos podem falhar no carregamento.
- A engine JavaScript com `pdf-lib` não faz downsample de imagens.
- Ghostscript WASM é mais agressivo e pode alterar aparência, transparências, metadados ou compatibilidade em PDFs complexos.
- A barra de progresso acompanha etapas reais do pipeline, mas bibliotecas PDF nem sempre expõem progresso byte a byte.

## Memória e performance

O app transfere o `ArrayBuffer` do arquivo para o worker para evitar cópias desnecessárias. Ainda assim, durante a compressão podem coexistir:

- arquivo original em memória;
- estrutura parseada do PDF;
- bytes finais compactados;
- buffers temporários do motor WASM.

Ghostscript pode precisar de bem mais memória que QPDF, especialmente ao processar páginas com imagens grandes. O limite recomendado inicial é 250 MB por PDF, mas mobile pode falhar antes disso. Para produção SaaS, considere detecção adaptativa por dispositivo, fila de lote e avisos específicos para mobile.

## Segurança frontend

- Sem upload e sem armazenamento de arquivos.
- Validação de tipo, extensão, assinatura e tamanho.
- Headers de segurança em `next.config.ts`.
- Download via Blob local.
- Worker isolado para processamento pesado.
- Nenhuma API externa para compressão.

## Licença open source

Como o projeto distribui Ghostscript WASM, a opção open source mais coerente é licenciar o projeto inteiro como `AGPL-3.0-or-later` enquanto essa engine estiver incluída no app. Ghostscript é disponibilizado pela Artifex em modelo dual-license: AGPL ou licença comercial.

Se a intenção for usar uma licença permissiva como MIT ou Apache-2.0, remova Ghostscript do pacote distribuído, transforme-o em integração opcional não incluída no projeto, ou obtenha uma licença comercial compatível. Para um SaaS proprietário, valide o cenário com jurídico antes de publicar.

## Acessibilidade

- Input de arquivo nativo acessível.
- Estados de erro com `role="alert"`.
- Botões com labels e foco visível.
- Contraste adequado no modo claro.
- Layout responsivo para desktop e mobile.

## Estrutura

```text
app/
components/
hooks/
public/wasm/
services/pdf/
store/
types/
utils/
workers/
```

## Preparado para evolução

A arquitetura deixa espaço para:

- merge PDF;
- split PDF;
- OCR;
- assinatura digital;
- conversão PDF ↔ imagens;
- compressão em lote;
- histórico local;
- conta de usuário;
- planos premium.

Cada nova ferramenta pode compartilhar o mesmo padrão: validação, worker dedicado, serviço isolado, tipos compartilhados e UI reutilizável.
