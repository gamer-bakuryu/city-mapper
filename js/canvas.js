/**
 * CANVAS MODULE
 * Motor de renderização e interação do canvas principal
 */
class CityCanvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        // Camera
        this.camera = { x: 0, y: 0, zoom: 1 };

        // State
        this.elements = [];
        this.layers = [
            { id: 'layer_terrain', name: 'Terreno', visible: true, locked: false },
            { id: 'layer_roads', name: 'Vias', visible: true, locked: false },
            { id: 'layer_structures', name: 'Estruturas', visible: true, locked: false },
            { id: 'layer_labels', name: 'Rótulos', visible: true, locked: false }
        ];
        this.activeLayerId = 'layer_structures';

        // Interaction
        this.selectedElements = [];
        this.hoveredElement = null;
        this.currentTool = 'select';

        // Drawing state
        this.isDrawing = false;
        this.drawingPoints = [];
        this.tempElement = null;
        this.dragStart = null;
        this.dragOffset = null;
        this.isPanning = false;
        this.panStart = null;

        // For rectangle / circle drawing
        this.shapeStart = null;

        // Placing structure
        this.placingStructure = null;

        // Measure
        this.measureStart = null;
        this.measureEnd = null;

        // Show labels
        this.showLabels = false;

        this.resize();
        this.setupEvents();
        this.render();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    // =================== COORDINATE TRANSFORMS ===================

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
        return {
            sx: e.clientX - rect.left,
            sy: e.clientY - rect.top
        };
    }

    onMouseDown(e) {
        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);
        const snapped = Grid.snapPoint(world.x, world.y);

        this.hideContextMenu();

        // Middle mouse button or pan tool
        if (e.button === 1 || (this.currentTool === 'pan' && e.button === 0)) {
            this.isPanning = true;
            this.panStart = { x: sx, y: sy, cx: this.camera.x, cy: this.camera.y };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button !== 0) return;

        const wx = Grid.snapEnabled ? snapped.x : world.x;
        const wy = Grid.snapEnabled ? snapped.y : world.y;

        switch (this.currentTool) {
            case 'select':
                this.handleSelectDown(wx, wy, sx, sy, e);
                break;
            case 'street':
            case 'avenue':
            case 'highway':
                this.handleRoadDown(wx, wy);
                break;
            case 'polygon':
                this.handlePolygonDown(wx, wy);
                break;
            case 'rectangle':
                this.handleRectDown(wx, wy);
                break;
            case 'circle':
                this.handleCircleDown(wx, wy);
                break;
            case 'text':
                this.handleTextDown(wx, wy);
                break;
            case 'eraser':
                this.handleEraserDown(wx, wy);
                break;
            case 'measure':
                this.handleMeasureDown(wx, wy);
                break;
        }

        if (this.placingStructure) {
            this.placeStructure(wx, wy);
        }
    }

    onMouseMove(e) {
        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);
        const snapped = Grid.snapPoint(world.x, world.y);
        const wx = Grid.snapEnabled ? snapped.x : world.x;
        const wy = Grid.snapEnabled ? snapped.y : world.y;

        // Update coords display
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
            case 'select':
                this.handleSelectMove(wx, wy, sx, sy);
                break;
            case 'street':
            case 'avenue':
            case 'highway':
                this.handleRoadMove(wx, wy);
                break;
            case 'rectangle':
                this.handleRectMove(wx, wy);
                break;
            case 'circle':
                this.handleCircleMove(wx, wy);
                break;
            case 'polygon':
                this.handlePolygonMove(wx, wy);
                break;
            case 'measure':
                this.handleMeasureMove(wx, wy);
                break;
        }

        if (this.placingStructure) {
            this.tempElement = this.createStructureElement(this.placingStructure, wx, wy);
            this.render();
        }

        // Hover detection
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
            case 'select':
                this.handleSelectUp(wx, wy);
                break;
            case 'rectangle':
                this.handleRectUp(wx, wy);
                break;
            case 'circle':
                this.handleCircleUp(wx, wy);
                break;
        }
    }

    onDoubleClick(e) {
        const { sx, sy } = this.getMousePos(e);
        const world = this.screenToWorld(sx, sy);

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

    // =================== TOOL HANDLERS: SELECT ===================

    handleSelectDown(wx, wy, sx, sy, e) {
        const element = this.hitTest(wx, wy);

        if (element) {
            if (e.shiftKey) {
                const idx = this.selectedElements.indexOf(element);
                if (idx >= 0) {
                    this.selectedElements.splice(idx, 1);
                } else {
                    this.selectedElements.push(element);
                }
            } else {
                if (!this.selectedElements.includes(element)) {
                    this.selectedElements = [element];
                }
            }
            // Start drag
            this.dragStart = { x: wx, y: wy };
            this.dragOffset = this.selectedElements.map(el => ({
                el,
                ox: el.x - wx,
                oy: el.y - wy
            }));
        } else {
            this.selectedElements = [];
        }

        this.updatePropertiesPanel();
        this.render();
    }

    handleSelectMove(wx, wy, sx, sy) {
        if (this.dragStart && this.dragOffset) {
            this.dragOffset.forEach(({ el, ox, oy }) => {
                const newX = Grid.snapEnabled ? Grid.snap(wx + ox) : wx + ox;
                const newY = Grid.snapEnabled ? Grid.snap(wy + oy) : wy + oy;
                el.x = newX;
                el.y = newY;
            });
            this.render();
        }
    }

    handleSelectUp(wx, wy) {
        if (this.dragStart) {
            this.dragStart = null;
            this.dragOffset = null;
            this.saveState();
        }
    }

    // =================== TOOL HANDLERS: ROADS ===================

    handleRoadDown(wx, wy) {
        this.drawingPoints.push({ x: wx, y: wy });
        this.render();
    }

    handleRoadMove(wx, wy) {
        if (this.drawingPoints.length > 0) {
            this.tempElement = {
                id: 'temp',
                type: 'road',
                roadType: this.currentTool,
                points: [...this.drawingPoints, { x: wx, y: wy }],
                ...RoadTypes[this.currentTool],
                layerId: 'layer_roads'
            };
            this.render();
        }
    }

    finishRoad() {
        if (this.drawingPoints.length < 2) return;

        const roadType = RoadTypes[this.currentTool];
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
            layerId: 'layer_roads',
            locked: false,
            opacity: 1
        };

        this.elements.push(element);
        this.drawingPoints = [];
        this.tempElement = null;
        this.saveState();
        this.render();
    }

    // =================== TOOL HANDLERS: POLYGON ===================

    handlePolygonDown(wx, wy) {
        this.drawingPoints.push({ x: wx, y: wy });
        this.render();
    }

    handlePolygonMove(wx, wy) {
        if (this.drawingPoints.length > 0) {
            this.tempElement = {
                id: 'temp',
                type: 'polygon',
                points: [...this.drawingPoints, { x: wx, y: wy }],
                fill: '#4CAF50',
                stroke: '#333',
                strokeWidth: 2,
                opacity: 0.8
            };
            this.render();
        }
    }

    finishPolygon() {
        if (this.drawingPoints.length < 3) return;

        const bounds = this.getPointsBounds(this.drawingPoints);

        const element = {
            id: generateId(),
            type: 'polygon',
            points: [...this.drawingPoints],
            x: bounds.x,
            y: bounds.y,
            width: bounds.w,
            height: bounds.h,
            fill: '#4CAF50',
            stroke: '#333333',
            strokeWidth: 2,
            name: 'Polígono',
            category: 'residential',
            layerId: this.activeLayerId,
            locked: false,
            opacity: 0.8,
            rotation: 0
        };

        this.elements.push(element);
        this.drawingPoints = [];
        this.tempElement = null;
        this.saveState();
        this.render();
    }

    // =================== TOOL HANDLERS: RECTANGLE ===================

    handleRectDown(wx, wy) {
        this.shapeStart = { x: wx, y: wy };
        this.isDrawing = true;
    }

    handleRectMove(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;

        const x = Math.min(this.shapeStart.x, wx);
        const y = Math.min(this.shapeStart.y, wy);
        const w = Math.abs(wx - this.shapeStart.x);
        const h = Math.abs(wy - this.shapeStart.y);

        this.tempElement = {
            id: 'temp',
            type: 'rectangle',
            x, y,
            width: w,
            height: h,
            fill: '#4CAF50',
            stroke: '#333',
            strokeWidth: 2,
            opacity: 0.8
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
            this.shapeStart = null;
            this.tempElement = null;
            this.render();
            return;
        }

        const element = {
            id: generateId(),
            type: 'rectangle',
            x, y,
            width: w,
            height: h,
            fill: '#4CAF50',
            stroke: '#333333',
            strokeWidth: 2,
            name: 'Retângulo',
            category: 'residential',
            layerId: this.activeLayerId,
            locked: false,
            opacity: 0.8,
            rotation: 0
        };

        this.elements.push(element);
        this.shapeStart = null;
        this.tempElement = null;
        this.saveState();
        this.render();
    }

    // =================== TOOL HANDLERS: CIRCLE ===================

    handleCircleDown(wx, wy) {
        this.shapeStart = { x: wx, y: wy };
        this.isDrawing = true;
    }

    handleCircleMove(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;

        const dx = wx - this.shapeStart.x;
        const dy = wy - this.shapeStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        this.tempElement = {
            id: 'temp',
            type: 'circle',
            x: this.shapeStart.x,
            y: this.shapeStart.y,
            radius: radius,
            fill: '#4CAF50',
            stroke: '#333',
            strokeWidth: 2,
            opacity: 0.8
        };
        this.render();
    }

    handleCircleUp(wx, wy) {
        if (!this.isDrawing || !this.shapeStart) return;
        this.isDrawing = false;

        const dx = wx - this.shapeStart.x;
        const dy = wy - this.shapeStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        if (radius < 5) {
            this.shapeStart = null;
            this.tempElement = null;
            this.render();
            return;
        }

        const element = {
            id: generateId(),
            type: 'circle',
            x: this.shapeStart.x,
            y: this.shapeStart.y,
            radius: radius,
            width: radius * 2,
            height: radius * 2,
            fill: '#4CAF50',
            stroke: '#333333',
            strokeWidth: 2,
            name: 'Círculo',
            category: 'residential',
            layerId: this.activeLayerId,
            locked: false,
            opacity: 0.8,
            rotation: 0
        };

        this.elements.push(element);
        this.shapeStart = null;
        this.tempElement = null;
        this.saveState();
        this.render();
    }

    // =================== TOOL HANDLERS: TEXT ===================

    handleTextDown(wx, wy) {
        const modal = document.getElementById('text-modal');
        modal.classList.remove('hidden');
        document.getElementById('text-input').value = '';
        document.getElementById('text-input').focus();

        const onOk = () => {
            const text = document.getElementById('text-input').value.trim();
            if (text) {
                const element = {
                    id: generateId(),
                    type: 'text',
                    x: wx,
                    y: wy,
                    text: text,
                    fontSize: parseInt(document.getElementById('text-size').value) || 16,
                    fill: document.getElementById('text-color').value,
                    name: text,
                    layerId: 'layer_labels',
                    locked: false,
                    opacity: 1,
                    rotation: 0,
                    width: 0,
                    height: 0
                };
                this.elements.push(element);
                this.saveState();
                this.render();
            }
            modal.classList.add('hidden');
            cleanup();
        };

        const onCancel = () => {
            modal.classList.add('hidden');
            cleanup();
        };

        const cleanup = () => {
            document.getElementById('text-ok').removeEventListener('click', onOk);
            document.getElementById('text-cancel').removeEventListener('click', onCancel);
        };

        document.getElementById('text-ok').addEventListener('click', onOk);
        document.getElementById('text-cancel').addEventListener('click', onCancel);
    }

    // =================== TOOL HANDLERS: ERASER ===================

    handleEraserDown(wx, wy) {
        const element = this.hitTest(wx, wy);
        if (element) {
            this.elements = this.elements.filter(el => el.id !== element.id);
            this.selectedElements = this.selectedElements.filter(el => el.id !== element.id);
            this.saveState();
            this.render();
        }
    }

    // =================== TOOL HANDLERS: MEASURE ===================

    handleMeasureDown(wx, wy) {
        if (!this.measureStart) {
            this.measureStart = { x: wx, y: wy };
        } else {
            this.measureStart = null;
            this.measureEnd = null;
            this.render();
        }
    }

    handleMeasureMove(wx, wy) {
        if (this.measureStart) {
            this.measureEnd = { x: wx, y: wy };
            this.render();
        }
    }

    // =================== STRUCTURES ===================

    createStructureElement(structType, wx, wy) {
        const preset = StructurePresets[structType];
        if (!preset) return null;

        if (preset.type === 'circle') {
            return {
                id: 'temp',
                type: 'circle',
                x: wx,
                y: wy,
                radius: preset.radius || 40,
                fill: preset.fill,
                stroke: preset.stroke,
                strokeWidth: preset.strokeWidth,
                name: preset.name,
                icon: preset.icon,
                opacity: preset.opacity || 0.8
            };
        }

        return {
            id: 'temp',
            type: 'rectangle',
            x: wx - (preset.width || 60) / 2,
            y: wy - (preset.height || 40) / 2,
            width: preset.width || 60,
            height: preset.height || 40,
            fill: preset.fill,
            stroke: preset.stroke,
            strokeWidth: preset.strokeWidth,
            name: preset.name,
            icon: preset.icon,
            opacity: preset.opacity || 0.8
        };
    }

    placeStructure(wx, wy) {
        const preset = StructurePresets[this.placingStructure];
        if (!preset) return;

        let element;
        if (preset.type === 'circle') {
            element = {
                id: generateId(),
                type: 'circle',
                x: wx,
                y: wy,
                radius: preset.radius || 40,
                width: (preset.radius || 40) * 2,
                height: (preset.radius || 40) * 2,
                fill: preset.fill,
                stroke: preset.stroke,
                strokeWidth: preset.strokeWidth,
                name: preset.name,
                icon: preset.icon,
                category: preset.category,
                layerId: this.activeLayerId,
                locked: false,
                opacity: preset.opacity || 0.8,
                rotation: 0
            };
        } else {
            element = {
                id: generateId(),
                type: 'rectangle',
                x: wx - (preset.width || 60) / 2,
                y: wy - (preset.height || 40) / 2,
                width: preset.width || 60,
                height: preset.height || 40,
                fill: preset.fill,
                stroke: preset.stroke,
                strokeWidth: preset.strokeWidth,
                name: preset.name,
                icon: preset.icon,
                category: preset.category,
                layerId: this.activeLayerId,
                locked: false,
                opacity: preset.opacity || 0.8,
                rotation: 0
            };
        }

        this.elements.push(element);
        this.placingStructure = null;
        this.tempElement = null;
        this.saveState();
        this.render();
    }

    // =================== HIT TESTING ===================

    hitTest(wx, wy) {
        // Iterate in reverse (top elements first)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];

            // Check layer visibility
            const layer = this.layers.find(l => l.id === el.layerId);
            if (layer && (!layer.visible || layer.locked)) continue;
            if (el.locked) continue;

            if (this.isPointInElement(wx, wy, el)) {
                return el;
            }
        }
        return null;
    }

    isPointInElement(wx, wy, el) {
        switch (el.type) {
            case 'rectangle':
                return wx >= el.x && wx <= el.x + el.width &&
                       wy >= el.y && wy <= el.y + el.height;

            case 'circle':
                const dx = wx - el.x;
                const dy = wy - el.y;
                return (dx * dx + dy * dy) <= (el.radius * el.radius);

            case 'polygon':
                return this.pointInPolygon(wx, wy, el.points);

            case 'road':
                return this.pointNearPolyline(wx, wy, el.points, el.width / 2 + 5);

            case 'text':
                // Approximate bounding box
                const tw = (el.text || '').length * el.fontSize * 0.6;
                const th = el.fontSize;
                return wx >= el.x && wx <= el.x + tw &&
                       wy >= el.y - th && wy <= el.y;

            default:
                return false;
        }
    }

    pointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    pointNearPolyline(x, y, points, threshold) {
        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.distToSegment(
                { x, y }, points[i], points[i + 1]
            );
            if (dist < threshold) return true;
        }
        return false;
    }

    distToSegment(p, v, w) {
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        };
        return Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
    }

    getPointsBounds(points) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    // =================== RENDERING ===================

    render() {
        const ctx = this.ctx;
        const { zoom } = this.camera;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid
        Grid.draw(ctx, this.camera);

        // Transform for world space
        ctx.save();
        ctx.translate(this.camera.x * zoom, this.camera.y * zoom);
        ctx.scale(zoom, zoom);

        // Draw elements by layer order
        for (const layer of this.layers) {
            if (!layer.visible) continue;

            const layerElements = this.elements.filter(el => el.layerId === layer.id);
            for (const el of layerElements) {
                this.drawElement(ctx, el);
            }
        }

        // Draw elements without a layer
        const orphanElements = this.elements.filter(el =>
            !this.layers.some(l => l.id === el.layerId)
        );
        for (const el of orphanElements) {
            this.drawElement(ctx, el);
        }

        // Temp element (preview while drawing)
        if (this.tempElement) {
            ctx.globalAlpha = 0.6;
            this.drawElement(ctx, this.tempElement);
            ctx.globalAlpha = 1;
        }

        // Drawing points preview
        if (this.drawingPoints.length > 0) {
            this.drawPointsPreview(ctx);
        }

        // Selection indicators
        for (const sel of this.selectedElements) {
            this.drawSelectionBox(ctx, sel);
        }

        // Measure line
        if (this.measureStart && this.measureEnd) {
            this.drawMeasureLine(ctx);
        }

        ctx.restore();

        // Update minimap
        this.renderMinimap();

        // Auto save
        Storage.autoSave(this.getProjectData());
    }

    drawElement(ctx, el) {
        ctx.save();

        if (el.opacity !== undefined) {
            ctx.globalAlpha = el.opacity;
        }

        if (el.rotation && el.type !== 'road') {
            const cx = el.x + (el.width || 0) / 2;
            const cy = el.y + (el.height || 0) / 2;
            ctx.translate(cx, cy);
            ctx.rotate((el.rotation || 0) * Math.PI / 180);
            ctx.translate(-cx, -cy);
        }

        switch (el.type) {
            case 'rectangle':
                this.drawRectangle(ctx, el);
                break;
            case 'circle':
                this.drawCircle(ctx, el);
                break;
            case 'polygon':
                this.drawPolygon(ctx, el);
                break;
            case 'road':
                this.drawRoad(ctx, el);
                break;
            case 'text':
                this.drawText(ctx, el);
                break;
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

        // Icon
        if (el.icon) {
            ctx.font = `${Math.min(el.width, el.height) * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillText(el.icon, el.x + el.width / 2, el.y + el.height / 2);
        }

        // Label
        if (this.showLabels && el.name) {
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
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

        // Icon
        if (el.icon) {
            ctx.font = `${el.radius * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillText(el.icon, el.x, el.y);
        }

        if (this.showLabels && el.name) {
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(el.name, el.x, el.y + el.radius + 14);
            ctx.fillText(el.name, el.x, el.y + el.radius + 14);
        }
    }

    drawPolygon(ctx, el) {
        if (!el.points || el.points.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = el.fill || '#4CAF50';
        ctx.fill();

        if (el.strokeWidth > 0) {
            ctx.strokeStyle = el.stroke || '#333';
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
        }

        if (this.showLabels && el.name) {
            const bounds = this.getPointsBounds(el.points);
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            const cx = bounds.x + bounds.w / 2;
            const cy = bounds.y + bounds.h / 2;
            ctx.strokeText(el.name, cx, cy);
            ctx.fillText(el.name, cx, cy);
        }
    }

    drawRoad(ctx, el) {
        if (!el.points || el.points.length < 2) return;

        // Road border
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.strokeStyle = el.borderColor || '#424242';
        ctx.lineWidth = (el.width || 12) + (el.borderWidth || 1) * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Road fill
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.strokeStyle = el.color || '#616161';
        ctx.lineWidth = el.width || 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Divider line (for avenues/highways)
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

        // Label
        if (this.showLabels && el.name && el.points.length >= 2) {
            const mid = Math.floor(el.points.length / 2);
            const p = el.points[mid];
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(el.name, p.x, p.y - el.width / 2 - 6);
            ctx.fillText(el.name, p.x, p.y - el.width / 2 - 6);
        }
    }

    drawText(ctx, el) {
        ctx.font = `${el.fontSize || 16}px Arial`;
        ctx.fillStyle = el.fill || '#333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(el.text || '', el.x, el.y);
    }

    drawPointsPreview(ctx) {
        if (this.drawingPoints.length === 0) return;

        ctx.save();
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(this.drawingPoints[0].x, this.drawingPoints[0].y);
        for (let i = 1; i < this.drawingPoints.length; i++) {
            ctx.lineTo(this.drawingPoints[i].x, this.drawingPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw points
        for (const p of this.drawingPoints) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#e94560';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
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
            bounds = {
                x: el.x - el.radius,
                y: el.y - el.radius,
                w: el.radius * 2,
                h: el.radius * 2
            };
        } else if (el.type === 'road' && el.points) {
            bounds = this.getPointsBounds(el.points);
            bounds.x -= el.width / 2;
            bounds.y -= el.width / 2;
            bounds.w += el.width;
            bounds.h += el.width;
        } else if (el.type === 'polygon' && el.points) {
            bounds = this.getPointsBounds(el.points);
        } else if (el.type === 'text') {
            const tw = (el.text || '').length * (el.fontSize || 16) * 0.6;
            bounds = {
                x: el.x - 2,
                y: el.y - 2,
                w: tw + 4,
                h: (el.fontSize || 16) + 4
            };
        } else {
            bounds = { x: el.x, y: el.y, w: el.width || 0, h: el.height || 0 };
        }

        ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
        ctx.setLineDash([]);

        // Handles
        const handleSize = 6 / this.camera.zoom;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#00BCD4';
        ctx.lineWidth = 1.5 / this.camera.zoom;

        const corners = [
            [bounds.x - 4, bounds.y - 4],
            [bounds.x + bounds.w + 4, bounds.y - 4],
            [bounds.x - 4, bounds.y + bounds.h + 4],
            [bounds.x + bounds.w + 4, bounds.y + bounds.h + 4],
        ];

        for (const [cx, cy] of corners) {
            ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
        }

        ctx.restore();
    }

    drawMeasureLine(ctx) {
        ctx.save();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);

        ctx.beginPath();
        ctx.moveTo(this.measureStart.x, this.measureStart.y);
        ctx.lineTo(this.measureEnd.x, this.measureEnd.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const dx = this.measureEnd.x - this.measureStart.x;
        const dy = this.measureEnd.y - this.measureStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const midX = (this.measureStart.x + this.measureEnd.x) / 2;
        const midY = (this.measureStart.y + this.measureEnd.y) / 2;

        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF9800';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const label = `${Math.round(dist)} px (${(dist * 0.5).toFixed(1)}m)`;
        ctx.strokeText(label, midX, midY - 10);
        ctx.fillText(label, midX, midY - 10);

        // Endpoints
        ctx.beginPath();
        ctx.arc(this.measureStart.x, this.measureStart.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF9800';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.measureEnd.x, this.measureEnd.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderMinimap() {
        const minimap = document.getElementById('minimap');
        if (!minimap) return;

        const mctx = minimap.getContext('2d');
        const mw = minimap.width;
        const mh = minimap.height;

        mctx.clearRect(0, 0, mw, mh);
        mctx.fillStyle = '#1a1a2e';
        mctx.fillRect(0, 0, mw, mh);

        if (this.elements.length === 0) return;

        // Find world bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const el of this.elements) {
            if (el.type === 'circle') {
                minX = Math.min(minX, el.x - el.radius);
                minY = Math.min(minY, el.y - el.radius);
                maxX = Math.max(maxX, el.x + el.radius);
                maxY = Math.max(maxY, el.y + el.radius);
            } else if (el.type === 'road' && el.points) {
                for (const p of el.points) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                }
            } else if (el.type === 'polygon' && el.points) {
                for (const p of el.points) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                }
            } else {
                minX = Math.min(minX, el.x || 0);
                minY = Math.min(minY, el.y || 0);
                maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
                maxY = Math.max(maxY, (el.y || 0) + (el.height || 0));
            }
        }

        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const worldW = maxX - minX || 1;
        const worldH = maxY - minY || 1;
        const scale = Math.min(mw / worldW, mh / worldH);

        const offsetX = (mw - worldW * scale) / 2;
        const offsetY = (mh - worldH * scale) / 2;

        mctx.save();
        mctx.translate(offsetX, offsetY);
        mctx.scale(scale, scale);
        mctx.translate(-minX, -minY);

        // Draw elements simply
        for (const el of this.elements) {
            mctx.globalAlpha = 0.8;
            if (el.type === 'rectangle') {
                mctx.fillStyle = el.fill || '#4CAF50';
                mctx.fillRect(el.x, el.y, el.width, el.height);
            } else if (el.type === 'circle') {
                mctx.beginPath();
                mctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
                mctx.fillStyle = el.fill || '#4CAF50';
                mctx.fill();
            } else if (el.type === 'polygon' && el.points) {
                mctx.beginPath();
                mctx.moveTo(el.points[0].x, el.points[0].y);
                for (let i = 1; i < el.points.length; i++) {
                    mctx.lineTo(el.points[i].x, el.points[i].y);
                }
                mctx.closePath();
                mctx.fillStyle = el.fill || '#4CAF50';
                mctx.fill();
            } else if (el.type === 'road' && el.points) {
                mctx.beginPath();
                mctx.moveTo(el.points[0].x, el.points[0].y);
                for (let i = 1; i < el.points.length; i++) {
                    mctx.lineTo(el.points[i].x, el.points[i].y);
                }
                mctx.strokeStyle = el.color || '#616161';
                mctx.lineWidth = el.width || 12;
                mctx.lineCap = 'round';
                mctx.stroke();
            }
        }

        // Viewport rectangle
        const vpLeft = -this.camera.x;
        const vpTop = -this.camera.y;
        const vpW = this.canvas.width / this.camera.zoom;
        const vpH = this.canvas.height / this.camera.zoom;

        mctx.globalAlpha = 1;
        mctx.strokeStyle = '#e94560';
        mctx.lineWidth = 2 / scale;
        mctx.strokeRect(vpLeft, vpTop, vpW, vpH);

        mctx.restore();
    }

    // =================== CONTEXT MENU ===================

    showContextMenu(x, y) {
        const menu = document.getElementById('context-menu');
        menu.classList.remove('hidden');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
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
            noSel.classList.remove('hidden');
            elProps.classList.add('hidden');
            return;
        }

        noSel.classList.add('hidden');
        elProps.classList.remove('hidden');

        const el = this.selectedElements[0];

        document.getElementById('prop-name').value = el.name || '';
        document.getElementById('prop-type').value = el.category || 'residential';
        document.getElementById('prop-fill').value = el.fill || '#4CAF50';
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
            document.getElementById('prop-road-width').value = el.width || 12;
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
        el.fill = document.getElementById('prop-fill').value;
        el.opacity = parseInt(document.getElementById('prop-opacity').value) / 100;
        el.stroke = document.getElementById('prop-stroke').value;
        el.strokeWidth = parseInt(document.getElementById('prop-stroke-width').value);

        if (el.type !== 'road' && el.type !== 'text') {
            el.x = parseInt(document.getElementById('prop-x').value);
            el.y = parseInt(document.getElementById('prop-y').value);
            el.width = parseInt(document.getElementById('prop-w').value);
            el.height = parseInt(document.getElementById('prop-h').value);
        }

        el.rotation = parseInt(document.getElementById('prop-rotation').value);

        if (el.type === 'road') {
            el.width = parseInt(document.getElementById('prop-road-width').value);
            el.borderColor = el.stroke;
        }

        this.saveState();
        this.render();
    }

    // =================== STATE MANAGEMENT ===================

    getProjectData() {
        return {
            elements: this.elements,
            layers: this.layers,
            camera: { ...this.camera }
        };
    }

    loadProjectData(data) {
        if (!data) return;
        this.elements = data.elements || [];
        this.layers = data.layers || this.layers;
        if (data.camera) {
            this.camera = data.camera;
        }
        this.selectedElements = [];
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
                    layer.visible = !layer.visible;
                    this.updateLayersList();
                    this.render();
                } else if (ev.target.classList.contains('layer-del')) {
                    if (this.layers.length > 1) {
                        this.layers = this.layers.filter(l => l.id !== layer.id);
                        if (this.activeLayerId === layer.id) {
                            this.activeLayerId = this.layers[0].id;
                        }
                        this.updateLayersList();
                        this.render();
                    }
                } else {
                    this.activeLayerId = layer.id;
                    this.updateLayersList();
                }
            });

            list.appendChild(item);
        }
    }

    addLayer() {
        const name = prompt('Nome da camada:', `Camada ${this.layers.length + 1}`);
        if (!name) return;
        this.layers.push({
            id: 'layer_' + Date.now(),
            name: name,
            visible: true,
            locked: false
        });
        this.activeLayerId = this.layers[this.layers.length - 1].id;
        this.updateLayersList();
    }

    // =================== STATISTICS ===================

    updateStats() {
        const streets = this.elements.filter(el => el.type === 'road').length;
        const structures = this.elements.filter(el => el.type !== 'road' && el.type !== 'text').length;

        let totalArea = 0;
        let totalRoadLength = 0;

        for (const el of this.elements) {
            if (el.type === 'rectangle') {
                totalArea += (el.width || 0) * (el.height || 0);
            } else if (el.type === 'circle') {
                totalArea += Math.PI * (el.radius || 0) ** 2;
            } else if (el.type === 'polygon' && el.points) {
                totalArea += Math.abs(this.polygonArea(el.points));
            } else if (el.type === 'road' && el.points) {
                for (let i = 0; i < el.points.length - 1; i++) {
                    const dx = el.points[i + 1].x - el.points[i].x;
                    const dy = el.points[i + 1].y - el.points[i].y;
                    totalRoadLength += Math.sqrt(dx * dx + dy * dy);
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
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return area / 2;
    }

    // =================== ELEMENT OPERATIONS ===================

    deleteSelected() {
        if (this.selectedElements.length === 0) return;
        const ids = new Set(this.selectedElements.map(el => el.id));
        this.elements = this.elements.filter(el => !ids.has(el.id));
        this.selectedElements = [];
        this.updatePropertiesPanel();
        this.saveState();
        this.render();
    }

    duplicateSelected() {
        if (this.selectedElements.length === 0) return;

        const newElements = [];
        for (const el of this.selectedElements) {
            const copy = JSON.parse(JSON.stringify(el));
            copy.id = generateId();
            copy.x += 20;
            copy.y += 20;
            if (copy.points) {
                copy.points = copy.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
            }
            newElements.push(copy);
        }

        this.elements.push(...newElements);
        this.selectedElements = newElements;
        this.saveState();
        this.render();
    }

    bringToFront() {
        if (this.selectedElements.length === 0) return;
        for (const sel of this.selectedElements) {
            const idx = this.elements.indexOf(sel);
            if (idx >= 0) {
                this.elements.splice(idx, 1);
                this.elements.push(sel);
            }
        }
        this.saveState();
        this.render();
    }

    sendToBack() {
        if (this.selectedElements.length === 0) return;
        for (const sel of this.selectedElements) {
            const idx = this.elements.indexOf(sel);
            if (idx >= 0) {
                this.elements.splice(idx, 1);
                this.elements.unshift(sel);
            }
        }
        this.saveState();
        this.render();
    }

    toggleLockSelected() {
        for (const sel of this.selectedElements) {
            sel.locked = !sel.locked;
        }
        this.selectedElements = [];
        this.updatePropertiesPanel();
        this.render();
    }

    selectAll() {
        this.selectedElements = [...this.elements];
        this.updatePropertiesPanel();
        this.render();
    }

    fitToScreen() {
        if (this.elements.length === 0) {
            this.camera = { x: 0, y: 0, zoom: 1 };
            this.render();
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const el of this.elements) {
            if (el.type === 'circle') {
                minX = Math.min(minX, el.x - el.radius);
                minY = Math.min(minY, el.y - el.radius);
                maxX = Math.max(maxX, el.x + el.radius);
                maxY = Math.max(maxY, el.y + el.radius);
            } else if ((el.type === 'road' || el.type === 'polygon') && el.points) {
                for (const p of el.points) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                }
            } else {
                minX = Math.min(minX, el.x || 0);
                minY = Math.min(minY, el.y || 0);
                maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
                maxY = Math.max(maxY, (el.y || 0) + (el.height || 0));
            }
        }

        const padding = 60;
        const worldW = maxX - minX + padding * 2;
        const worldH = maxY - minY + padding * 2;

        const zoom = Math.min(
            this.canvas.width / worldW,
            this.canvas.height / worldH,
            2
        );

        this.camera.zoom = zoom;
        this.camera.x = -minX + padding + (this.canvas.width / zoom - worldW) / 2;
        this.camera.y = -minY + padding + (this.canvas.height / zoom - worldH) / 2;

        document.getElementById('zoom-level').textContent = Math.round(zoom * 100) + '%';
        this.render();
    }

    // =================== EXPORT PNG ===================

    exportPNG() {
        // Create temporary canvas without grid
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tctx = tempCanvas.getContext('2d');

        // White background
        tctx.fillStyle = '#f5f5f5';
        tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw elements
        tctx.save();
        tctx.translate(this.camera.x * this.camera.zoom, this.camera.y * this.camera.zoom);
        tctx.scale(this.camera.zoom, this.camera.zoom);

        for (const el of this.elements) {
            const origShowLabels = this.showLabels;
            this.showLabels = true;
            this.drawElement(tctx, el);
            this.showLabels = origShowLabels;
        }

        tctx.restore();

        Storage.exportPNG(tempCanvas);
    }
}
