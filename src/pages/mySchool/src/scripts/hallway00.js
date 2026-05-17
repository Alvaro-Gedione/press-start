// hallway.js - Módulo de gerenciamento do cenário do corredor
(function (global) {
    'use strict';

    class Hallway00Scene {
        constructor() {
            this.backgroundImage = new Image();
            this.backgroundImage.src = './src/img/scenarios/hallway00.png';
            this.objects = [];
            this.isLoaded = false;
        }

        init() {
            this.createObjects();
            this.loadBackground();
            return this;
        }

        createObjects() {
            const hallwayObjects = [
                // Paredes básicas - Deixando vãos para as passagens
                { x: 0, y: 0, width: 800, height: 120, type: 'solid', name: 'parede_superior' },
                { x: 0, y: 575, width: 270, height: 75, type: 'solid', name: 'parede_inferior_esquerdo' },
                { x: 505, y: 575, width: 300, height: 75, type: 'solid', name: 'parede_inferior_direito' },
                
                { x: 200, y: 500, width: 50, height: 50, type: 'pushable', name: 'carrinho' }
            ];

            this.objects = hallwayObjects.map(obj => ({
                ...obj,
                lastInteraction: 0
            }));
        }

        loadBackground() {
            return new Promise((resolve) => {
                if (this.backgroundImage.complete) {
                    this.isLoaded = true;
                    resolve();
                } else {
                    this.backgroundImage.onload = () => {
                        this.isLoaded = true;
                        resolve();
                    };
                    this.backgroundImage.onerror = () => {
                        this.isLoaded = true;
                        resolve();
                    };
                }
            });
        }

        drawBackground(ctx, canvasWidth, canvasHeight) {
            if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
                ctx.drawImage(this.backgroundImage, 0, 0, canvasWidth, canvasHeight);
            } else {
                const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                grad.addColorStop(0, '#e8e8e8');
                grad.addColorStop(1, '#d0d0d0');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
        }

        drawObjects(ctx) {
            this.objects.forEach(obj => {
                if (obj.type === 'solid') {
                    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                } else if (obj.type === 'pushable') {
                    ctx.fillStyle = 'rgba(150, 100, 50, 0.8)';
                    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    ctx.font = '24px sans-serif';
                    ctx.fillText("🛒", obj.x + obj.width / 2 - 12, obj.y + obj.height / 2 + 8);
                }
            });
        }

        update(player) {
            // Volta para a entrada (baixo)
            if (player.y >= 540 && player.x >= 270 && player.x <= 505) {
                return {
                    nextScene: 'entrance',
                    startX: player.x,
                    startY: 60
                };
            }
            
            // Vai para hallway01 (esquerda)
            if (player.x <= 10) {
                return {
                    nextScene: 'hallway01',
                    startX: 730,
                    startY: player.y
                };
            }
            
            // Vai para hallway02 (direita)
            if (player.x >= 740) {
                return {
                    nextScene: 'hallway02',
                    startX: 20,
                    startY: player.y
                };
            }
            
            return null;
        }

        checkCollision(rect1, rect2) {
            return !(rect1.x + rect1.width <= rect2.x ||
                rect1.x >= rect2.x + rect2.width ||
                rect1.y + rect1.height <= rect2.y ||
                rect1.y >= rect2.y + rect2.height);
        }

        tryPushObject(obj, dx, dy, canvasWidth, canvasHeight) {
            const newX = obj.x + dx;
            const newY = obj.y + dy;
            const newRect = { x: newX, y: newY, width: obj.width, height: obj.height };

            for (let other of this.objects) {
                if (other === obj) continue;
                if (this.checkCollision(newRect, other)) return false;
            }

            if (newX < 0 || newY < 0 || newX + obj.width > canvasWidth || newY + obj.height > canvasHeight) {
                return false;
            }

            obj.x = newX;
            obj.y = newY;
            return true;
        }

        processMovement(player, dx, dy, onInteraction) {
            let moved = false;
            const rectX = { x: player.x + dx, y: player.y, width: player.width, height: player.height };
            let collX = false;
            for (let obj of this.objects) {
                if (this.checkCollision(rectX, obj)) {
                    if (obj.type === 'pushable') {
                        if (!this.tryPushObject(obj, dx, 0, 800, 600)) collX = true;
                    } else {
                        collX = true;
                    }
                    if (collX) break;
                }
            }
            if (!collX) { player.x += dx; moved = true; }

            const rectY = { x: player.x, y: player.y + dy, width: player.width, height: player.height };
            let collY = false;
            for (let obj of this.objects) {
                if (this.checkCollision(rectY, obj)) {
                    if (obj.type === 'pushable') {
                        if (!this.tryPushObject(obj, 0, dy, 800, 600)) collY = true;
                    } else {
                        collY = true;
                    }
                    if (collY) break;
                }
            }
            if (!collY) { player.y += dy; moved = true; }

            return moved;
        }
    }

    global.Hallway00Scene = Hallway00Scene;

})(window);