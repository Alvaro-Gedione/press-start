// entrance.js - Módulo de gerenciamento do cenário de entrada
(function (global) {
    'use strict';

    // Configuração do cenário
    const config = {
        backgroundImage: './src/img/scenarios/entrance.png',
        canvasWidth: 800,
        canvasHeight: 600,
        playerStartX: 400,
        playerStartY: 300
    };

    // Definição dos objetos de colisão e interação
    const sceneObjects = [
        // Paredes sólidas

        { x: 0, y: 0, width: 800, height: 20, type: 'solid', name: 'parede_superior' },        // Parede inferior
        { x: 0, y: 0, width: 270, height: 75, type: 'solid', name: 'parede_superior_esquerdo' },          // Parede superior esquerda
        { x: 505, y: 0, width: 300, height: 75, type: 'solid', name: 'parede_superior_direito' },        // Parede superior direita
        { x: 0, y: 580, width: 800, height: 20, type: 'solid', name: 'parede_inferior' },        // Parede inferior
        { x: 0, y: 0, width: 20, height: 600, type: 'solid', name: 'parede_esquerda' },          // Parede esquerda
        { x: 780, y: 0, width: 20, height: 600, type: 'solid', name: 'parede_direita' },

        // Blocos decorativos
        { x: 88, y: 120, width: 40, height: 10, type: 'solid', name: 'bloco_decorativo_esq' },
        { x: 665, y: 120, width: 40, height: 10, type: 'solid', name: 'bloco_decorativo_dir' },

        // Objeto empurrável (caixa)
        { x: 500, y: 300, width: 55, height: 55, type: 'pushable', name: 'caixa_madeira' },

        // Objeto interativo
        { x: 680, y: 520, width: 50, height: 50, type: 'interactive', name: 'roda_interativa' }
    ];

    // Mensagens de interação
    const interactionMessages = {
        'roda_interativa': '🔧 Você interagiu com a roda! Algo mágico aconteceu...',
        'caixa_madeira': '📦 A caixa se moveu!'
    };

    class EntranceScene {
        constructor() {
            this.backgroundImage = new Image();
            this.backgroundImage.src = config.backgroundImage;
            this.objects = [];
            this.player = null;
            this.isLoaded = false;
        }

        // Inicializa o cenário
        init() {
            this.createObjects();
            this.loadBackground();
            return this;
        }

        // Cria os objetos a partir da configuração
        createObjects() {
            this.objects = sceneObjects.map(obj => {
                const newObj = { ...obj };
                if (obj.type === 'interactive') {
                    newObj.interactionCount = 0;
                    newObj.lastInteraction = 0;
                }
                return newObj;
            });
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
                        console.warn('Não foi possível carregar o fundo');
                        this.isLoaded = true;
                        resolve();
                    };
                }
            });
        }

        // Desenha o cenário de fundo
        drawBackground(ctx, canvasWidth, canvasHeight) {
            if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
                ctx.drawImage(this.backgroundImage, 0, 0, canvasWidth, canvasHeight);
            } else {
                // Fallback gradient
                const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                grad.addColorStop(0, '#87CEEB');
                grad.addColorStop(1, '#98FB98');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                ctx.fillStyle = '#5C4033';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText("🏫 Escola Ideal - Carregando cenário...", 20, 40);
            }
        }

        // Desenha todos os objetos do cenário
        drawObjects(ctx) {
            this.objects.forEach(obj => {
                if (obj.type === 'solid') {
                    this.drawSolidObject(ctx, obj);
                } else if (obj.type === 'pushable') {
                    this.drawPushableObject(ctx, obj);
                } else if (obj.type === 'interactive') {
                    this.drawInteractiveObject(ctx, obj);
                }
            });
        }

        // Desenha objeto sólido (parede)
        drawSolidObject(ctx, obj) {
            // Base da parede
            ctx.fillStyle = 'rgba(139, 69, 19, 0.85)';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

            // Bordas
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

            // Textura de tijolo
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, 8);
            ctx.fillRect(obj.x + 5, obj.y + obj.height - 13, obj.width - 10, 8);

            // Detalhes de tijolos
            ctx.fillStyle = '#D2691E';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(obj.x + 15 + (i * 20), obj.y + obj.height / 2 - 5, 12, 10);
            }
        }

        // Desenha objeto empurrável (caixa)
        drawPushableObject(ctx, obj) {
            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(obj.x + 3, obj.y + 3, obj.width, obj.height);

            // Caixa
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

            // Detalhes da caixa
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(obj.x + 8, obj.y + 15, obj.width - 16, 6);
            ctx.fillRect(obj.x + 8, obj.y + obj.height - 21, obj.width - 16, 6);

            // Emoji da caixa
            ctx.font = `${obj.height * 0.5}px sans-serif`;
            ctx.fillStyle = '#8B4513';
            ctx.fillText("📦", obj.x + obj.width / 2 - 12, obj.y + obj.height / 2 + 8);
        }

        // Desenha objeto interativo
        drawInteractiveObject(ctx, obj) {
            // Efeito de brilho
            ctx.fillStyle = 'rgba(0, 206, 209, 0.3)';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

            // Base
            ctx.fillStyle = '#00CED1';
            ctx.fillRect(obj.x + 3, obj.y + 3, obj.width - 6, obj.height - 6);
            ctx.strokeStyle = '#008B8B';
            ctx.lineWidth = 3;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

            // Engrenagem animada
            const angle = Date.now() / 500;
            ctx.save();
            ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
            ctx.rotate(angle);

            // Desenha engrenagem
            ctx.font = `${obj.height * 0.5}px sans-serif`;
            ctx.fillStyle = '#FFD700';
            ctx.fillText("⚙️", -15, 10);
            ctx.restore();

            // Tooltip
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText("🔧 INTERAGIR", obj.x + 8, obj.y - 5);

            // Efeito de pulsação
            if (Date.now() % 2000 < 1000) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00CED1';
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                ctx.shadowBlur = 0;
            }
        }

        // Verifica colisão entre dois retângulos
        checkCollision(rect1, rect2) {
            return !(rect1.x + rect1.width <= rect2.x ||
                rect1.x >= rect2.x + rect2.width ||
                rect1.y + rect1.height <= rect2.y ||
                rect1.y >= rect2.y + rect2.height);
        }

        // Tenta empurrar um objeto
        tryPushObject(obj, dx, dy, sourceRect) {
            if (obj.type !== 'pushable') return false;

            const newX = obj.x + dx;
            const newY = obj.y + dy;
            const newRect = { x: newX, y: newY, width: obj.width, height: obj.height };

            // Verifica colisão com outros objetos
            for (let other of this.objects) {
                if (other === obj) continue;
                if (this.checkCollision(newRect, other)) return false;
            }

            // Verifica limites do canvas
            if (newX < 0 || newY < 0 ||
                newX + obj.width > config.canvasWidth ||
                newY + obj.height > config.canvasHeight) {
                return false;
            }

            obj.x = newX;
            obj.y = newY;
            return true;
        }

        // Processa movimento com colisões
        processMovement(player, dx, dy, onInteraction) {
            let moved = false;
            let newX = player.x + dx;
            let newY = player.y + dy;

            // Movimento no eixo X
            const playerNewRectX = { x: newX, y: player.y, width: player.width, height: player.height };
            let collidesX = false;

            for (let obj of this.objects) {
                if (this.checkCollision(playerNewRectX, obj)) {
                    if (obj.type === 'pushable') {
                        if (this.tryPushObject(obj, dx, 0, playerNewRectX)) {
                            // Empurrou com sucesso
                        } else {
                            collidesX = true;
                        }
                    } else {
                        collidesX = true;
                    }
                    if (collidesX) break;
                }
            }

            if (!collidesX) {
                player.x = newX;
                moved = true;
            }

            // Movimento no eixo Y
            const playerNewRectY = { x: player.x, y: newY, width: player.width, height: player.height };
            let collidesY = false;

            for (let obj of this.objects) {
                if (this.checkCollision(playerNewRectY, obj)) {
                    if (obj.type === 'pushable') {
                        if (this.tryPushObject(obj, 0, dy, playerNewRectY)) {
                            // Empurrou com sucesso
                        } else {
                            collidesY = true;
                        }
                    } else {
                        collidesY = true;
                    }
                    if (collidesY) break;
                }
            }

            if (!collidesY) {
                player.y = newY;
                moved = true;
            }

            // Verifica interações
            for (let obj of this.objects) {
                if (obj.type === 'interactive' && this.checkCollision(player, obj)) {
                    const now = Date.now();
                    if (now - obj.lastInteraction > 1000) {
                        obj.lastInteraction = now;
                        obj.interactionCount++;
                        if (onInteraction) {
                            let message = interactionMessages[obj.name] || `✨ Você interagiu com ${obj.name}! ✨`;
                            if (obj.interactionCount === 2) message += " 🌟 Interação dupla!";
                            if (obj.interactionCount === 3) message += " 🎉 Efeito especial!";
                            onInteraction(message, obj);
                        }
                    }
                    break;
                }
            }

            return moved;
        }

        // Reinicia objetos empurráveis para posição original
        resetPushableObjects() {
            const originalPositions = {
                'caixa_madeira': { x: 500, y: 300 }
            };

            this.objects.forEach(obj => {
                if (obj.type === 'pushable' && originalPositions[obj.name]) {
                    obj.x = originalPositions[obj.name].x;
                    obj.y = originalPositions[obj.name].y;
                }
            });
        }

        // Atualiza a lógica da cena
        update(player) {
            if (player.y <= 24) {
                return { 
                    nextScene: 'hallway00', 
                    startX: player.x, 
                    startY: 510 
                };
            }
            return null;
        }

        // Obtém informações do cenário
        getInfo() {
            return {
                solidCount: this.objects.filter(o => o.type === 'solid').length,
                pushableCount: this.objects.filter(o => o.type === 'pushable').length,
                interactiveCount: this.objects.filter(o => o.type === 'interactive').length,
                totalObjects: this.objects.length
            };
        }
    }

    // Exporta o módulo
    global.EntranceScene = EntranceScene;
    global.EntranceConfig = config;

})(window);