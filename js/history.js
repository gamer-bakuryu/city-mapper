/**
 * HISTORY MODULE
 * Gerencia undo/redo
 */
const History = {
    undoStack: [],
    redoStack: [],
    maxSize: 50,

    push(state) {
        this.undoStack.push(JSON.stringify(state));
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.updateButtons();
    },

    undo(currentState) {
        if (this.undoStack.length === 0) return null;
        this.redoStack.push(JSON.stringify(currentState));
        const state = JSON.parse(this.undoStack.pop());
        this.updateButtons();
        return state;
    },

    redo(currentState) {
        if (this.redoStack.length === 0) return null;
        this.undoStack.push(JSON.stringify(currentState));
        const state = JSON.parse(this.redoStack.pop());
        this.updateButtons();
        return state;
    },

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    },

    updateButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.style.opacity = this.undoStack.length > 0 ? '1' : '0.4';
        if (redoBtn) redoBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.4';
    }
};
