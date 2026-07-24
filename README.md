# CityMapper

CityMapper é um editor visual de mapas urbanos desenvolvido para navegador.

O projeto permite criar cidades de forma simples, desenhando linhas para representar ruas e polígonos ou formas para representar estruturas, áreas, terrenos e edificações.

Funciona totalmente no navegador, sem dependências externas, backend ou processo de build.

## Funcionalidades

- Desenho de ruas, avenidas e rodovias
- Criação de polígonos, retângulos e círculos
- Estruturas rápidas, como casas, parques, escolas e hospitais
- Seleção, movimentação e exclusão de elementos
- Edição de nome, cor, opacidade, posição e tamanho
- Grade visual com alinhamento automático (snap)
- Zoom e movimentação do mapa
- Camadas para organização dos elementos
- Minimapa e estatísticas do projeto
- Desfazer e refazer ações
- Salvamento automático no navegador
- Exportação do mapa em PNG
- Exportação e importação de projetos em JSON

## Como usar

### Criar ruas

1. Selecione Rua, Avenida ou Rodovia.
2. Clique no canvas para adicionar pontos.
3. Continue clicando para formar o trajeto.
4. Dê duplo clique para finalizar.

### Criar estruturas

1. Selecione Polígono, Retângulo ou Círculo.
2. Para polígonos, clique nos vértices e dê duplo clique para finalizar.
3. Para retângulos e círculos, clique e arraste no canvas.

### Inserir estruturas rápidas

1. Escolha uma estrutura no painel lateral.
2. Clique no mapa para posicioná-la.

### Editar elementos

1. Selecione um elemento.
2. Altere as propriedades no painel lateral direito.
3. Clique em “Aplicar”.

## Atalhos

| Tecla | Ação |
|---|---|
| `V` | Selecionar |
| `H` | Mover mapa |
| `S` | Rua |
| `A` | Avenida |
| `W` | Rodovia |
| `P` | Polígono |
| `R` | Retângulo |
| `C` | Círculo |
| `T` | Texto |
| `E` | Apagar |
| `M` | Medir distância |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` | Refazer |
| `Ctrl + S` | Salvar |
| `Delete` | Excluir seleção |
| `Esc` | Cancelar ação atual |

## Estruturas disponíveis

- Casa
- Prédio
- Comércio
- Indústria
- Parque
- Hospital
- Escola
- Igreja
- Estádio
- Estacionamento
- Água
- Praça

## Estrutura do projeto

```text
city-mapper/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── canvas.js
    ├── grid.js
    ├── history.js
    ├── storage.js
    └── tools.js
