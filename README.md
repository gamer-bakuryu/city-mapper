# README.md

```markdown
# 🏙️ CityMapper — Editor de Mapas Urbanos

<div align="center">

![CityMapper Banner](https://img.shields.io/badge/CityMapper-Editor%20Urbano-e94560?style=for-the-badge&logo=map&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-222222?style=for-the-badge&logo=github&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependências-Zero-4CAF50?style=for-the-badge)

**Editor de mapas urbanos no estilo Floor Planner, rodando 100% no navegador.**  
Desenhe ruas, avenidas, rodovias e estruturas para criar cidades completas.

[🚀 Acessar Demo](#) · [📖 Documentação](#funcionalidades) · [🐛 Reportar Bug](../../issues) · [💡 Sugerir Feature](../../issues)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Screenshot](#-screenshot)
- [Funcionalidades](#-funcionalidades)
- [Como Usar](#-como-usar)
- [Ferramentas](#-ferramentas)
- [Estruturas Disponíveis](#-estruturas-disponíveis)
- [Atalhos de Teclado](#️-atalhos-de-teclado)
- [Sistema de Camadas](#-sistema-de-camadas)
- [Salvamento e Exportação](#-salvamento-e-exportação)
- [Instalação e Deploy](#-instalação-e-deploy)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias](#-tecnologias)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🌆 Sobre o Projeto

O **CityMapper** é um editor de mapas urbanos interativo que roda inteiramente no navegador,
sem necessidade de instalação, backend ou dependências externas.

Inspirado em ferramentas como **Floor Planner** e **OpenStreetMap Editor**, o CityMapper
foi construído para permitir a criação visual de cidades fictícias ou reais de forma
simples e intuitiva, usando apenas HTML5 Canvas, CSS e JavaScript puro.

### ✨ Por que CityMapper?

- ✅ **Zero dependências** — sem npm, sem frameworks, sem bibliotecas externas
- ✅ **Funciona offline** — abre direto do arquivo HTML
- ✅ **GitHub Pages ready** — deploy com um clique
- ✅ **Leve e rápido** — menos de 100KB de código total
- ✅ **Open source** — personalize como quiser

---

## 📸 Screenshot

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏙️ CityMapper  [Novo][Salvar][Carregar][PNG][JSON]  [↩️][↪️]   │
├──────────┬──────────────────────────────────────┬───────────────┤
│          │                                      │  Propriedades │
│ 👆 Sel   │                                      │               │
│ ✋ Mover │          CANVAS PRINCIPAL            │  Camadas      │
│ 🛣️ Rua   │                                      │  ┌──────────┐ │
│ 🛤️ Aven  │     ════════════════════             │  │ Terreno  │ │
│ 🚗 Rod   │         ┌──────┐  ┌────┐             │  │ Vias     │ │
│ ⬡ Polig  │    ═════│  🏢  │══│ 🏠 │═════        │  │ Estrutur │ │
│ ▬ Retâng │         └──────┘  └────┘             │  │ Rótulos  │ │
│ ⬤ Círc  │              ║                        │  └──────────┘ │
│ 🔤 Texto │         ┌───╨───┐                    │               │
│ 🗑️ Agar  │         │  🌳   │                    │  Minimapa     │
│ 📏 Medir │         │ Parque│                    │  ┌──────────┐ │
│          │         └───────┘                    │  │  mapa..  │ │
│ Estrutur │                                      │  └──────────┘ │
│ 🏠🏢🏪  │    X: 240 | Y: 180                   │               │
│ 🏭🌳🏥  │                                      │  Estatísticas │
└──────────┴──────────────────────────────────────┴───────────────┘
```

---

## 🚀 Funcionalidades

### 🎨 Ferramentas de Desenho

| Ferramenta | Descrição | Atalho |
|---|---|---|
| Selecionar | Clique e arraste elementos | `V` |
| Mover Mapa | Pan pelo canvas | `H` |
| Rua | Via local simples | `S` |
| Avenida | Via larga com divisória | `A` |
| Rodovia | Via expressa com faixa central | `W` |
| Polígono | Forma livre com N vértices | `P` |
| Retângulo | Clique e arraste | `R` |
| Círculo | Do centro para a borda | `C` |
| Texto | Rótulos e nomes | `T` |
| Apagar | Remove elementos | `E` |
| Medir | Calcula distâncias | `M` |

### 🏗️ Estruturas Rápidas

12 tipos de estruturas pré-configuradas com cores temáticas:
`Casa` `Prédio` `Comércio` `Indústria` `Parque` `Hospital` `Escola` `Igreja` `Estádio` `Estacionamento` `Água` `Praça`

### 🗂️ Sistema de Camadas
- 4 camadas padrão (Terreno, Vias, Estruturas, Rótulos)
- Criação de camadas personalizadas
- Visibilidade e bloqueio por camada
- Contador de elementos por camada

### 🕹️ Interação
- Zoom com scroll do mouse (10% a 500%)
- Pan com botão do meio ou ferramenta Mover
- Snap to Grid configurável
- Seleção múltipla com Shift+clique
- Menu de contexto com clique direito
- Ajuste de visão automático (Fit to Screen)

### 💾 Persistência
- Auto-save no LocalStorage
- Salvar/carregar projetos
- Exportar como PNG
- Exportar/importar como JSON

### 📊 Estatísticas em Tempo Real
- Total de ruas e estruturas
- Área total das estruturas (em m²)
- Extensão total das vias (em km)

### ↩️ Histórico
- Undo/Redo com até **50 estados**
- Atalhos `Ctrl+Z` / `Ctrl+Y`

---

## 🖱️ Como Usar

### Desenhando Ruas

```
1. Selecione a ferramenta 🛣️ Rua (tecla S)
2. Clique no canvas para adicionar pontos
3. Continue clicando para criar curvas e cruzamentos
4. Dê DUPLO CLIQUE para finalizar a via
```

### Desenhando Polígonos

```
1. Selecione a ferramenta ⬡ Polígono (tecla P)
2. Clique para adicionar cada vértice da forma
3. Continue adicionando quantos pontos quiser
4. Dê DUPLO CLIQUE para fechar e finalizar o polígono
```

### Usando Estruturas Rápidas

```
1. Clique em qualquer estrutura no painel esquerdo (ex: 🏠 Casa)
2. O cursor muda para indicar modo de posicionamento
3. Clique no canvas onde deseja posicionar
4. A estrutura é criada com cores e tamanhos pré-definidos
```

### Editando Elementos

```
1. Selecione a ferramenta 👆 Selecionar (tecla V)
2. Clique em qualquer elemento para selecioná-lo
3. As propriedades aparecem no painel direito
4. Edite nome, cor, opacidade, posição e tamanho
5. Clique em ✅ Aplicar para salvar as mudanças
```

### Medindo Distâncias

```
1. Selecione a ferramenta 📏 Medir (tecla M)
2. Clique no ponto inicial
3. Mova o mouse — a distância aparece em tempo real
4. Clique novamente para fixar a medição
5. Clique uma terceira vez para limpar
```

---

## 🛠️ Ferramentas

### Vias Disponíveis

| Tipo | Largura | Característica |
|---|---|---|
| **Rua** | 12px | Via local, uso residencial |
| **Avenida** | 24px | Via coletora, faixa divisória amarela |
| **Rodovia** | 36px | Via expressa, faixa central branca |

> 💡 **Dica:** A ferramenta de medição usa a escala `1 pixel = 0.5 metro`.  
> Uma rua de 200px equivale a 100 metros no mundo real.

### Configurações de Visualização

| Opção | Descrição |
|---|---|
| **Mostrar Grid** | Exibe a grade de referência |
| **Snap to Grid** | Alinha automaticamente ao grid (20px) |
| **Mostrar Nomes** | Exibe os rótulos dos elementos |

---

## 🏗️ Estruturas Disponíveis

| Ícone | Nome | Categoria | Cor Padrão |
|---|---|---|---|
| 🏠 | Casa | Residencial | Verde claro |
| 🏢 | Prédio | Residencial | Azul acinzentado |
| 🏪 | Comércio | Comercial | Laranja |
| 🏭 | Indústria | Industrial | Marrom |
| 🌳 | Parque | Recreativo | Verde |
| 🏥 | Hospital | Institucional | Vermelho |
| 🏫 | Escola | Institucional | Azul |
| ⛪ | Igreja | Institucional | Roxo |
| 🏟️ | Estádio | Recreativo | Teal |
| 🅿️ | Estacionamento | Infraestrutura | Cinza |
| 💧 | Água | Natural | Azul claro |
| ⛲ | Praça | Recreativo | Amarelo |

---

## ⌨️ Atalhos de Teclado

### Ferramentas

| Tecla | Ação |
|---|---|
| `V` | Ferramenta Selecionar |
| `H` | Ferramenta Mover Mapa |
| `S` | Desenhar Rua |
| `A` | Desenhar Avenida |
| `W` | Desenhar Rodovia |
| `P` | Desenhar Polígono |
| `R` | Desenhar Retângulo |
| `C` | Desenhar Círculo |
| `T` | Adicionar Texto |
| `E` | Ferramenta Apagar |
| `M` | Medir Distância |

### Ações Gerais

| Tecla | Ação |
|---|---|
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` | Refazer |
| `Ctrl + S` | Salvar Projeto |
| `Ctrl + A` | Selecionar Tudo |
| `Delete` | Excluir Seleção |
| `Esc` | Cancelar / Desselecionar |
| `?` | Abrir / Fechar Ajuda |

### Mouse

| Ação | Resultado |
|---|---|
| `Scroll ↑↓` | Zoom in/out |
| `Botão do meio + arrastar` | Pan no mapa |
| `Shift + Clique` | Seleção múltipla |
| `Duplo clique` | Finalizar linha/polígono |
| `Clique direito` | Menu de contexto |

---

## 🗂️ Sistema de Camadas

O CityMapper usa um sistema de camadas para organizar os elementos do mapa.

### Camadas Padrão

```
┌─────────────────────────────┐
│  👁️  Rótulos       (topo)   │ ← textos e nomes
│  👁️  Estruturas             │ ← edificações
│  👁️  Vias                   │ ← ruas e avenidas
│  👁️  Terreno      (fundo)   │ ← áreas naturais
└─────────────────────────────┘
```

### Operações de Camada

- **Clique no olho** 👁️ para alternar visibilidade
- **Clique no nome** para definir como camada ativa
- **Botão +** para criar nova camada personalizada
- **Botão ×** para excluir uma camada

> ⚠️ **Atenção:** Elementos de uma camada invisível não podem ser selecionados ou editados.

---

## 💾 Salvamento e Exportação

### Salvar no Navegador

```
Botão [💾 Salvar] → Grava no LocalStorage do navegador
Botão [📂 Carregar] → Recupera o último projeto salvo
```

> 🔁 O projeto também é **salvo automaticamente** a cada modificação.

### Exportar como PNG

```
Botão [🖼️ Exportar PNG] → Baixa uma imagem do mapa atual
```
- Exporta apenas os elementos (sem a grade)
- Fundo branco para melhor legibilidade
- Resolução idêntica à tela

### Exportar / Importar JSON

```
Botão [📋 Exportar JSON] → Baixa arquivo .json do projeto
Duplo clique em [📂 Carregar] → Abre seletor para importar .json
```

### Formato do Arquivo JSON

```json
{
  "version": "1.0",
  "timestamp": 1700000000000,
  "data": {
    "elements": [
      {
        "id": "el_abc123",
        "type": "road",
        "roadType": "avenue",
        "points": [
          { "x": 100, "y": 200 },
          { "x": 400, "y": 200 }
        ],
        "width": 24,
        "color": "#757575",
        "name": "Avenida Principal",
        "layerId": "layer_roads"
      },
      {
        "id": "el_def456",
        "type": "rectangle",
        "x": 150,
        "y": 240,
        "width": 80,
        "height": 60,
        "fill": "#66BB6A",
        "stroke": "#2E7D32",
        "name": "Casa",
        "category": "residential",
        "layerId": "layer_structures",
        "opacity": 0.8,
        "rotation": 0
      }
    ],
    "layers": [
      { "id": "layer_terrain",    "name": "Terreno",    "visible": true, "locked": false },
      { "id": "layer_roads",      "name": "Vias",       "visible": true, "locked": false },
      { "id": "layer_structures", "name": "Estruturas", "visible": true, "locked": false },
      { "id": "layer_labels",     "name": "Rótulos",    "visible": true, "locked": false }
    ],
    "camera": {
      "x": 0,
      "y": 0,
      "zoom": 1
    }
  }
}
```

---

## 📦 Instalação e Deploy

### Opção 1 — Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/city-mapper.git

# Acesse a pasta
cd city-mapper

# Abra no navegador (sem necessidade de servidor)
# Windows:
start index.html

# macOS:
open index.html

# Linux:
xdg-open index.html
```

> ⚠️ Alguns navegadores bloqueiam módulos locais.  
> Se necessário, use um servidor simples:

```bash
# Com Python (já instalado na maioria dos sistemas)
python -m http.server 8080

# Acesse:
# http://localhost:8080
```

### Opção 2 — Deploy no GitHub Pages

```bash
# 1. Fork ou crie um novo repositório no GitHub

# 2. Clone e adicione os arquivos
git clone https://github.com/seu-usuario/city-mapper.git
cd city-mapper

# 3. Faça commit dos arquivos
git add .
git commit -m "🏙️ Initial commit - CityMapper"
git push origin main

# 4. Ative o GitHub Pages:
#    → Repositório → Settings → Pages
#    → Source: Deploy from a branch
#    → Branch: main / (root)
#    → Save

# 5. Acesse em:
#    https://seu-usuario.github.io/city-mapper/
```

### Opção 3 — Deploy via GitHub Actions (automático)

Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy CityMapper

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 📁 Estrutura do Projeto

```
city-mapper/
│
├── 📄 index.html              # Estrutura HTML principal
│
├── 📁 css/
│   └── 🎨 style.css          # Estilos completos (dark theme)
│
├── 📁 js/
│   ├── 🗂️  grid.js            # Sistema de grade e snap
│   ├── ↩️  history.js         # Undo/Redo (pilha de estados)
│   ├── 💾  storage.js         # Salvar, carregar, exportar
│   ├── 🛠️  tools.js           # Presets de estruturas e vias
│   ├── 🖼️  canvas.js          # Motor de renderização (Canvas API)
│   └── 🚀  app.js             # Inicialização e event handlers
│
├── 📄 README.md               # Este arquivo
└── 📄 .github/
    └── workflows/
        └── deploy.yml         # GitHub Actions (opcional)
```

### Responsabilidade de Cada Arquivo

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Layout, painéis, modais, canvas |
| `style.css` | Dark theme, responsividade, animações |
| `grid.js` | Renderização da grade, função de snap |
| `history.js` | Pilha de undo/redo, limite de 50 estados |
| `storage.js` | LocalStorage, exportação PNG e JSON |
| `tools.js` | Configurações de vias, presets de estruturas |
| `canvas.js` | Engine Canvas: renderização, hit-test, câmera |
| `app.js` | Event listeners, atalhos, inicialização |

---

## 🔧 Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura e Canvas API |
| **CSS3** | Layout, animações, tema escuro |
| **JavaScript ES6+** | Lógica, classes, módulos |
| **Canvas 2D API** | Renderização vetorial |
| **LocalStorage API** | Persistência local |
| **File API** | Importação de arquivos JSON |
| **Blob API** | Exportação de arquivos |

> 🚫 **Zero dependências externas** — sem jQuery, React, Three.js ou qualquer biblioteca.

---

## 🗺️ Roadmap

### v1.0 — Atual ✅
- [x] Ferramentas de desenho (linha, polígono, retângulo, círculo)
- [x] Vias (rua, avenida, rodovia)
- [x] 12 estruturas pré-definidas
- [x] Sistema de camadas
- [x] Undo/Redo
- [x] Snap to Grid
- [x] Minimapa
- [x] Exportação PNG e JSON
- [x] Atalhos de teclado

### v1.1 — Planejado 🔜
- [ ] Ferramenta de seleção por área (lasso)
- [ ] Redimensionamento com handles visuais
- [ ] Rotação visual com mouse
- [ ] Cópia de estilos entre elementos
- [ ] Templates de cidades prontos

### v1.2 — Futuro 💭
- [ ] Exportação SVG
- [ ] Importação de imagem de fundo (planta baixa)
- [ ] Modo de impressão
- [ ] Temas de cores (noturno, satélite, esquemático)
- [ ] Tooltips de informação nos elementos

### v2.0 — Visão 🌟
- [ ] Colaboração em tempo real (WebSockets)
- [ ] Banco de símbolos urbanos expandido
- [ ] Sistema de zonas (zoneamento urbano)
- [ ] Geração procedural de blocos

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja como participar:

### Reportando Bugs

1. Abra uma [Issue](../../issues/new)
2. Descreva o comportamento esperado vs. atual
3. Informe o navegador e sistema operacional
4. Se possível, adicione um screenshot

### Sugerindo Features

1. Abra uma [Issue](../../issues/new) com a tag `enhancement`
2. Descreva o caso de uso
3. Adicione exemplos ou referências visuais

### Enviando Pull Requests

```bash
# 1. Fork o projeto
# 2. Crie sua branch
git checkout -b feature/minha-feature

# 3. Faça seus commits
git commit -m "✨ feat: adiciona minha feature"

# 4. Push para a branch
git push origin feature/minha-feature

# 5. Abra um Pull Request
```

### Padrão de Commits

```
✨ feat:     nova funcionalidade
🐛 fix:      correção de bug
🎨 style:    mudanças visuais/CSS
♻️  refactor: refatoração de código
📝 docs:     atualização de documentação
⚡ perf:     melhoria de performance
🧪 test:     adição de testes
```

---

## 📄 Licença

Distribuído sob a licença **MIT**.  
Veja o arquivo [LICENSE](LICENSE) para mais informações.

```
MIT License — você pode usar, copiar, modificar e distribuir
este projeto livremente, inclusive para fins comerciais,
desde que mantenha os créditos originais.
```

---

## 👤 Autor

Feito com ❤️ e muito café ☕

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [seu-perfil](https://linkedin.com/in/seu-perfil)

---

## 🙏 Agradecimentos

Inspirado por:
- [OpenStreetMap](https://www.openstreetmap.org/) — mapeamento colaborativo
- [Floorplanner](https://floorplanner.com/) — editor de plantas baixas
- [Excalidraw](https://excalidraw.com/) — desenho colaborativo no navegador
- [tldraw](https://www.tldraw.com/) — canvas infinito minimalista

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela no repositório! ⭐**

![Made with Love](https://img.shields.io/badge/Feito%20com-❤️-e94560?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open-Source-4CAF50?style=for-the-badge)

</div>
```
