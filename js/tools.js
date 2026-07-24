/**
 * TOOLS MODULE
 * Define os tipos de elementos e estruturas pré-definidas
 * Inclui sistema de interseção de vias
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
        width: 14,
        color: '#616161',
        borderColor: '#424242',
        borderWidth: 1,
        name: 'Rua',
        dashPattern: [],
        priority: 1
    },
    avenue: {
        width: 26,
        color: '#757575',
        borderColor: '#424242',
        borderWidth: 2,
        name: 'Avenida',
        dashPattern: [],
        divider: true,
        dividerColor: '#FFEB3B',
        priority: 2
    },
    highway: {
        width: 38,
        color: '#546E7A',
        borderColor: '#263238',
        borderWidth: 3,
        name: 'Rodovia',
        dashPattern: [],
        divider: true,
        dividerColor: '#FFF',
        priority: 3
    }
};

// Gerador de IDs únicos
let _elementIdCounter = 0;
function generateId() {
    return 'el_' + Date.now().toString(36) + '_' + (++_elementIdCounter);
}

/**
 * ROAD NETWORK
 * Sistema de rede viária com interseções inteligentes
 */
const RoadNetwork = {

    SNAP_DISTANCE: 15,
    INTERSECTION_RADIUS_FACTOR: 0.6,

    // Encontra o ponto mais próximo em qualquer via existente
    findSnapPoint(wx, wy, roads, excludeId) {
        let bestDist = this.SNAP_DISTANCE;
        let bestPoint = null;
        let bestRoad = null;
        let bestSegIndex = -1;
        let bestType = null; // 'endpoint', 'segment', 'intersection'

        for (const road of roads) {
            if (road.id === excludeId) continue;
            if (road.type !== 'road') continue;

            // Verificar endpoints
            for (let i = 0; i < road.points.length; i++) {
                const p = road.points[i];
                const dist = Math.sqrt((wx - p.x) ** 2 + (wy - p.y) ** 2);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x: p.x, y: p.y };
                    bestRoad = road;
                    bestSegIndex = i;
                    bestType = (i === 0 || i === road.points.length - 1) ? 'endpoint' : 'midpoint';
                }
            }

            // Verificar projeção nos segmentos
            for (let i = 0; i < road.points.length - 1; i++) {
                const proj = this.projectPointOnSegment(
                    wx, wy,
                    road.points[i], road.points[i + 1]
                );
                if (proj && proj.dist < bestDist) {
                    bestDist = proj.dist;
                    bestPoint = { x: proj.x, y: proj.y };
                    bestRoad = road;
                    bestSegIndex = i;
                    bestType = 'segment';
                }
            }
        }

        if (bestPoint) {
            return {
                point: bestPoint,
                road: bestRoad,
                segmentIndex: bestSegIndex,
                type: bestType,
                distance: bestDist
            };
        }
        return null;
    },

    // Projeta um ponto sobre um segmento de reta
    projectPointOnSegment(px, py, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return null;

        let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
        t = Math.max(0.01, Math.min(0.99, t)); // evita colar nos endpoints

        const projX = a.x + t * dx;
        const projY = a.y + t * dy;
        const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

        return { x: projX, y: projY, t: t, dist: dist };
    },

    // Insere um ponto de conexão em uma via existente (split)
    splitRoadAtPoint(road, segmentIndex, point) {
        // Insere o ponto no array de pontos da via
        road.points.splice(segmentIndex + 1, 0, { x: point.x, y: point.y });
    },

    // Calcula todas as interseções entre vias
    findAllIntersections(roads) {
        const intersections = [];

        for (let i = 0; i < roads.length; i++) {
            if (roads[i].type !== 'road') continue;

            for (let j = i + 1; j < roads.length; j++) {
                if (roads[j].type !== 'road') continue;

                const hits = this.findRoadIntersections(roads[i], roads[j]);
                for (const hit of hits) {
                    intersections.push({
                        point: hit.point,
                        roads: [roads[i], roads[j]],
                        radius: Math.max(
                            roads[i].width || 14,
                            roads[j].width || 14
                        ) * this.INTERSECTION_RADIUS_FACTOR
                    });
                }
            }
        }

        // Também adicionar endpoints compartilhados
        for (let i = 0; i < roads.length; i++) {
            if (roads[i].type !== 'road') continue;
            for (let j = i + 1; j < roads.length; j++) {
                if (roads[j].type !== 'road') continue;

                const shared = this.findSharedEndpoints(roads[i], roads[j]);
                for (const sp of shared) {
                    // Evita duplicar se já existe uma interseção próxima
                    const alreadyExists = intersections.some(
                        inter => Math.sqrt(
                            (inter.point.x - sp.x) ** 2 +
                            (inter.point.y - sp.y) ** 2
                        ) < 5
                    );
                    if (!alreadyExists) {
                        intersections.push({
                            point: sp,
                            roads: [roads[i], roads[j]],
                            radius: Math.max(
                                roads[i].width || 14,
                                roads[j].width || 14
                            ) * this.INTERSECTION_RADIUS_FACTOR
                        });
                    }
                }
            }
        }

        return intersections;
    },

    // Encontra interseções entre segmentos de duas vias
    findRoadIntersections(roadA, roadB) {
        const hits = [];

        for (let i = 0; i < roadA.points.length - 1; i++) {
            for (let j = 0; j < roadB.points.length - 1; j++) {
                const inter = this.segmentIntersection(
                    roadA.points[i], roadA.points[i + 1],
                    roadB.points[j], roadB.points[j + 1]
                );
                if (inter) {
                    hits.push({
                        point: inter,
                        segA: i,
                        segB: j
                    });
                }
            }
        }

        return hits;
    },

    // Interseção entre dois segmentos de reta
    segmentIntersection(a1, a2, b1, b2) {
        const d1x = a2.x - a1.x;
        const d1y = a2.y - a1.y;
        const d2x = b2.x - b1.x;
        const d2y = b2.y - b1.y;

        const cross = d1x * d2y - d1y * d2x;
        if (Math.abs(cross) < 0.001) return null; // paralelos

        const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / cross;
        const u = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / cross;

        // Usa uma margem pequena para não contar endpoints puros
        if (t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99) {
            return {
                x: a1.x + t * d1x,
                y: a1.y + t * d1y
            };
        }

        return null;
    },

    // Encontra endpoints compartilhados entre duas vias
    findSharedEndpoints(roadA, roadB) {
        const shared = [];
        const threshold = 3;

        for (const pa of roadA.points) {
            for (const pb of roadB.points) {
                const dist = Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
                if (dist < threshold) {
                    shared.push({ x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 });
                }
            }
        }

        return shared;
    },

    // Calcula o ângulo entre duas vias em um ponto de interseção
    getAngleAtIntersection(road, point) {
        // Encontra o segmento mais próximo do ponto
        let bestIdx = 0;
        let bestDist = Infinity;

        for (let i = 0; i < road.points.length - 1; i++) {
            const mid = {
                x: (road.points[i].x + road.points[i + 1].x) / 2,
                y: (road.points[i].y + road.points[i + 1].y) / 2
            };
            const dist = Math.sqrt((mid.x - point.x) ** 2 + (mid.y - point.y) ** 2);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        }

        const seg = {
            dx: road.points[bestIdx + 1].x - road.points[bestIdx].x,
            dy: road.points[bestIdx + 1].y - road.points[bestIdx].y
        };

        return Math.atan2(seg.dy, seg.dx);
    },

    // Gera o polígono de um cruzamento
    getIntersectionPolygon(intersection) {
        const { point, roads, radius } = intersection;
        const angles = [];

        for (const road of roads) {
            const angle = this.getAngleAtIntersection(road, point);
            const halfW = (road.width || 14) / 2;

            // Adiciona os 4 cantos do cruzamento para esta via
            const perpAngle = angle + Math.PI / 2;
            angles.push({
                angle: perpAngle,
                dist: halfW
            });
            angles.push({
                angle: perpAngle + Math.PI,
                dist: halfW
            });
        }

        // Ordena por ângulo e gera polígono convexo
        angles.sort((a, b) => a.angle - b.angle);

        const poly = angles.map(a => ({
            x: point.x + Math.cos(a.angle) * a.dist * 1.15,
            y: point.y + Math.sin(a.angle) * a.dist * 1.15
        }));

        return poly;
    },

    // Coleta todas as conexões de um ponto (para desenhar entroncamentos)
    getConnectionsAtPoint(point, roads, threshold) {
        threshold = threshold || 5;
        const connections = [];

        for (const road of roads) {
            if (road.type !== 'road') continue;

            for (let i = 0; i < road.points.length; i++) {
                const p = road.points[i];
                const dist = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2);
                if (dist < threshold) {
                    // Determina a direção (vetor saindo do ponto)
                    let dx = 0, dy = 0;
                    if (i > 0) {
                        dx += road.points[i - 1].x - p.x;
                        dy += road.points[i - 1].y - p.y;
                    }
                    if (i < road.points.length - 1) {
                        dx += road.points[i + 1].x - p.x;
                        dy += road.points[i + 1].y - p.y;
                    }
                    const len = Math.sqrt(dx * dx + dy * dy);
                    if (len > 0) {
                        connections.push({
                            road: road,
                            pointIndex: i,
                            dirX: dx / len,
                            dirY: dy / len,
                            width: road.width || 14
                        });
                    }
                }
            }
        }

        return connections;
    }
};
