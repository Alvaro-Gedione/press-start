// classroom.js - Módulo da sala de aula
(function (global) {
    'use strict';

    class ClassroomScene {
        constructor() {
            this.backgroundImage = new Image();
            this.backgroundImage.src = './src/img/scenarios/classroom.png';
            this.objects = [];
            this.isLoaded = false;
        }

        // Inicializa o cenário
        init() {
            this.createObjects();
            this.loadBackground();
            return this;
        }

        // Cria os objetos da sala de aula
        createObjects() {
            const classroomObjects = [
                // Paredes externas
                { x: 0, y: 0, width: 800, height: 120, type: 'solid', name: 'parede_superior' },
                { x: 0, y: 580, width: 300, height: 20, type: 'solid', name: 'parede_inferior_direita' },
                { x: 425, y: 580, width: 375, height: 20, type: 'solid', name: 'parede_inferior_esquerda' },
                { x: 0, y: 0, width: 20, height: 600, type: 'solid', name: 'parede_esquerda' },
                { x: 780, y: 0, width: 20, height: 600, type: 'solid', name: 'parede_direita' },

                // Carteiras (obstáculos)
                { x: 100, y: 150, width: 60, height: 10, type: 'solid', name: 'carteira1' },
                { x: 220, y: 150, width: 60, height: 10, type: 'solid', name: 'carteira2' },
                { x: 340, y: 150, width: 60, height: 10, type: 'solid', name: 'carteira3' },
                { x: 460, y: 150, width: 60, height: 10, type: 'solid', name: 'carteira4' },
                { x: 580, y: 150, width: 60, height: 10, type: 'solid', name: 'carteira5' },
                { x: 100, y: 280, width: 60, height: 10, type: 'solid', name: 'carteira6' },

                // Mesa do professor (interativa)
                {
                    x: 350, y: 400, width: 100, height: 60,
                    type: 'interactive',
                    name: 'mesa_professor',
                    message: '👨‍🏫 A mesa do professor tem muitos livros interessantes!'
                },

                // Quadro negro (interativo)
                {
                    x: 250, y: 30, width: 300, height: 80,
                    type: 'interactive',
                    name: 'quadro_negro',
                    message: '📝 O quadro diz: "Bem-vindos à Escola Ideal - Hoje vamos aprender algo novo!"'
                },

                // Estante de livros (interativa)
                {
                    x: 650, y: 200, width: 80, height: 150,
                    type: 'interactive',
                    name: 'estante_livros',
                    message: '📚 Você encontrou um livro especial sobre autoconhecimento! +10 de inspiração!'
                }
            ];

            // Converte objetos normais para CollisionObject
            this.objects = classroomObjects.map(obj => {
                // Se já for InteractiveDoor, mantém como está
                if (obj instanceof InteractiveDoor) return obj;

                // Se for interativo com mensagem
                if (obj.type === 'interactive') {
                    const newObj = new CollisionObject(
                        obj.x, obj.y, obj.width, obj.height,
                        null, obj.type, obj.name
                    );
                    newObj.interactionMessage = obj.message;
                    newObj.interact = function () {
                        return { message: this.interactionMessage };
                    };
                    return newObj;
                }

                // Objeto normal (solid)
                return new CollisionObject(
                    obj.x, obj.y, obj.width, obj.height,
                    null, obj.type, obj.name
                );
            });

            // Guarda referência da porta de saída
            this.exitDoor = this.objects.find(obj => obj.name === 'porta_saida');
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
                        console.warn('Não foi possível carregar classroom.png, usando fundo padrão');
                        this.isLoaded = true;
                        resolve();
                    };
                }
            });
        }

        // Desenha o cenário da sala de aula
        drawBackground(ctx, canvasWidth, canvasHeight) {
            if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
                ctx.drawImage(this.backgroundImage, 0, 0, canvasWidth, canvasHeight);
            } else {
                // Fundo padrão para sala de aula
                // Parede
                ctx.fillStyle = '#F5E6D3';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                // Chão
                ctx.fillStyle = '#D2B48C';
                ctx.fillRect(0, 450, canvasWidth, canvasHeight - 450);

                // Linhas do chão (taco)
                ctx.strokeStyle = '#C4A57B';
                ctx.lineWidth = 1;
                for (let i = 0; i < 20; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 50, 450);
                    ctx.lineTo(i * 50, canvasHeight);
                    ctx.stroke();
                }

                // Quadro negro
                ctx.fillStyle = '#2C3E2C';
                ctx.fillRect(200, 40, 400, 100);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 20px "Comic Sans MS", cursive';
                ctx.fillText('ESCOLA IDEAL', 320, 95);
                ctx.font = '14px sans-serif';
                ctx.fillStyle = '#FFFF99';
                ctx.fillText('"O conhecimento transforma vidas"', 300, 125);

                // Título da cena
                ctx.fillStyle = '#5D3A1A';
                ctx.font = 'bold 24px "Baloo 2", cursive';
                ctx.fillText('🏫 SALA DE AULA', canvasWidth / 2 - 100, 35);
            }
        }

        // Desenha todos os objetos
        drawObjects(ctx) {
            const now = Date.now();
            this.objects.forEach(obj => {
                if (obj.update) obj.update(now);

                // Desenha o objeto (com imagem padrão ou fallback)
                if (obj.image && obj.image.complete && obj.image.naturalWidth > 0) {
                    ctx.drawImage(obj.image, obj.imgX || obj.x, obj.imgY || obj.y,
                        obj.imgWidth || obj.width, obj.imgHeight || obj.height);
                } else {
                    // Desenho fallback baseado no tipo
                    if (obj.name && obj.name.includes('carteira')) {
                        // Desenha carteira escolar
                        ctx.fillStyle = '#8B6914';
                        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                        ctx.fillStyle = '#DAA520';
                        ctx.fillRect(obj.x + 10, obj.y + 10, obj.width - 20, obj.height - 20);
                        ctx.fillStyle = '#000';
                        ctx.font = '20px sans-serif';
                        ctx.fillText('📚', obj.x + obj.width / 2 - 10, obj.y + obj.height / 2 + 8);
                    } else if (obj.type === 'interactive') {
                        // Efeito de brilho para objetos interativos
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                        ctx.fillStyle = '#FFD700';
                        ctx.font = `${Math.min(obj.width, obj.height) * 0.6}px sans-serif`;

                        if (obj.name === 'mesa_professor') {
                            ctx.fillText('👨‍🏫', obj.x + obj.width / 2 - 15, obj.y + obj.height / 2 + 8);
                        } else if (obj.name === 'quadro_negro') {
                            ctx.fillText('📝', obj.x + obj.width / 2 - 15, obj.y + obj.height / 2 + 8);
                        } else if (obj.name === 'estante_livros') {
                            ctx.fillText('📚', obj.x + obj.width / 2 - 15, obj.y + obj.height / 2 + 8);
                        } else {
                            ctx.fillText('⭐', obj.x + obj.width / 2 - 12, obj.y + obj.height / 2 + 8);
                        }
                    } else {
                        // Desenho padrão
                        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                        ctx.strokeStyle = '#555';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                    }
                }
            });
        }

        // Verifica colisão
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

        // Processa movimento do jogador
        processMovement(player, dx, dy, onInteraction) {
            let moved = false;

            // Movimento em X
            const rectX = { x: player.x + dx, y: player.y, width: player.width, height: player.height };
            let collX = false;

            for (let obj of this.objects) {
                if (this.checkCollision(rectX, obj)) {
                    // Se for porta e estiver aberta, permite passagem
                    if (obj.type === 'door' && obj.isOpen && obj.isPassageClear(rectX.x, rectX.y, rectX.width, rectX.height)) {
                        continue;
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
                        continue;
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

            // Verifica interações (para objetos interativos)
            for (let obj of this.objects) {
                if (obj.type === 'interactive' && this.checkCollision(player, obj)) {
                    const now = Date.now();
                    if (now - (obj.lastInteraction || 0) > 1000) {
                        obj.lastInteraction = now;
                        if (obj.interact) {
                            const result = obj.interact();
                            if (result && result.message && onInteraction) {
                                onInteraction(result.message);
                            }
                        } else if (obj.interactionMessage && onInteraction) {
                            onInteraction(obj.interactionMessage);
                        }
                    }
                    break;
                }
            }

            return moved;
        }

        // Método para interagir com a porta de saída
        interactWithDoor() {
            if (this.exitDoor && !this.exitDoor.isAnimating) {
                const result = this.exitDoor.interact();
                if (result && result.message) {
                    return result.message;
                }
                return this.exitDoor.isOpen ? '🚪 Porta aberta! Pode sair pela parte superior!' : '🚪 Porta fechada!';
            }
            return null;
        }

        // Atualiza lógica da cena
        update(player) {
            // Verifica se o jogador está na posição da porta de saída (player.y <= 20 e x entre 300 e 360)
            // e se a porta está aberta
            if (player.y >= 520 && player.x >= 300 && player.x <= 360) {
                if (this.exitDoor) {
                    console.log('Saindo da sala de aula - voltando para hallway02');
                    return {
                        nextScene: 'hallway02',
                        startX: 350,      // Posição X na hallway02 (perto da porta)
                        startY: 100       // Posição Y na hallway02 (logo abaixo da porta)
                    };
                } else {
                    // Se a porta não estiver aberta, mostra mensagem
                    if (typeof window !== 'undefined' && window.showToast) {
                        window.showToast('🔒 A porta está trancada! Interaja com ela para abrir.', 2000);
                    }
                }
            }
            return null;
        }

        // Reinicia objetos (se necessário)
        resetObjects() {
            // Fecha a porta se estiver aberta
            if (this.exitDoor && this.exitDoor.isOpen) {
                this.exitDoor.isOpen = false;
                this.exitDoor.currentFrame = -1;
                this.exitDoor.isAnimating = false;
            }
        }

        // Obtém informações do cenário
        getInfo() {
            return {
                objectsCount: this.objects.length,
                interactiveCount: this.objects.filter(o => o.type === 'interactive').length,
                doorIsOpen: this.exitDoor ? this.exitDoor.isOpen : false
            };
        }
    }

    // Exporta o módulo
    global.ClassroomScene = ClassroomScene;

})(window);