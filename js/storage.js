/**
 * STORAGE MODULE
 * Gerencia salvamento e carregamento de projetos
 */
const Storage = {
    STORAGE_KEY: 'citymapper_project',
    AUTO_SAVE_KEY: 'citymapper_autosave',

    save(data) {
        try {
            const project = {
                version: '1.0',
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(project));
            return true;
        } catch (e) {
            console.error('Erro ao salvar:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw).data;
        } catch (e) {
            console.error('Erro ao carregar:', e);
            return null;
        }
    },

    autoSave(data) {
        try {
            localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {
            // Silently fail
        }
    },

    loadAutoSave() {
        try {
            const raw = localStorage.getItem(this.AUTO_SAVE_KEY);
            if (!raw) return null;
            return JSON.parse(raw).data;
        } catch (e) {
            return null;
        }
    },

    exportJSON(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citymapper_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importJSON(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                callback(data.data || data);
            } catch (err) {
                alert('Arquivo inválido!');
            }
        };
        reader.readAsText(file);
    },

    exportPNG(canvas) {
        // Cria canvas temporário sem grid
        const link = document.createElement('a');
        link.download = `citymapper_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
};
