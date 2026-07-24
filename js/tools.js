/**
 * TOOLS MODULE
 * Define os tipos de elementos e estruturas pré-definidas
 */
const StructurePresets = {
    house: {
        type: 'rectangle',
        category: 'residential',
        fill: '#66BB6A',
        stroke: '#2E7D32',
        strokeWidth: 2,
        width: 60,
        height: 40,
        name: 'Casa',
        icon: '🏠'
    },
    building: {
        type: 'rectangle',
        category: 'residential',
        fill: '#78909C',
        stroke: '#37474F',
        strokeWidth: 2,
        width: 80,
        height: 100,
        name: 'Prédio',
        icon: '🏢'
    },
    commercial: {
        type: 'rectangle',
        category: 'commercial',
        fill: '#FFB74D',
        stroke: '#E65100',
        strokeWidth: 2,
        width: 100,
        height: 60,
        name: 'Comércio',
        icon: '🏪'
    },
    industrial: {
        type: 'rectangle',
        category: 'industrial',
        fill: '#A1887F',
        stroke: '#4E342E',
        strokeWidth: 2,
        width: 140,
        height: 100,
        name: 'Indústria',
        icon: '🏭'
    },
    park: {
        type: 'rectangle',
        category: 'recreational',
        fill: '#81C784',
        stroke: '#388E3C',
        strokeWidth: 2,
        width: 160,
        height: 120,
        name: 'Parque',
        icon: '🌳',
        opacity: 0.6
    },
    hospital: {
        type: 'rectangle',
        category: 'institutional',
        fill: '#EF5350',
        stroke: '#B71C1C',
        strokeWidth: 2,
        width: 120,
        height: 80,
        name: 'Hospital',
        icon: '🏥'
    },
    school: {
        type: 'rectangle',
        category: 'institutional',
        fill: '#42A5F5',
        stroke: '#1565C0',
        strokeWidth: 2,
        width: 100,
        height: 80,
        name: 'Escola',
        icon: '🏫'
    },
    church: {
        type: 'polygon',
        category: 'institutional',
        fill: '#CE93D8',
        stroke: '#6A1B9A',
        strokeWidth: 2,
        width: 60,
        height: 80,
        name: 'Igreja',
        icon: '⛪'
    },
    stadium: {
        type: 'circle',
        category: 'recreational',
        fill: '#4DB6AC',
        stroke: '#00695C',
        strokeWidth: 3,
        radius: 80,
        name: 'Estádio',
        icon: '🏟️'
    },
    parking: {
        type: 'rectangle',
        category: 'infrastructure',
        fill: '#90A4AE',
        stroke: '#455A64',
        strokeWidth: 1,
        width: 100,
        height: 80,
        name: 'Estacionamento',
        icon: '🅿️'
    },
    water: {
        type: 'polygon',
        category: 'natural',
        fill: '#29B6F6',
        stroke: '#0277BD',
        strokeWidth: 2,
        width: 120,
        height: 80,
        name: 'Água',
        icon: '💧',
        opacity: 0.7
    },
    plaza: {
        type: 'rectangle',
        category: 'recreational',
        fill: '#FFCC80',
        stroke: '#EF6C00',
        strokeWidth: 2,
        width: 100,
        height: 100,
        name: 'Praça',
        icon: '⛲'
    }
};

const RoadTypes = {
    street: {
        width: 12,
        color: '#616161',
        borderColor: '#424242',
        borderWidth: 1,
        name: 'Rua',
        dashPattern: []
    },
    avenue: {
        width: 24,
        color: '#757575',
        borderColor: '#424242',
        borderWidth: 2,
        name: 'Avenida',
        dashPattern: [],
        divider: true,
        dividerColor: '#FFEB3B'
    },
    highway: {
        width: 36,
        color: '#546E7A',
        borderColor: '#263238',
        borderWidth: 3,
        name: 'Rodovia',
        dashPattern: [],
        divider: true,
        dividerColor: '#FFF'
    }
};

// Gerador de IDs únicos
let _elementIdCounter = 0;
function generateId() {
    return 'el_' + Date.now().toString(36) + '_' + (++_elementIdCounter);
}
