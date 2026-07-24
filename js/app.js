/**
 * APP MODULE
 * Inicialização e ligação dos event handlers
 */
(function () {
    'use strict';

    let cityCanvas;

    function init() {
        const canvas = document.getElementById('main-canvas');
        cityCanvas = new CityCanvas(canvas);

        // Try to load auto-save
        const autoSave = Storage.loadAutoSave();
        if (autoSave) {
            cityCanvas.loadProjectData(autoSave);
        }

        // Initial state
        cityCanvas.saveState();
        cityCanvas.updateLayersList();
        cityCanvas.updateStats();

        setupToolbar();
        setupTopBar();
        setupProperties();
        setupContextMenu();
        setupKeyboard();
        setupHelp();

        History.updateButtons();
    }

    // =================== TOOLBAR ===================

    function setupToolbar() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                setTool(tool);
            });
        });

        // Structure buttons
        document.querySelectorAll('.struct-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const struct = btn.dataset.struct;
                cityCanvas.placingStructure = struct;
                cityCanvas.currentTool = 'select';
                updateToolButtons('select');
                cityCanvas.canvas.style.cursor = 'copy';
            });
        });

        // Zoom controls
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            cityCanvas.camera.zoom = Math.min(5, cityCanvas.camera.zoom * 1.2);
            document.getElementById('zoom-level').textContent =
                Math.round(cityCanvas.camera.zoom * 100) + '%';
            cityCanvas.render();
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            cityCanvas.camera.zoom = Math.max(0.1, cityCanvas.camera.zoom / 1.2);
            document.getElementById('zoom-level').textContent =
                Math.round(cityCanvas.camera.zoom * 100) + '%';
            cityCanvas.render();
        });

        document.getElementById('btn-fit').addEventListener('click', () => {
            cityCanvas.fitToScreen();
        });

        // Toggle controls
        document.getElementById('toggle-grid').addEventListener('change', (e) => {
            Grid.visible = e.target.checked;
            cityCanvas.render();
        });

        document.getElementById('toggle-snap').addEventListener('change', (e) => {
            Grid.snapEnabled = e.target.checked;
        });

        document.getElementById('toggle-labels').addEventListener('change', (e) => {
            cityCanvas.showLabels = e.target.checked;
            cityCanvas.render();
        });
    }

    function setTool(tool) {
        cityCanvas.currentTool = tool;
        cityCanvas.placingStructure = null;
        cityCanvas.drawingPoints = [];
        cityCanvas.tempElement = null;
        cityCanvas.measureStart = null;
        cityCanvas.measureEnd = null;
        cityCanvas.isDrawing = false;
        cityCanvas.shapeStart = null;

        updateToolButtons(tool);

        const cursorMap = {
            'select': 'default',
            'pan': 'grab',
            'street': 'crosshair',
            'avenue': 'crosshair',
            'highway': 'crosshair',
            'polygon': 'crosshair',
            'rectangle': 'crosshair',
            'circle': 'crosshair',
            'text': 'text',
            'eraser': 'not-allowed',
            'measure': 'crosshair'
        };

        cityCanvas.canvas.style.cursor = cursorMap[tool] || 'crosshair';
        cityCanvas.render();
    }

    function updateToolButtons(tool) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    // =================== TOP BAR ===================

    function setupTopBar() {
        document.getElementById('btn-new').addEventListener('click', () => {
            if (confirm('Criar novo projeto? Todo progresso não salvo será perdido.')) {
                cityCanvas.clearAll();
            }
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            if (Storage.save(cityCanvas.getProjectData())) {
                showNotification('Projeto salvo com sucesso! 💾');
            }
        });

        document.getElementById('btn-load').addEventListener('click', () => {
            const data = Storage.load();
            if (data) {
                cityCanvas.loadProjectData(data);
                showNotification('Projeto carregado! 📂');
            } else {
                alert('Nenhum projeto salvo encontrado.');
            }
        });

        document.getElementById('btn-export-png').addEventListener('click', () => {
            cityCanvas.exportPNG();
            showNotification('PNG exportado! 🖼️');
        });

        document.getElementById('btn-export-json').addEventListener('click', () => {
            Storage.exportJSON(cityCanvas.getProjectData());
            showNotification('JSON exportado! 📋');
        });

        document.getElementById('btn-undo').addEventListener('click', () => {
            cityCanvas.undo();
        });

        document.getElementById('btn-redo').addEventListener('click', () => {
            cityCanvas.redo();
        });

        // File input for import
        const fileInput = document.getElementById('file-input');
        document.getElementById('btn-load').addEventListener('dblclick', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                Storage.importJSON(e.target.files[0], (data) => {
                    cityCanvas.loadProjectData(data);
                    showNotification('Projeto importado! 📂');
                });
                e.target.value = '';
            }
        });
    }

    // =================== PROPERTIES ===================

    function setupProperties() {
        document.getElementById('btn-apply-props').addEventListener('click', () => {
            cityCanvas.applyProperties();
        });

        document.getElementById('btn-delete-element').addEventListener('click', () => {
            cityCanvas.deleteSelected();
        });

        document.getElementById('prop-opacity').addEventListener('input', (e) => {
            document.getElementById('opacity-val').textContent = e.target.value + '%';
        });

        document.getElementById('prop-rotation').addEventListener('input', (e) => {
            document.getElementById('rotation-val').textContent = e.target.value + '°';
        });

        document.getElementById('btn-add-layer').addEventListener('click', () => {
            cityCanvas.addLayer();
        });
    }

    // =================== CONTEXT MENU ===================

    function setupContextMenu() {
        document.getElementById('context-menu').querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                switch (action) {
                    case 'edit':
                        cityCanvas.updatePropertiesPanel();
                        break;
                    case 'duplicate':
                        cityCanvas.duplicateSelected();
                        break;
                    case 'front':
                        cityCanvas.bringToFront();
                        break;
                    case 'back':
                        cityCanvas.sendToBack();
                        break;
                    case 'lock':
                        cityCanvas.toggleLockSelected();
                        break;
                    case 'delete':
                        cityCanvas.deleteSelected();
                        break;
                }
                cityCanvas.hideContextMenu();
            });
        });

        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) {
                cityCanvas.hideContextMenu();
            }
        });
    }

    // =================== KEYBOARD SHORTCUTS ===================

    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't handle if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            const key = e.key.toLowerCase();

            // Ctrl shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (key) {
                    case 'z':
                        e.preventDefault();
                        cityCanvas.undo();
                        return;
                    case 'y':
                        e.preventDefault();
                        cityCanvas.redo();
                        return;
                    case 's':
                        e.preventDefault();
                        Storage.save(cityCanvas.getProjectData());
                        showNotification('Projeto salvo! 💾');
                        return;
                    case 'a':
                        e.preventDefault();
                        cityCanvas.selectAll();
                        return;
                }
            }

            // Tool shortcuts
            const toolMap = {
                'v': 'select',
                'h': 'pan',
                's': 'street',
                'a': 'avenue',
                'w': 'highway',
                'p': 'polygon',
                'r': 'rectangle',
                'c': 'circle',
                't': 'text',
                'e': 'eraser',
                'm': 'measure'
            };

            if (toolMap[key]) {
                setTool(toolMap[key]);
                return;
            }

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    cityCanvas.deleteSelected();
                    break;
                case 'Escape':
                    cityCanvas.selectedElements = [];
                    cityCanvas.drawingPoints = [];
                    cityCanvas.tempElement = null;
                    cityCanvas.placingStructure = null;
                    cityCanvas.measureStart = null;
                    cityCanvas.measureEnd = null;
                    cityCanvas.isDrawing = false;
                    cityCanvas.updatePropertiesPanel();
                    cityCanvas.render();
                    break;
                case '?':
                    document.getElementById('help-overlay').classList.toggle('hidden');
                    break;
            }
        });
    }

    // =================== HELP ===================

    function setupHelp() {
        document.getElementById('close-help').addEventListener('click', () => {
            document.getElementById('help-overlay').classList.add('hidden');
        });

        document.getElementById('help-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'help-overlay') {
                document.getElementById('help-overlay').classList.add('hidden');
            }
        });
    }

    // =================== NOTIFICATIONS ===================

    function showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(233, 69, 96, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
            pointer-events: none;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // =================== INIT ===================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
