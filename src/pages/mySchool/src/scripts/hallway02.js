// hallway02.js - Corredor com porta interativa
(function (global) {
    'use strict';

    class Hallway02Scene {
        constructor() {
            this.backgroundImage = new Image();
            this.backgroundImage.src = './src/img/scenarios/hallway02.png';
            this.objects = [];
            this.doorObject = null; // Referência para a porta
            this.isLoaded = false;
        }

        // Inicializa o cenário
        init() {
            this.createObjects();
            this.loadBackground();
            return this;
        }

        // Cria os objetos do corredor
        createObjects() {
            // Cria a porta interativa
            this.doorObject = new InteractiveDoor(
                300, 0,           // x, y
                200, 120,         // width, height
                './src/img/door', // pasta com animações
                'porta_sala',     // nome
                {                 // doorConfig
                    passageWidth: 150,
                    passageHeight: 120,
                    direction: 'down'
                },
                200,              // imgHeight
                240,              // imgWidth
                300,              // imgX
                0                 // imgY
            );

            const hallwayObjects = [
                // Paredes básicas
                { x: 0, y: 0, width: 300, height: 120, type: 'solid', name: 'parede_superior_esquerda' },
                { x: 425, y: 0, width: 375, height: 120, type: 'solid', name: 'parede_superior_direita' },
                { x: 0, y: 575, width: 800, height: 75, type: 'solid', name: 'parede_inferior' },
                { x: 780, y: 0, width: 20, height: 600, type: 'solid', name: 'parede_direita' },

                // Objeto empurrável
                { x: 200, y: 500, width: 50, height: 50, type: 'pushable', name: 'carrinho' }
            ];

            // Converte objetos normais para CollisionObject
            this.objects = hallwayObjects.map(obj => {
                return new CollisionObject(
                    obj.x, obj.y, obj.width, obj.height,
                    null, obj.type, obj.name
                );
            });

            // Adiciona a porta aos objetos
            this.objects.push(this.doorObject);
        }

        // Método para interagir com a porta
        interactWithDoor() {
            if (this.doorObject && !this.doorObject.isAnimating) {
                const result = this.doorObject.interact();
                if (result && result.message) {
                    return result.message;
                }
                return this.doorObject.isOpen ? '🚪 Porta aberta! Pode passar!' : '🚪 Porta fechada!';
            }
            return null;
        }

        // Carrega imagem de fundo
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
                        console.warn('Não foi possível carregar hallway02.png');
                        this.isLoaded = true;
                        resolve();
                    };
                }
            });
        }

        // Desenha o cenário
        drawBackground(ctx, canvasWidth, canvasHeight) {
            if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
                ctx.drawImage(this.backgroundImage, 0, 0, canvasWidth, canvasHeight);
            } else {
                // Fundo padrão para corredor
                const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                grad.addColorStop(0, '#c8d8e8');
                grad.addColorStop(1, '#a0b0c0');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                // Desenha linhas do chão
                ctx.beginPath();
                ctx.strokeStyle = '#8B7355';
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    ctx.moveTo(100 + i * 200, 120);
                    ctx.lineTo(100 + i * 200, canvasHeight);
                    ctx.stroke();
                }
            }
        }

        // Desenha objetos
        drawObjects(ctx) {
            // Atualiza animações e desenha
            const now = Date.now();
            this.objects.forEach(obj => {
                if (obj.update) obj.update(now);
                obj.draw(ctx);
            });
        }

        // Verifica colisão entre dois retângulos
        checkCollision(rect1, rect2) {
            return !(rect1.x + rect1.width <= rect2.x ||
                rect1.x >= rect2.x + rect2.width ||
                rect1.y + rect1.height <= rect2.y ||
                rect1.y >= rect2.y + rect2.height);
        }

        // Tenta empurrar um objeto
        tryPushObject(obj, dx, dy, canvasWidth, canvasHeight) {
            if (obj.tryPush) {
                return obj.tryPush(dx, dy, this.objects, { width: canvasWidth, height: canvasHeight });
            }

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

        // Processa movimento do jogador com colisão (inclui porta)
        processMovement(player, dx, dy, onInteraction) {
            let moved = false;

            // Movimento em X
            const rectX = { x: player.x + dx, y: player.y, width: player.width, height: player.height };
            let collX = false;

            for (let obj of this.objects) {
                if (this.checkCollision(rectX, obj)) {
                    // Se for porta e estiver aberta, permite passagem
                    if (obj.type === 'door' && obj.isOpen && obj.isPassageClear(rectX.x, rectX.y, rectX.width, rectX.height)) {
                        continue; // Não colide, pode passar
                    }

                    if (obj.type === 'pushable') {
                        if (!this.tryPushObject(obj, dx, 0, 800, 600)) collX = true;
                    } else {
                        collX = true;
                    }
                    if (collX) break;
                }
            }
            if (!collX) { player.x += dx; moved = true; }

            // Movimento em Y
            const rectY = { x: player.x, y: player.y + dy, width: player.width, height: player.height };
            let collY = false;

            for (let obj of this.objects) {
                if (this.checkCollision(rectY, obj)) {
                    // Se for porta e estiver aberta, permite passagem
                    if (obj.type === 'door' && obj.isOpen && obj.isPassageClear(rectY.x, rectY.y, rectY.width, rectY.height)) {
                        continue; // Não colide, pode passar
                    }

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

        // Atualiza lógica da cena e verifica transições
        update(player) {
            // Volta para hallway00 pela esquerda
            if (player.x <= 10) {
                return {
                    nextScene: 'hallway00',
                    startX: 710,
                    startY: player.y
                };
            }

            // Verifica se o jogador está na posição da porta (y <= 100 E x entre 300 e 360)
            // E se a porta está aberta
            if (this.doorObject && this.doorObject.isOpen) {
                // Verifica a posição exata do jogador na área da porta
                // player.y <= 100 (parte superior da porta)
                // player.x entre 300 e 360 (largura da porta)
                if (player.y <= 100 && player.x >= 300 && player.x <= 360) {
                    // Vai para a sala de aula
                    return {
                        nextScene: 'classroom',
                        startX: 400,    // Posição X na classroom
                        startY: 500     // Posição Y na classroom (perto da porta de saída)
                    };
                }
            }

            return null;
        }

        // Obtém informações do cenário
        getInfo() {
            return {
                doorIsOpen: this.doorObject ? this.doorObject.isOpen : false,
                objectsCount: this.objects.length
            };
        }
    }

    global.Hallway02Scene = Hallway02Scene;

})(window);