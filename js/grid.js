/**
 * GRID MODULE
 * Gerencia o desenho da grade e snap
 */
const Grid = {
    size: 20,
    visible: true,
    snapEnabled: true,
    color: 'rgba(255, 255, 255, 0.06)',
    majorColor: 'rgba(255, 255, 255, 0.12)',
    majorInterval: 5,

    draw(ctx, camera) {
        if (!this.visible) return;

        const { x: camX, y: camY, zoom } = camera;
        const canvas = ctx.canvas;
        const gridSize = this.size * zoom;

        if (gridSize < 4) return; // Não desenha grid se muito pequeno

        const startX = -(camX % (this.size * this.majorInterval)) * zoom;
        const startY = -(camY % (this.size * this.majorInterval)) * zoom;

        const offsetX = camX * zoom;
        const offsetY = camY * zoom;

        ctx.save();

        // Minor grid
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        const gridStartX = Math.floor(-offsetX / gridSize) * gridSize;
        const gridStartY = Math.floor(-offsetY / gridSize) * gridSize;

        for (let x = gridStartX; x < canvas.width - offsetX; x += gridSize) {
            const screenX = x + offsetX;
            if (screenX < 0 || screenX > canvas.width) continue;
            ctx.moveTo(Math.round(screenX) + 0.5, 0);
            ctx.lineTo(Math.round(screenX) + 0.5, canvas.height);
        }

        for (let y = gridStartY; y < canvas.height - offsetY; y += gridSize) {
            const screenY = y + offsetY;
            if (screenY < 0 || screenY > canvas.height) continue;
            ctx.moveTo(0, Math.round(screenY) + 0.5);
            ctx.lineTo(canvas.width, Math.round(screenY) + 0.5);
        }
        ctx.stroke();

        // Major grid
        const majorSize = gridSize * this.majorInterval;
        if (majorSize > 10) {
            ctx.strokeStyle = this.majorColor;
            ctx.lineWidth = 1;
            ctx.beginPath();

            const majorStartX = Math.floor(-offsetX / majorSize) * majorSize;
            const majorStartY = Math.floor(-offsetY / majorSize) * majorSize;

            for (let x = majorStartX; x < canvas.width - offsetX; x += majorSize) {
                const screenX = x + offsetX;
                ctx.moveTo(Math.round(screenX) + 0.5, 0);
                ctx.lineTo(Math.round(screenX) + 0.5, canvas.height);
            }

            for (let y = majorStartY; y < canvas.height - offsetY; y += majorSize) {
                const screenY = y + offsetY;
                ctx.moveTo(0, Math.round(screenY) + 0.5);
                ctx.lineTo(canvas.width, Math.round(screenY) + 0.5);
            }
            ctx.stroke();
        }

        // Origin marker
        const originX = offsetX;
        const originY = offsetY;
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, canvas.height);
        ctx.moveTo(0, originY);
        ctx.lineTo(canvas.width, originY);
        ctx.stroke();

        ctx.restore();
    },

    snap(value) {
        if (!this.snapEnabled) return value;
        return Math.round(value / this.size) * this.size;
    },

    snapPoint(x, y) {
        return {
            x: this.snap(x),
            y: this.snap(y)
        };
    }
};
