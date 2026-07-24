/**
 * CANVAS MODULE
 * Motor de renderização e interação do canvas principal
 * Com sistema de interseção inteligente de vias
 */
class CityCanvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        this.camera = { x: 0, y: 0, zoom: 1 };

        this.elements = [];
        this.layers = [
            { id: 'layer_terrain', name: 'Terreno', visible: true, locked: false },
            { id: 'layer_roads', name: 'Vias', visible: true, locked: false },
            { id: 'layer_structures', name: 'Estruturas', visible: true, locked: false },
            { id: 'layer_labels', name: 'Rótulos', visible: true, locked: false }
        ];
        this.activeLayerId = 'layer_structures';

        this.selectedElements = [];
        this.hoveredElement = null;
        this.currentTool = 'select';

        this.isDrawing = false;
        this.drawingPoints = [];
        this.tempElement = null;
        this.dragStart = null;
        this.dragOffset = null;
        this.isPanning = false;
        this.panStart = null;
        this.shapeStart = null;
        this.placingStructure = null;

        this.measureStart = null;
        this.measureEnd = null;
        this.showLabels = false;

        // Road network state
        this.snapIndicator = null; // ponto de snap visual
        this.intersections = [];   // cache de interseções

        this.resize();
        this.setupEvents();
        this.render();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.camera.x * this.camera.zoom) / this.camera.zoom,
            y: (sy - this.camera.y * this.camera.zoom) / this.camera.zoom
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx + this.camera.x) * this.camera.zoom,
            y: (wy + this.camera.y) * this.camera.zoom
        };
    }

    getRoads() {
        return this.elements.filter(el => el.type === 'road');
    }

    rebuildIntersections() {
        this.intersections = RoadNetwork.findAllIntersections(this.elements);
    }

    // =================== EVENTS ===================

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onContextMenu(e);
        });
        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
    }

    onMouseDown(e) {
        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);
        const snapped = Grid.snapPoint(world.x, world.y);
        this.hideContextMenu();

        if (e.button === 1 || (this.currentTool === 'pan' && e.button === 0)) {
            this.isPanning = true;
            this.panStart = { x: sx, y: sy, cx: this.camera.x, cy: this.camera.y };
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        if (e.button !== 0) return;

        let wx = Grid.snapEnabled ? snapped.x : world.x;
        let wy = Grid.snapEnabled ? snapped.y : world.y;

        // Road snap tem prioridade sobre grid snap
        if (['street', 'avenue', 'highway'].includes(this.currentTool)) {
            const roadSnap = RoadNetwork.findSnapPoint(wx, wy, this.elements, null);
            if (roadSnap) {
                wx = roadSnap.point.x;
                wy = roadSnap.point.y;
            }
        }

        switch (this.currentTool) {
            case 'select': this.handleSelectDown(wx, wy, sx, sy, e); break;
            case 'street':
            case 'avenue':
            case 'highway': this.handleRoadDown(wx, wy); break;
            case 'polygon': this.handlePolygonDown(wx, wy); break;
            case 'rectangle': this.handleRectDown(wx, wy); break;
            case 'circle': this.handleCircleDown(wx, wy); break;
            case 'text': this.handleTextDown(wx, wy); break;
            case 'eraser': this.handleEraserDown(wx, wy); break;
            case 'measure': this.handleMeasureDown(wx, wy); break;
        }

        if (this.placingStructure) {
            this.placeStructure(wx, wy);
        }
    }

    onMouseMove(e) {
        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);
        const snapped = Grid.snapPoint(world.x, world.y);
        let wx = Grid.snapEnabled ? snapped.x : world.x;
        let wy = Grid.snapEnabled ? snapped.y : world.y;

        // Road snap indicator
        this.snapIndicator = null;
        if (['street', 'avenue', 'highway'].includes(this.currentTool)) {
            const roadSnap = RoadNetwork.findSnapPoint(wx, wy, this.elements, null);
            if (roadSnap) {
                this.snapIndicator = roadSnap.point;
                wx = roadSnap.point.x;
                wy = roadSnap.point.y;
            }
        }

        document.getElementById('coords-display').textContent =
            `X: ${Math.round(wx)} | Y: ${Math.round(wy)}`;

        if (this.isPanning) {
            const dx = (sx - this.panStart.x) / this.camera.zoom;
            const dy = (sy - this.panStart.y) / this.camera.zoom;
            this.camera.x = this.panStart.cx + dx;
            this.camera.y = this.panStart.cy + dy;
            this.render();
            return;
        }

        switch (this.currentTool) {
            case 'select': this.handleSelectMove(wx, wy, sx, sy); break;
            case 'street':
            case 'avenue':
            case 'highway': this.handleRoadMove(wx, wy); break;
            case 'rectangle': this.handleRectMove(wx, wy); break;
            case 'circle': this.handleCircleMove(wx, wy); break;
            case 'polygon': this.handlePolygonMove(wx, wy); break;
            case 'measure': this.handleMeasureMove(wx, wy); break;
        }

        if (this.placingStructure) {
            this.tempElement = this.createStructureElement(this.placingStructure, wx, wy);
            this.render();
        }

        if (this.currentTool === 'select' || this.currentTool === 'eraser') {
            this.hoveredElement = this.hitTest(wx, wy);
            this.canvas.style.cursor = this.hoveredElement ? 'pointer' :
                (this.currentTool === 'select' ? 'default' : 'crosshair');
        }
    }

    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.currentTool === 'pan' ? 'grab' : 'crosshair';
            return;
        }

        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);
        const snapped = Grid.snapPoint(world.x, world.y);
        const wx = Grid.snapEnabled ? snapped.x : world.x;
        const wy = Grid.snapEnabled ? snapped.y : world.y;

        switch (this.currentTool) {
            case 'select': this.handleSelectUp(wx, wy); break;
            case 'rectangle': this.handleRectUp(wx, wy); break;
            case 'circle': this.handleCircleUp(wx, wy); break;
        }
    }

    onDoubleClick(e) {
        if (this.currentTool === 'polygon' && this.drawingPoints.length >= 3) {
            this.finishPolygon();
        }
        if (['street', 'avenue', 'highway'].includes(this.currentTool) && this.drawingPoints.length >= 2) {
            this.finishRoad();
        }
    }

    onWheel(e) {
        e.preventDefault();
        const { sx, sy } = this.getMousePos(e);
        const worldBefore = this.screenToWorld(sx, sy);
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom * zoomFactor));
        const worldAfter = this.screenToWorld(sx, sy);
        this.camera.x += (worldAfter.x - worldBefore.x);
        this.camera.y += (worldAfter.y - worldBefore.y);
        document.getElementById('zoom-level').textContent = Math.round(this.camera.zoom * 100) + '%';
        this.render();
    }

    onContextMenu(e) {
        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);
        const element = this.hitTest(world.x, world.y);
        if (element) {
            this.selectedElements = [element];
            this.showContextMenu(e.clientX, e.clientY);
            this.render();
        }
    }

    // =================== SELECT ===================

    handleSelectDown(wx, wy, sx, sy, e) {
        const element = this.hitTest(wx, wy);
        if (element) {
            if (e.shiftKey) {
                const idx = this.selectedElements.indexOf(element);
                if (idx >= 0) this.selectedElements.splice(idx, 1);
                else this.selectedElements.push(element);
            } else {
                if (!this.selectedElements.includes(element))
                    this.selectedElements = [element];
            }
            this.dragStart = { x: wx, y: wy };
            this.dragOffset = this.selectedElements.map(el => ({
                el, ox: el.x - wx, oy: el.y - wy
            }));
        } else {
            this.selectedElements = [];
        }
        this.updatePropertiesPanel();
        this.render();
    }

    handleSelectMove(wx, wy) {
        if (this.dragStart && this.dragOffset) {
            this.dragOffset.forEach(({ el, ox, oy }) => {
                const nx = Grid.snapEnabled ? Grid.snap(wx + ox) : wx + ox;
                const ny = Grid.snapEnabled ? Grid.snap(wy + oy) : wy + oy;

                // Se for road, mover todos os pontos
                if (el.type === 'road' && el.points) {
                    const ddx = nx - el.x;
                    const ddy = ny - el.y;
                    for (const p of el.points) {
                        p.x += ddx;
                        p.y += ddy;
                    }
                }
                el.x = nx;
                el.y = ny;
            });
            this.render();
        }
    }

    handleSelectUp() {
        if (this.dragStart) {
            this.dragStart = null;
            this.dragOffset = null;
            this.rebuildIntersections();
            this.saveState();
        }
    }

    // =================== ROADS (com snap inteligente) ===================

    handleRoadDown(wx, wy) {
        // Tenta snap em via existente
        const snap = RoadNetwork.findSnapPoint(wx, wy, this.elements, null);

        if (snap && snap.type === 'segment') {
            // Insere um nó na via existente para criar um ponto de conexão
            RoadNetwork.splitRoadAtPoint(snap.road, snap.segmentIndex, snap.point);
            this.drawingPoints.push({ x: snap.point.x, y: snap.point.y });
        } else if (snap) {
            this.drawingPoints.push({ x: snap.point.x, y: snap.point.y });
        } else {
            this.drawingPoints.push({ x: wx, y: wy });
        }

        this.render();
    }

    handleRoadMove(wx, wy) {
        if (this.drawingPoints.length > 0) {
            // Snap check para preview
            const snap = RoadNetwork.findSnapPoint(wx, wy, this.elements, null);
            let endX = wx, endY = wy;
            if (snap) {
                endX = snap.point.x;
                endY = snap.point.y;
                this.snapIndicator = snap.point;
            }

            this.tempElement = {
                id: 'temp',
                type: 'road',
                roadType: this.currentTool,
                points: [...this.drawingPoints, { x: endX, y: endY }],
                ...RoadTypes[this.currentTool],
                layerId: 'layer_roads'
            };
            this.render();
        }
    }

    finishRoad() {
        if (this.drawingPoints.length < 2) return;

        const roadType = RoadTypes[this.currentTool];

        // Snap do último ponto
        const lastPt = this.drawingPoints[this.drawingPoints.length - 1];
        const snap = RoadNetwork.findSnapPoint(lastPt.x, lastPt.y, this.elements, null);
        if (snap && snap.type === 'segment') {
            RoadNetwork.splitRoadAtPoint(snap.road, snap.segmentIndex, snap.point);
            this.drawingPoints[this.drawingPoints.length - 1] = {
                x: snap.point.x, y: snap.point.y
            };
        }

        const element = {
            id: generateId(),
            type: 'road',
            roadType: this.currentTool,
            points: [...this.drawingPoints],
            x: this.drawingPoints[0].x,
            y: this.drawingPoints[0].y,
            width: roadType.width,
            color: roadType.color,
            borderColor: roadType.borderColor,
            borderWidth: roadType.borderWidth,
            name: roadType.name,
            divider: roadType.divider || false,
            dividerColor: roadType.dividerColor || '#FFF',
            priority: roadType.priority || 1,
            layerId: 'layer_roads',
            locked: false,
            opacity: 1
        };

        this.elements.push(element);
        this.drawingPoints = [];
        this.tempElement = null;
        this.snapIndicator = null;
        this.rebuildIntersections();
        this.saveState();
        this.render();
    }

    // =================== POLYGON ===================

    handlePolygonDown(wx, wy) {
        this.drawingPoints.push({ x: wx, y: wy });
        this.render();
    }

    handlePolygonMove(wx, wy) {
        if (this.drawingPoints.length > 0) {
            this.tempElement = {
                id: 'temp', type: 'polygon',
                points: [...this.drawingPoints, { x: wx, y: wy }],
                fill: '#4CAF50', stroke: '#333', strokeWidth: 2, opacity: 0.8
            };
            this.render();
        }
    }

    finishPolygon() {
        if (this.drawingPoints.length < 3) return;
        const bounds = this.getPointsBounds(this.drawingPoints);
        const element = {
            id: generateId(), type: 'polygon',
            points: [...this.drawingPoints],
            x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h,
            fill: '#4CAF50', stroke: '#333333', strokeWidth: 2,
            name: 'Polígono', category: 'residential',
            layerId: this.activeLayerId, locked: false, opacity: 0.8, rotation: 0
        };
        this.elements.push(element);
        this.drawingPoints = [];
        this.tempElement = null;
        this.saveState();
        this.render();
    }

    // =================== RECTANGLE ===================

    handleRectDown(wx, wy) {
        this.shapeStart = { x: wx, y: wy };
        this.isDrawing = true;
    }

    handleRectMove(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;
        const x = Math.min(this.shapeStart.x, wx);
        const y = Math.min(this.shapeStart.y, wy);
        this.tempElement = {
            id: 'temp', type: 'rectangle', x, y,
            width: Math.abs(wx - this.shapeStart.x),
            height: Math.abs(wy - this.shapeStart.y),
            fill: '#4CAF50', stroke: '#333', strokeWidth: 2, opacity: 0.8
        };
        this.render();
    }

    handleRectUp(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;
        this.isDrawing = false;
        const x = Math.min(this.shapeStart.x, wx);
        const y = Math.min(this.shapeStart.y, wy);
        const w = Math.abs(wx - this.shapeStart.x);
        const h = Math.abs(wy - this.shapeStart.y);
        if (w < 5 || h < 5) {
            this.shapeStart = null; this.tempElement = null; this.render(); return;
        }
        this.elements.push({
            id: generateId(), type: 'rectangle', x, y, width: w, height: h,
            fill: '#4CAF50', stroke: '#333333', strokeWidth: 2,
            name: 'Retângulo', category: 'residential',
            layerId: this.activeLayerId, locked: false, opacity: 0.8, rotation: 0
        });
        this.shapeStart = null; this.tempElement = null;
        this.saveState(); this.render();
    }

    // =================== CIRCLE ===================

    handleCircleDown(wx, wy) {
        this.shapeStart = { x: wx, y: wy };
        this.isDrawing = true;
    }

    handleCircleMove(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;
        const radius = Math.sqrt((wx - this.shapeStart.x) ** 2 + (wy - this.shapeStart.y) ** 2);
        this.tempElement = {
            id: 'temp', type: 'circle',
            x: this.shapeStart.x, y: this.shapeStart.y, radius,
            fill: '#4CAF50', stroke: '#333', strokeWidth: 2, opacity: 0.8
        };
        this.render();
    }

    handleCircleUp(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;
        this.isDrawing = false;
        const radius = Math.sqrt((wx - this.shapeStart.x) ** 2 + (wy - this.shapeStart.y) ** 2);
        if (radius < 5) {
            this.shapeStart = null; this.tempElement = null; this.render(); return;
        }
        this.elements.push({
            id: generateId(), type: 'circle',
            x: this.shapeStart.x, y: this.shapeStart.y, radius,
            width: radius * 2, height: radius * 2,
            fill: '#4CAF50', stroke: '#333333', strokeWidth: 2,
            name: 'Círculo', category: 'residential',
            layerId: this.activeLayerId, locked: false, opacity: 0.8, rotation: 0
        });
        this.shapeStart = null; this.tempElement = null;
        this.saveState(); this.render();
    }

    // =================== TEXT ===================

    handleTextDown(wx, wy) {
        const modal = document.getElementById('text-modal');
        modal.classList.remove('hidden');
        document.getElementById('text-input').value = '';
        document.getElementById('text-input').focus();

        const onOk = () => {
            const text = document.getElementById('text-input').value.trim();
            if (text) {
                this.elements.push({
                    id: generateId(), type: 'text', x: wx, y: wy, text,
                    fontSize: parseInt(document.getElementById('text-size').value) || 16,
                    fill: document.getElementById('text-color').value,
                    name: text, layerId: 'layer_labels', locked: false,
                    opacity: 1, rotation: 0, width: 0, height: 0
                });
                this.saveState(); this.render();
            }
            modal.classList.add('hidden'); cleanup();
        };
        const onCancel = () => { modal.classList.add('hidden'); cleanup(); };
        const cleanup = () => {
            document.getElementById('text-ok').removeEventListener('click', onOk);
            document.getElementById('text-cancel').removeEventListener('click', onCancel);
        };
        document.getElementById('text-ok').addEventListener('click', onOk);
        document.getElementById('text-cancel').addEventListener('click', onCancel);
    }

    // =================== ERASER ===================

    handleEraserDown(wx, wy) {
        const element = this.hitTest(wx, wy);
        if (element) {
            this.elements = this.elements.filter(el => el.id !== element.id);
            this.selectedElements = this.selectedElements.filter(el => el.id !== element.id);
            this.rebuildIntersections();
            this.saveState(); this.render();
        }
    }

    // =================== MEASURE ===================

    handleMeasureDown(wx, wy) {
        if (!this.measureStart) {
            this.measureStart = { x: wx, y: wy };
        } else {
            this.measureStart = null; this.measureEnd = null; this.render();
        }
    }

    handleMeasureMove(wx, wy) {
        if (this.measureStart) { this.measureEnd = { x: wx, y: wy }; this.render(); }
    }

    // =================== STRUCTURES ===================

    createStructureElement(structType, wx, wy) {
        const preset = StructurePresets[structType];
        if (!preset) return null;
        if (preset.type === 'circle') {
            return {
                id: 'temp', type: 'circle', x: wx, y: wy,
                radius: preset.radius || 40,
                fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth,
                name: preset.name, icon: preset.icon, opacity: preset.opacity || 0.8
            };
        }
        return {
            id: 'temp', type: 'rectangle',
            x: wx - (preset.width || 60) / 2, y: wy - (preset.height || 40) / 2,
            width: preset.width || 60, height: preset.height || 40,
            fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth,
            name: preset.name, icon: preset.icon, opacity: preset.opacity || 0.8
        };
    }

    placeStructure(wx, wy) {
        const preset = StructurePresets[this.placingStructure];
        if (!preset) return;
        let element;
        if (preset.type === 'circle') {
            element = {
                id: generateId(), type: 'circle', x: wx, y: wy,
                radius: preset.radius || 40,
                width: (preset.radius || 40) * 2, height: (preset.radius || 40) * 2,
                fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth,
                name: preset.name, icon: preset.icon, category: preset.category,
                layerId: this.activeLayerId, locked: false,
                opacity: preset.opacity || 0.8, rotation: 0
            };
        } else {
            element = {
                id: generateId(), type: 'rectangle',
                x: wx - (preset.width || 60) / 2, y: wy - (preset.height || 40) / 2,
                width: preset.width || 60, height: preset.height || 40,
                fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth,
                name: preset.name, icon: preset.icon, category: preset.category,
                layerId: this.activeLayerId, locked: false,
                opacity: preset.opacity || 0.8, rotation: 0
            };
        }
        this.elements.push(element);
        this.placingStructure = null; this.tempElement = null;
        this.saveState(); this.render();
    }

    // =================== HIT TESTING ===================

    hitTest(wx, wy) {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            const layer = this.layers.find(l => l.id === el.layerId);
            if (layer && (!layer.visible || layer.locked)) continue;
            if (el.locked) continue;
            if (this.isPointInElement(wx, wy, el)) return el;
        }
        return null;
    }

    isPointInElement(wx, wy, el) {
        switch (el.type) {
            case 'rectangle':
                return wx >= el.x && wx <= el.x + el.width &&
                       wy >= el.y && wy <= el.y + el.height;
            case 'circle':
                return ((wx - el.x) ** 2 + (wy - el.y) ** 2) <= el.radius ** 2;
            case 'polygon':
                return this.pointInPolygon(wx, wy, el.points);
            case 'road':
                return this.pointNearPolyline(wx, wy, el.points, el.width / 2 + 5);
            case 'text':
                const tw = (el.text || '').length * el.fontSize * 0.6;
                return wx >= el.x && wx <= el.x + tw && wy >= el.y - el.fontSize && wy <= el.y;
            default: return false;
        }
    }

    pointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi))
                inside = !inside;
        }
        return inside;
    }

    pointNearPolyline(x, y, points, threshold) {
        for (let i = 0; i < points.length - 1; i++) {
            if (this.distToSegment({ x, y }, points[i], points[i + 1]) < threshold) return true;
        }
        return false;
    }

    distToSegment(p, v, w) {
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = Math.max(0, Math.min(1,
            ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
        ));
        const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
    }

    getPointsBounds(points) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    // =================== RENDERING ===================

    render() {
        const ctx = this.ctx;
        const { zoom } = this.camera;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        Grid.draw(ctx, this.camera);

        ctx.save();
        ctx.translate(this.camera.x * zoom, this.camera.y * zoom);
        ctx.scale(zoom, zoom);

        // --- DRAW ROADS MERGED ---
        this.drawRoadNetwork(ctx);

        // --- DRAW NON-ROAD ELEMENTS BY LAYER ---
        for (const layer of this.layers) {
            if (!layer.visible) continue;
            if (layer.id === 'layer_roads') continue; // roads drawn above
            const layerEls = this.elements.filter(el => el.layerId === layer.id);
            for (const el of layerEls) this.drawElement(ctx, el);
        }

        // Orphan non-road elements
        const orphans = this.elements.filter(el =>
            el.type !== 'road' && !this.layers.some(l => l.id === el.layerId)
        );
        for (const el of orphans) this.drawElement(ctx, el);

        // Temp element
        if (this.tempElement) {
            ctx.globalAlpha = 0.6;
            if (this.tempElement.type === 'road') {
                this.drawRoadElement(ctx, this.tempElement);
            } else {
                this.drawElement(ctx, this.tempElement);
            }
            ctx.globalAlpha = 1;
        }

        // Drawing points preview
        if (this.drawingPoints.length > 0) this.drawPointsPreview(ctx);

        // Selection indicators
        for (const sel of this.selectedElements) this.drawSelectionBox(ctx, sel);

        // Snap indicator
        if (this.snapIndicator) {
            ctx.beginPath();
            ctx.arc(this.snapIndicator.x, this.snapIndicator.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#00E676';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.snapIndicator.x, this.snapIndicator.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#00E676';
            ctx.fill();
        }

        // Measure
        if (this.measureStart && this.measureEnd) this.drawMeasureLine(ctx);

        ctx.restore();

        this.renderMinimap();
        Storage.autoSave(this.getProjectData());
    }

    // =================== ROAD NETWORK RENDERING ===================

    drawRoadNetwork(ctx) {
        const roadsLayer = this.layers.find(l => l.id === 'layer_roads');
        if (roadsLayer && !roadsLayer.visible) return;

        const roads = this.getRoads();
        if (roads.length === 0) return;

        // Ordena por prioridade (menores desenham primeiro, ficam embaixo)
        const sorted = [...roads].sort((a, b) => (a.priority || 1) - (b.priority || 1));

        // PASSO 1: Desenhar as bordas de todas as vias
        for (const road of sorted) {
            this.drawRoadBorder(ctx, road);
        }

        // PASSO 2: Desenhar as interseções (bordas)
        for (const inter of this.intersections) {
            this.drawIntersectionBorder(ctx, inter);
        }

        // PASSO 3: Desenhar o preenchimento de todas as vias
        for (const road of sorted) {
            this.drawRoadFill(ctx, road);
        }

        // PASSO 4: Desenhar o preenchimento das interseções
        for (const inter of this.intersections) {
            this.drawIntersectionFill(ctx, inter);
        }

        // PASSO 5: Desenhar divisórias (por cima de tudo, mas cortadas nas interseções)
        for (const road of sorted) {
            if (road.divider) {
                this.drawRoadDivider(ctx, road);
            }
        }

        // PASSO 6: Labels das vias
        if (this.showLabels) {
            for (const road of sorted) {
                this.drawRoadLabel(ctx, road);
            }
        }
    }

    drawRoadBorder(ctx, road) {
        if (!road.points || road.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(road.points[0].x, road.points[0].y);
        for (let i = 1; i < road.points.length; i++) {
            ctx.lineTo(road.points[i].x, road.points[i].y);
        }
        ctx.strokeStyle = road.borderColor || '#424242';
        ctx.lineWidth = (road.width || 14) + (road.borderWidth || 1) * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    drawRoadFill(ctx, road) {
        if (!road.points || road.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(road.points[0].x, road.points[0].y);
        for (let i = 1; i < road.points.length; i++) {
            ctx.lineTo(road.points[i].x, road.points[i].y);
        }
        ctx.strokeStyle = road.color || '#616161';
        ctx.lineWidth = road.width || 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    drawRoadDivider(ctx, road) {
        if (!road.points || road.points.length < 2) return;

        // Coletar zonas de interseção para cortar a divisória
        const interZones = [];
        for (const inter of this.intersections) {
            if (inter.roads.includes(road)) {
                interZones.push({
                    x: inter.point.x,
                    y: inter.point.y,
                    radius: inter.radius + 4
                });
            }
        }

        // Desenha a divisória segmento por segmento, pulando interseções
        for (let i = 0; i < road.points.length - 1; i++) {
            const a = road.points[i];
            const b = road.points[i + 1];

            // Verifica se o segmento passa por alguma interseção
            const clipped = this.clipSegmentByZones(a, b, interZones);

            for (const seg of clipped) {
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.strokeStyle = road.dividerColor || '#FFEB3B';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.lineCap = 'butt';
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // Corta um segmento removendo as partes que estão dentro de zonas circulares
    clipSegmentByZones(a, b, zones) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const segLen = Math.sqrt(dx * dx + dy * dy);
        if (segLen === 0) return [];

        // Parametriza o segmento em t (0 a 1)
        let intervals = [{ start: 0, end: 1 }];

        for (const zone of zones) {
            const newIntervals = [];
            for (const interval of intervals) {
                // Encontra onde o círculo intercepta o segmento parametrizado
                const cx = zone.x - a.x;
                const cy = zone.y - a.y;
                const A = dx * dx + dy * dy;
                const B = -2 * (cx * dx + cy * dy);
                const C = cx * cx + cy * cy - zone.radius * zone.radius;
                const disc = B * B - 4 * A * C;

                if (disc < 0) {
                    // Sem interseção com este círculo
                    newIntervals.push(interval);
                    continue;
                }

                const sqrtDisc = Math.sqrt(disc);
                let t1 = (-B - sqrtDisc) / (2 * A);
                let t2 = (-B + sqrtDisc) / (2 * A);

                // Clampa ao intervalo atual
                t1 = Math.max(interval.start, t1);
                t2 = Math.min(interval.end, t2);

                if (t1 >= t2) {
                    newIntervals.push(interval);
                    continue;
                }

                // Parte antes do círculo
                if (interval.start < t1) {
                    newIntervals.push({ start: interval.start, end: t1 });
                }
                // Parte depois do círculo
                if (t2 < interval.end) {
                    newIntervals.push({ start: t2, end: interval.end });
                }
            }
            intervals = newIntervals;
        }

        // Converte intervalos de volta para coordenadas
        return intervals.map(iv => ({
            x1: a.x + dx * iv.start,
            y1: a.y + dy * iv.start,
            x2: a.x + dx * iv.end,
            y2: a.y + dy * iv.end
        }));
    }

    drawIntersectionBorder(ctx, inter) {
        const poly = RoadNetwork.getIntersectionPolygon(inter);
        if (poly.length < 3) return;

        // Pega a cor da borda da via de maior prioridade
        const maxRoad = inter.roads.reduce((a, b) =>
            (a.priority || 1) >= (b.priority || 1) ? a : b
        );

        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = maxRoad.borderColor || '#424242';
        ctx.fill();
    }

    drawIntersectionFill(ctx, inter) {
        const { point, roads } = inter;
        const maxRoad = roads.reduce((a, b) =>
            (a.priority || 1) >= (b.priority || 1) ? a : b
        );
        const maxWidth = Math.max(...roads.map(r => r.width || 14));
        const radius = maxWidth * 0.65;

        // Círculo preenchido com a cor da via principal
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = maxRoad.color || '#616161';
        ctx.fill();
    }

    drawRoadLabel(ctx, road) {
        if (!road.name || !road.points || road.points.length < 2) return;
        const mid = Math.floor(road.points.length / 2);
        const p = road.points[mid];
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(road.name, p.x, p.y - road.width / 2 - 6);
        ctx.fillText(road.name, p.x, p.y - road.width / 2 - 6);
    }

    // Fallback para desenhar uma via sozinha (preview)
    drawRoadElement(ctx, el) {
        if (!el.points || el.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.strokeStyle = el.borderColor || '#424242';
        ctx.lineWidth = (el.width || 14) + (el.borderWidth || 1) * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.strokeStyle = el.color || '#616161';
        ctx.lineWidth = el.width || 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        if (el.divider) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
                ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.strokeStyle = el.dividerColor || '#FFEB3B';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.lineCap = 'butt';
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // =================== NON-ROAD ELEMENT DRAWING ===================

    drawElement(ctx, el) {
        if (el.type === 'road') return; // roads are drawn by drawRoadNetwork
        ctx.save();
        if (el.opacity !== undefined) ctx.globalAlpha *= el.opacity;
        if (el.rotation && el.type !== 'text') {
            const cx = el.x + (el.width || 0) / 2;
            const cy = el.y + (el.height || 0) / 2;
            ctx.translate(cx, cy);
            ctx.rotate((el.rotation || 0) * Math.PI / 180);
            ctx.translate(-cx, -cy);
        }
        switch (el.type) {
            case 'rectangle': this.drawRectangle(ctx, el); break;
            case 'circle': this.drawCircle(ctx, el); break;
            case 'polygon': this.drawPolygon(ctx, el); break;
            case 'text': this.drawText(ctx, el); break;
        }
        ctx.restore();
    }

    drawRectangle(ctx, el) {
        ctx.fillStyle = el.fill || '#4CAF50';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.strokeWidth > 0) {
            ctx.strokeStyle = el.stroke || '#333';
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
        if (el.icon) {
            ctx.font = `${Math.min(el.width, el.height) * 0.4}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillText(el.icon, el.x + el.width / 2, el.y + el.height / 2);
        }
        if (this.showLabels && el.name) {
            ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.strokeText(el.name, el.x + el.width / 2, el.y + el.height + 4);
            ctx.fillText(el.name, el.x + el.width / 2, el.y + el.height + 4);
        }
    }

    drawCircle(ctx, el) {
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
        ctx.fillStyle = el.fill || '#4CAF50';
        ctx.fill();
        if (el.strokeWidth > 0) {
            ctx.strokeStyle = el.stroke || '#333';
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
        }
        if (el.icon) {
            ctx.font = `${el.radius * 0.6}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillText(el.icon, el.x, el.y);
        }
        if (this.showLabels && el.name) {
            ctx.font = '10px Arial'; ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.strokeText(el.name, el.x, el.y + el.radius + 14);
            ctx.fillText(el.name, el.x, el.y + el.radius + 14);
        }
    }

    drawPolygon(ctx, el) {
        if (!el.points || el.points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
        ctx.closePath();
        ctx.fillStyle = el.fill || '#4CAF50';
        ctx.fill();
        if (el.strokeWidth > 0) {
            ctx.strokeStyle = el.stroke || '#333';
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
        }
        if (this.showLabels && el.name) {
            const b = this.getPointsBounds(el.points);
            ctx.font = '10px Arial'; ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.strokeText(el.name, b.x + b.w / 2, b.y + b.h / 2);
            ctx.fillText(el.name, b.x + b.w / 2, b.y + b.h / 2);
        }
    }

    drawText(ctx, el) {
        ctx.font = `${el.fontSize || 16}px Arial`;
        ctx.fillStyle = el.fill || '#333';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(el.text || '', el.x, el.y);
    }

    drawPointsPreview(ctx) {
        ctx.save();
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(this.drawingPoints[0].x, this.drawingPoints[0].y);
        for (let i = 1; i < this.drawingPoints.length; i++)
            ctx.lineTo(this.drawingPoints[i].x, this.drawingPoints[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
        for (const p of this.drawingPoints) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#e94560'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.restore();
    }

    drawSelectionBox(ctx, el) {
        ctx.save();
        ctx.strokeStyle = '#00BCD4';
        ctx.lineWidth = 2 / this.camera.zoom;
        ctx.setLineDash([6 / this.camera.zoom, 4 / this.camera.zoom]);

        let bounds;
        if (el.type === 'circle') {
            bounds = { x: el.x - el.radius, y: el.y - el.radius, w: el.radius * 2, h: el.radius * 2 };
        } else if (el.type === 'road' && el.points) {
            bounds = this.getPointsBounds(el.points);
            bounds.x -= el.width / 2; bounds.y -= el.width / 2;
            bounds.w += el.width; bounds.h += el.width;
        } else if (el.type === 'polygon' && el.points) {
            bounds = this.getPointsBounds(el.points);
        } else if (el.type === 'text') {
            const tw = (el.text || '').length * (el.fontSize || 16) * 0.6;
            bounds = { x: el.x - 2, y: el.y - 2, w: tw + 4, h: (el.fontSize || 16) + 4 };
        } else {
            bounds = { x: el.x, y: el.y, w: el.width || 0, h: el.height || 0 };
        }

        ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
        ctx.setLineDash([]);

        const hs = 6 / this.camera.zoom;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#00BCD4'; ctx.lineWidth = 1.5 / this.camera.zoom;
        const corners = [
            [bounds.x - 4, bounds.y - 4],
            [bounds.x + bounds.w + 4, bounds.y - 4],
            [bounds.x - 4, bounds.y + bounds.h + 4],
            [bounds.x + bounds.w + 4, bounds.y + bounds.h + 4],
        ];
        for (const [cx, cy] of corners) {
            ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
            ctx.strokeRect(cx - hs / 2, cy - hs / 2, hs, hs);
        }
        ctx.restore();
    }

    drawMeasureLine(ctx) {
        ctx.save();
        ctx.strokeStyle = '#FF9800'; ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(this.measureStart.x, this.measureStart.y);
        ctx.lineTo(this.measureEnd.x, this.measureEnd.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const dx = this.measureEnd.x - this.measureStart.x;
        const dy = this.measureEnd.y - this.measureStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mx = (this.measureStart.x + this.measureEnd.x) / 2;
        const my = (this.measureStart.y + this.measureEnd.y) / 2;

        ctx.font = '14px Arial'; ctx.textAlign = 'center';
        ctx.fillStyle = '#FF9800'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        const label = `${Math.round(dist)} px (${(dist * 0.5).toFixed(1)}m)`;
        ctx.strokeText(label, mx, my - 10);
        ctx.fillText(label, mx, my - 10);

        ctx.beginPath(); ctx.arc(this.measureStart.x, this.measureStart.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9800'; ctx.fill();
        ctx.beginPath(); ctx.arc(this.measureEnd.x, this.measureEnd.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // =================== MINIMAP ===================

    renderMinimap() {
        const minimap = document.getElementById('minimap');
        if (!minimap) return;
        const mctx = minimap.getContext('2d');
        const mw = minimap.width, mh = minimap.height;
        mctx.clearRect(0, 0, mw, mh);
        mctx.fillStyle = '#1a1a2e';
        mctx.fillRect(0, 0, mw, mh);
        if (this.elements.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of this.elements) {
            if (el.type === 'circle') {
                minX = Math.min(minX, el.x - el.radius); minY = Math.min(minY, el.y - el.radius);
                maxX = Math.max(maxX, el.x + el.radius); maxY = Math.max(maxY, el.y + el.radius);
            } else if ((el.type === 'road' || el.type === 'polygon') && el.points) {
                for (const p of el.points) {
                    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                }
            } else {
                minX = Math.min(minX, el.x || 0); minY = Math.min(minY, el.y || 0);
                maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
                maxY = Math.max(maxY, (el.y || 0) + (el.height || 0));
            }
        }

        const pad = 50;
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        const worldW = maxX - minX || 1, worldH = maxY - minY || 1;
        const scale = Math.min(mw / worldW, mh / worldH);
        const offX = (mw - worldW * scale) / 2, offY = (mh - worldH * scale) / 2;

        mctx.save();
        mctx.translate(offX, offY);
        mctx.scale(scale, scale);
        mctx.translate(-minX, -minY);

        for (const el of this.elements) {
            mctx.globalAlpha = 0.8;
            if (el.type === 'rectangle') {
                mctx.fillStyle = el.fill || '#4CAF50';
                mctx.fillRect(el.x, el.y, el.width, el.height);
            } else if (el.type === 'circle') {
                mctx.beginPath(); mctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
                mctx.fillStyle = el.fill || '#4CAF50'; mctx.fill();
            } else if (el.type === 'polygon' && el.points) {
                mctx.beginPath(); mctx.moveTo(el.points[0].x, el.points[0].y);
                for (let i = 1; i < el.points.length; i++) mctx.lineTo(el.points[i].x, el.points[i].y);
                mctx.closePath(); mctx.fillStyle = el.fill || '#4CAF50'; mctx.fill();
            } else if (el.type === 'road' && el.points) {
                mctx.beginPath(); mctx.moveTo(el.points[0].x, el.points[0].y);
                for (let i = 1; i < el.points.length; i++) mctx.lineTo(el.points[i].x, el.points[i].y);
                mctx.strokeStyle = el.color || '#616161';
                mctx.lineWidth = el.width || 14;
                mctx.lineCap = 'round'; mctx.stroke();
            }
        }

        mctx.globalAlpha = 1;
        mctx.strokeStyle = '#e94560';
        mctx.lineWidth = 2 / scale;
        mctx.strokeRect(-this.camera.x, -this.camera.y,
            this.canvas.width / this.camera.zoom, this.canvas.height / this.camera.zoom);
        mctx.restore();
    }

    // =================== CONTEXT MENU ===================

    showContextMenu(x, y) {
        const menu = document.getElementById('context-menu');
        menu.classList.remove('hidden');
        menu.style.left = x + 'px'; menu.style.top = y + 'px';
    }

    hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
    }

    // =================== PROPERTIES PANEL ===================

    updatePropertiesPanel() {
        const noSel = document.getElementById('no-selection');
        const elProps = document.getElementById('element-props');
        const streetProps = document.getElementById('street-props');

        if (this.selectedElements.length === 0) {
            noSel.classList.remove('hidden'); elProps.classList.add('hidden'); return;
        }
        noSel.classList.add('hidden'); elProps.classList.remove('hidden');

        const el = this.selectedElements[0];
        document.getElementById('prop-name').value = el.name || '';
        document.getElementById('prop-type').value = el.category || 'residential';
        document.getElementById('prop-fill').value = el.fill || el.color || '#4CAF50';
        document.getElementById('prop-opacity').value = (el.opacity || 1) * 100;
        document.getElementById('opacity-val').textContent = Math.round((el.opacity || 1) * 100) + '%';
        document.getElementById('prop-stroke').value = el.stroke || el.borderColor || '#333333';
        document.getElementById('prop-stroke-width').value = el.strokeWidth || el.borderWidth || 2;
        document.getElementById('prop-x').value = Math.round(el.x || 0);
        document.getElementById('prop-y').value = Math.round(el.y || 0);
        document.getElementById('prop-w').value = Math.round(el.width || 0);
        document.getElementById('prop-h').value = Math.round(el.height || 0);
        document.getElementById('prop-rotation').value = el.rotation || 0;
        document.getElementById('rotation-val').textContent = (el.rotation || 0) + '°';

        if (el.type === 'road') {
            streetProps.classList.remove('hidden');
            document.getElementById('prop-road-width').value = el.width || 14;
            document.getElementById('prop-road-type').value = el.roadType || 'street';
        } else {
            streetProps.classList.add('hidden');
        }
    }

    applyProperties() {
        if (this.selectedElements.length === 0) return;
        const el = this.selectedElements[0];
        el.name = document.getElementById('prop-name').value;
        el.category = document.getElementById('prop-type').value;
        el.opacity = parseInt(document.getElementById('prop-opacity').value) / 100;
        el.rotation = parseInt(document.getElementById('prop-rotation').value);

        if (el.type === 'road') {
            el.color = document.getElementById('prop-fill').value;
            el.borderColor = document.getElementById('prop-stroke').value;
            el.borderWidth = parseInt(document.getElementById('prop-stroke-width').value);
            el.width = parseInt(document.getElementById('prop-road-width').value);
        } else {
            el.fill = document.getElementById('prop-fill').value;
            el.stroke = document.getElementById('prop-stroke').value;
            el.strokeWidth = parseInt(document.getElementById('prop-stroke-width').value);
            if (el.type !== 'text') {
                el.x = parseInt(document.getElementById('prop-x').value);
                el.y = parseInt(document.getElementById('prop-y').value);
                el.width = parseInt(document.getElementById('prop-w').value);
                el.height = parseInt(document.getElementById('prop-h').value);
            }
        }

        this.rebuildIntersections();
        this.saveState(); this.render();
    }

    // =================== STATE ===================

    getProjectData() {
        return { elements: this.elements, layers: this.layers, camera: { ...this.camera } };
    }

    loadProjectData(data) {
        if (!data) return;
        this.elements = data.elements || [];
        this.layers = data.layers || this.layers;
        if (data.camera) this.camera = data.camera;
        this.selectedElements = [];
        this.rebuildIntersections();
        this.updatePropertiesPanel();
        this.updateLayersList();
        this.updateStats();
        this.render();
    }

    saveState() {
        History.push(this.getProjectData());
        this.updateStats();
        this.updateLayersList();
    }

    undo() {
        const state = History.undo(this.getProjectData());
        if (state) this.loadProjectData(state);
    }

    redo() {
        const state = History.redo(this.getProjectData());
        if (state) this.loadProjectData(state);
    }

    clearAll() {
        this.elements = [];
        this.selectedElements = [];
        this.drawingPoints = [];
        this.tempElement = null;
        this.intersections = [];
        this.camera = { x: 0, y: 0, zoom: 1 };
        History.clear();
        this.updatePropertiesPanel();
        this.updateLayersList();
        this.updateStats();
        this.render();
    }

    // =================== LAYERS ===================

    updateLayersList() {
        const list = document.getElementById('layers-list');
        if (!list) return;
        list.innerHTML = '';
        for (const layer of this.layers) {
            const count = this.elements.filter(el => el.layerId === layer.id).length;
            const item = document.createElement('div');
            item.className = 'layer-item' + (layer.id === this.activeLayerId ? ' active' : '');
            item.innerHTML = `
                <span class="layer-vis" data-layer="${layer.id}">${layer.visible ? '👁️' : '🚫'}</span>
                <span class="layer-name">${layer.name} (${count})</span>
                ${layer.locked ? '🔒' : ''}
                <button class="layer-del" data-layer="${layer.id}" title="Excluir camada">×</button>
            `;
            item.addEventListener('click', (ev) => {
                if (ev.target.classList.contains('layer-vis')) {
                    layer.visible = !layer.visible; this.updateLayersList(); this.render();
                } else if (ev.target.classList.contains('layer-del')) {
                    if (this.layers.length > 1) {
                        this.layers = this.layers.filter(l => l.id !== layer.id);
                        if (this.activeLayerId === layer.id) this.activeLayerId = this.layers[0].id;
                        this.updateLayersList(); this.render();
                    }
                } else {
                    this.activeLayerId = layer.id; this.updateLayersList();
                }
            });
            list.appendChild(item);
        }
    }

    addLayer() {
        const name = prompt('Nome da camada:', `Camada ${this.layers.length + 1}`);
        if (!name) return;
        this.layers.push({ id: 'layer_' + Date.now(), name, visible: true, locked: false });
        this.activeLayerId = this.layers[this.layers.length - 1].id;
        this.updateLayersList();
    }

    // =================== STATS ===================

    updateStats() {
        const streets = this.elements.filter(el => el.type === 'road').length;
        const structures = this.elements.filter(el => el.type !== 'road' && el.type !== 'text').length;
        let totalArea = 0, totalRoadLength = 0;
        for (const el of this.elements) {
            if (el.type === 'rectangle') totalArea += (el.width || 0) * (el.height || 0);
            else if (el.type === 'circle') totalArea += Math.PI * (el.radius || 0) ** 2;
            else if (el.type === 'polygon' && el.points) totalArea += Math.abs(this.polygonArea(el.points));
            else if (el.type === 'road' && el.points) {
                for (let i = 0; i < el.points.length - 1; i++) {
                    totalRoadLength += Math.sqrt(
                        (el.points[i + 1].x - el.points[i].x) ** 2 +
                        (el.points[i + 1].y - el.points[i].y) ** 2
                    );
                }
            }
        }
        document.getElementById('stat-streets').textContent = streets;
        document.getElementById('stat-structures').textContent = structures;
        document.getElementById('stat-area').textContent = (totalArea * 0.25).toFixed(0) + ' m²';
        document.getElementById('stat-roads').textContent = (totalRoadLength * 0.5 / 1000).toFixed(2) + ' km';
    }

    polygonArea(points) {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y - points[j].x * points[i].y;
        }
        return area / 2;
    }

    // =================== ELEMENT OPS ===================

    deleteSelected() {
        if (this.selectedElements.length === 0) return;
        const ids = new Set(this.selectedElements.map(el => el.id));
        this.elements = this.elements.filter(el => !ids.has(el.id));
        this.selectedElements = [];
        this.rebuildIntersections();
        this.updatePropertiesPanel(); this.saveState(); this.render();
    }

    duplicateSelected() {
        if (this.selectedElements.length === 0) return;
        const newEls = [];
        for (const el of this.selectedElements) {
            const copy = JSON.parse(JSON.stringify(el));
            copy.id = generateId(); copy.x += 20; copy.y += 20;
            if (copy.points) copy.points = copy.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
            newEls.push(copy);
        }
        this.elements.push(...newEls);
        this.selectedElements = newEls;
        this.rebuildIntersections();
        this.saveState(); this.render();
    }

    bringToFront() {
        for (const sel of this.selectedElements) {
            const idx = this.elements.indexOf(sel);
            if (idx >= 0) { this.elements.splice(idx, 1); this.elements.push(sel); }
        }
        this.saveState(); this.render();
    }

    sendToBack() {
        for (const sel of this.selectedElements) {
            const idx = this.elements.indexOf(sel);
            if (idx >= 0) { this.elements.splice(idx, 1); this.elements.unshift(sel); }
        }
        this.saveState(); this.render();
    }

    toggleLockSelected() {
        for (const sel of this.selectedElements) sel.locked = !sel.locked;
        this.selectedElements = [];
        this.updatePropertiesPanel(); this.render();
    }

    selectAll() {
        this.selectedElements = [...this.elements];
        this.updatePropertiesPanel(); this.render();
    }

    fitToScreen() {
        if (this.elements.length === 0) { this.camera = { x: 0, y: 0, zoom: 1 }; this.render(); return; }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of this.elements) {
            if (el.type === 'circle') {
                minX = Math.min(minX, el.x - el.radius); minY = Math.min(minY, el.y - el.radius);
                maxX = Math.max(maxX, el.x + el.radius); maxY = Math.max(maxY, el.y + el.radius);
            } else if ((el.type === 'road' || el.type === 'polygon') && el.points) {
                for (const p of el.points) {
                    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                }
            } else {
                minX = Math.min(minX, el.x || 0); minY = Math.min(minY, el.y || 0);
                maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
                maxY = Math.max(maxY, (el.y || 0) + (el.height || 0));
            }
        }
        const pad = 60;
        const ww = maxX - minX + pad * 2, wh = maxY - minY + pad * 2;
        const zoom = Math.min(this.canvas.width / ww, this.canvas.height / wh, 2);
        this.camera.zoom = zoom;
        this.camera.x = -minX + pad + (this.canvas.width / zoom - ww) / 2;
        this.camera.y = -minY + pad + (this.canvas.height / zoom - wh) / 2;
        document.getElementById('zoom-level').textContent = Math.round(zoom * 100) + '%';
        this.render();
    }

    exportPNG() {
        const tmp = document.createElement('canvas');
        tmp.width = this.canvas.width; tmp.height = this.canvas.height;
        const tctx = tmp.getContext('2d');
        tctx.fillStyle = '#f5f5f5'; tctx.fillRect(0, 0, tmp.width, tmp.height);
        tctx.save();
        tctx.translate(this.camera.x * this.camera.zoom, this.camera.y * this.camera.zoom);
        tctx.scale(this.camera.zoom, this.camera.zoom);
        const origLabels = this.showLabels; this.showLabels = true;

        // Draw roads
        this.drawRoadNetwork(tctx);

        // Draw non-roads
        for (const el of this.elements) {
            if (el.type !== 'road') this.drawElement(tctx, el);
        }

        this.showLabels = origLabels;
        tctx.restore();
        Storage.exportPNG(tmp);
    }
}
