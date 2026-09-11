# VyseFit AI: No seu ritmo

Proposta de redesign, 11 de setembro de 2026. Conceito e geração inicial aprovados pelo usuário. Imagem inicial gerada e corrigida; aprovação da imagem corrigida e do orçamento de vídeo pendente.

## Direção recomendada

Uma experiência esportiva editorial sobre constância. Fotografia cinematográfica de uma pista verde ao amanhecer, títulos amplos, espaços generosos e uma linha de percurso que acompanha a navegação. Treino, alimentação e recuperação formam uma rotina conectada.

Alternativa: um estúdio de treino com luz lateral, equipamentos em primeiro plano e câmera descendo até o piso. Mais intenso e urbano; menos ligado à ideia de rotina ao ar livre.

## Escopo e integração

- Redesenhar a página pública em `components/landing-page.tsx`, atendida por `/`. A rota `/landing` já redireciona para ela.
- Conservar a marca real do projeto, VyseFit AI, e integrar os botões ao cadastro em `/auth/signup` e à entrada em `/auth/login`.
- Adaptar a direção da skill site-de-10k ao Next.js existente. Uma conversão para HTML isolado não atende à integração deste aplicativo.
- Usar CSS isolado para a página pública, sem interferir nas preferências de tema do aplicativo.
- Reavaliar metadados e a apresentação inicial da rota, que atualmente desativa a renderização no servidor.
- Não publicar antes da revisão do usuário.

## Paleta e tipografia

| Papel | Cor |
| --- | --- |
| Fundo principal, verde profundo | `#123C35` |
| Superfície, verde pista | `#21574C` |
| Texto principal, névoa | `#F0F4EE` |
| Fundo das seções de leitura, cinza mineral | `#E6EBE5` |
| Texto secundário sobre fundo escuro | `#BFCFC5` |
| Acento para chamadas e foco, menta | `#A9E9CB` |

Barlow Condensed 600/700/900 nos títulos, aproveitando a fonte já instalada e sua relação com comunicação esportiva. Inter 400/600 nos parágrafos. Algarismos tabulares nos exemplos do produto. Validar contraste após receber as imagens; as cores são pontos de partida.

## Storyboard do hero

Tomada única, sem cortes. A câmera avança suavemente e desce junto à curva de uma pista esportiva verde. Um atleta adulto permanece distante no terço direito. A pista ocupa o quadro inteiro e suas linhas guiam o olhar. O lado esquerdo tem textura calma para leitura. O final repousa próximo ao piso, com a curva conduzindo para a demonstração do produto na seção seguinte.

| Progresso inicial de scroll | Cena | Texto |
| --- | --- | --- |
| 0 a 0,34 | Vista ampla da curva, luz suave de manhã | Seu próximo passo começa aqui. |
| 0,34 a 0,68 | Aproximação contínua, atleta distante | Treino. Alimentação. Recuperação. |
| 0,68 a 1 | Câmera repousa próxima à pista | Tudo no seu ritmo. |

Os intervalos serão validados com rolagens de 120, 240 e 360 pixels. A composição deixa o atleta livre de texto. Sombras e gradientes locais garantem leitura.

### Versão estática

Título: Seu próximo passo começa aqui.

Subtítulo: Organize seus treinos, acompanhe sua alimentação e veja sua evolução com o VyseFit AI.

Chamada: Começar gratuitamente.

Imagem composta para celulares e movimento reduzido. A versão pesada do vídeo não será baixada nesses casos.

## Seções após a abertura

1. **Uma rotina que faz sentido para você.** Demonstração interativa com três opções: Treinar, Comer bem, Recuperar. Cada seleção muda a apresentação do recurso. Os números exibidos serão identificados como exemplos.
2. **Menos anotações. Mais clareza.** Fotografia editorial de uma refeição e demonstração visual da análise de alimentos. Texto: Fotografe sua refeição e confira a estimativa nutricional antes de salvar.
3. **Seu treino acompanha você.** Fotografia esportiva na mesma luz do hero. Texto: Organize os exercícios de acordo com seu objetivo e os equipamentos disponíveis.
4. **O descanso também conta.** Composição ampla de recuperação ao ar livre. Texto: Acompanhe sono, humor e hábitos para enxergar sua rotina por inteiro.
5. **Comece no seu ritmo.** Comparação de planos, com preços e limites conferidos na configuração real de assinatura antes da implementação. Não converter os dólares atualmente mostrados na landing para reais por suposição.
6. **Antes do primeiro passo.** FAQ com respostas sobre conta gratuita, equipamentos, estimativas da IA e uso pelo celular, conferidas contra os fluxos reais.
7. **Seu próximo passo pode ser hoje.** Chamada final para o cadastro real. Rodapé com navegação funcional e identificação das imagens ilustrativas geradas por IA.

Não reutilizar as estatísticas de usuários, nota do aplicativo, certificação SOC 2 ou disponibilidade de 99,9% presentes na página atual sem comprovação.

## Movimento e interação

- Assinatura visual: uma linha de percurso inspirada nas marcações da pista conecta a abertura à demonstração do produto.
- O vídeo avança e retrocede com a rolagem no desktop.
- Títulos acompanham as três etapas da aproximação; primeira mensagem legível sem exigir rolagem.
- Transições da demonstração respondem às escolhas do visitante.
- Entradas distintas por seção e respostas suaves nos controles.
- Animações param fora da tela e em abas ocultas. Movimento reduzido exibe os estados finais.
- Menu móvel com nome acessível, estado expandido, fechamento por Escape e navegação por teclado.

## Prompts preparados

### Quadro inicial, Soul Cinema, 2k, 16:9

Photorealistic cinematic editorial photograph for a premium fitness application. A forest-green outdoor running track curves through the scene at early morning, with a single adult runner small and distant in the right third, wearing unbranded muted green sportswear. Camera positioned at waist height at the beginning of a gentle forward and downward approach toward the curved track surface. Soft daylight from the upper right, pale mist in the distant trees, realistic mineral textures, deep forest green, muted mint track markings, soft chalk-white highlights. A continuous edge-to-edge environment, with calm softly shaded track texture across the left half for website typography, no separate panels. Generous crop safety at every edge. Authentic sports campaign photography, restrained film grain, natural proportions. No text, no logos, no lettering anywhere.

### Movimento, após aprovação da imagem e escolha do modelo

One continuous shot, no cuts. The camera glides slowly forward and downward along the curved green running track toward its textured surface. The distant adult runner stays in the right third, moving naturally away from the camera, never approaching in close-up. Soft morning mist drifts gently beyond the track. Preserve the track geometry and muted forest-green palette of the reference image. The left half remains a calm continuous part of the track for editorial composition. The camera gradually decelerates and ends at rest close to the track, with a single curved lane marking leading from the lower foreground toward the right background. No abrupt changes, no morphing, no new objects. No text, no logos, no lettering anywhere.

## Higgsfield: saldo e decisão necessária

Saldo inicial: 10 créditos. Saldo após duas gerações: 9,76 créditos. Plano free. Trial pendente, sem gerações ilimitadas ativas.

O preflight apresenta 1 crédito arredondado e 0,12 exato para cada imagem Soul Cinema, 2k. A cobrança observada foi de 0,12 por geração. A primeira trouxe texto indevido; a correção removeu o texto, mas recompôs a cena com corredor mais próximo, no terço direito. Ambas foram inspecionadas.

Imagem corrigida: `.design-review/hero-corrected.png`, job `13bc822e-e648-4a95-bcd7-90f9f5c2eb07`. Primeira imagem rejeitada: job `c0b5052c-9f1d-4828-8d57-136d46bc5cdc`.

Custos consultados: Kling 3.0 Turbo em 1080p por 6 segundos, 12 créditos; Seedance 2.0 em 1080p por 6 segundos sem áudio, 54 créditos; Seedance Mini em 720p por 6 segundos, 15 créditos. Recomendação ajustada ao saldo: Kling 3.0 Turbo em 1080p por 4 segundos, 8 créditos. Três imagens de apoio Soul Cinema custam 0,12 exato cada; total exato estimado de vídeo e apoio: 8,36 créditos, sem repetições. O vídeo mais curto continua podendo ocupar uma jornada longa de scroll, porque o visitante controla o tempo.

Pergunta de aprovação enviada ao usuário: aprovar imagem corrigida, vídeo e três imagens de apoio; optar pela imagem com animações da página sem vídeo; ou ajustar a imagem. Não gerar vídeo nem apoio até a resposta. Após aprovação, adaptar o prompt de movimento à composição corrigida: corredor próximo visto de frente, jamais instruir que ele já está distante ou de costas. A câmera desce para a pista enquanto o corredor sai naturalmente da composição pela direita, e o final repousa na curva das faixas.

## Engenharia e verificação planejadas

Vídeo otimizado com keyframes curtos, pôster WebP, carregamento por Blob, cancelamento de requisições e liberação de object URLs. Interpolação independente da taxa de atualização, uma busca de quadro por vez e loop ocioso quando convergir. Recuperação para imagem estática se houver erro.

Cinco condições de imagem estática sincronizadas entre CSS e JavaScript: largura até 720px; retrato até 1024px; retrato com toque; paisagem com toque e altura até 560px; preferência por movimento reduzido. Reavaliar ao redimensionar e mudar preferências.

Verificar desktop e celular, navegação, cadastro, links de planos, seleção interativa, menu, teclado, contraste, falha de vídeo, movimento reduzido e ausência de rolagem horizontal. Executar lint, TypeScript e build apropriados. Não apresentar desempenho estimado como medido.

## Pesquisa breve de linguagem

Discussões reais apontam registros de treino e dieta espalhados entre aplicativos e anotações, além da dificuldade de registrar refeições durante o dia. Isso orienta a demonstração integrada e a escrita simples, sem transformar relatos em promessa de resultado.

- https://www.reddit.com/r/Maromba/comments/1gb5z3i
- https://www.reddit.com/r/Maromba/comments/1fdfuxv

## Estado da entrega

Andaime implementado em `components/landing/experience.tsx`, `experience.module.css` e `cinema.tsx`. A página pública ainda usa o componente original, até aprovação dos materiais. O novo componente recebe quatro imagens e um vídeo opcional por propriedades.

Implementados: hero, navegação móvel, demonstração com abas Radix e três modos, seções editoriais, planos com limites importados de `lib/plan-limits.ts`, FAQ, CTA e rodapé. Vídeo com Blob, seek serial, suavização, descarte de recursos, observação da viewport, condições de movimento reduzido e imagem estática em falhas. Textos fixos do título principal mantidos legíveis durante a jornada; os capítulos mudam no rodapé do hero para preservar acesso contínuo ao CTA.

Checagens realizadas: TypeScript sem erros; ESLint dos dois novos componentes sem erros; busca de linguagem proibida sem ocorrências. Corrigida a configuração antiga de ESLint, substituindo FlatCompat pelos exports flat das dependências já instaladas. Corrigida a associação das abas para haver um único painel por identificador. Revisão React aplicada.

Faltam: aprovação dos materiais e orçamento, geração e inspeção de vídeo/apoio, gate de vídeo da skill, otimização de mídia, integração da rota pública, verificação visual em navegador e build final. Nenhuma publicação feita.
