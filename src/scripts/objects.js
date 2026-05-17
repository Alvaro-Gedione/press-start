// ==================== SISTEMA DE OBJETOS DE COLISÃO ====================

class CollisionObject {
    constructor(x, y, width, height, imageSrc = null, type = 'solid', name = '') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = null;
        this.type = type; // 'solid', 'pushable', 'trigger', 'collectible', 'interactive'
        this.name = name;
        this.isMoving = false;
        this.lastInteraction = 0;

        // Carregar imagem se fornecida
        if (imageSrc) {
            this.image = new Image();
            this.image.src = imageSrc;
        }
    }

    // Desenhar o objeto
    draw(ctx) {
        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Cores padrão por tipo
            const colors = {
                'solid': '#8B5E3C',
                'pushable': '#F4D03F',
                'trigger': '#4ECDC4',
                'collectible': '#FF6B6B',
                'interactive': 'rgba(255, 215, 0, 0.4)'
            };
            ctx.fillStyle = colors[this.type] || '#95A5A6';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Borda para identificar tipo
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Ícone indicador
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${Math.min(this.width, this.height) * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const icons = {
                'solid': '🧱',
                'pushable': '📦',
                'trigger': '✨',
                'collectible': '⭐',
                'interactive': '🔘'
            };
            ctx.fillText(icons[this.type] || '❓', this.x + this.width / 2, this.y + this.height / 2);
        }
    }

    // Verificar colisão com retângulo
    collidesWith(rect) {
        return this.x < rect.x + rect.width &&
            this.x + this.width > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.height > rect.y;
    }

    // Tentar empurrar o objeto
    tryPush(dx, dy, allObjects, canvas) {
        if (this.type !== 'pushable') return false;

        let newX = this.x + dx;
        let newY = this.y + dy;

        // Verificar limites do canvas
        if (newX < 0 || newX + this.width > (canvas.width || 800) ||
            newY < 0 || newY + this.height > (canvas.height || 600)) {
            return false;
        }

        // Verificar colisão com outros objetos
        for (let obj of allObjects) {
            if (obj === this) continue;
            if (newX < obj.x + obj.width && newX + this.width > obj.x &&
                newY < obj.y + obj.height && newY + this.height > obj.y) {
                return false;
            }
        }

        this.x = newX;
        this.y = newY;
        this.isMoving = true;
        return true;
    }
}

/**
 * Objeto interativo com animação baseada em pasta
 */
class AnimatedInteractiveObject extends CollisionObject {
    constructor(x, y, width, height, folder, name = '') {
        super(x, y, width, height, null, 'interactive', name);
        this.folder = folder;
        this.frames = [];
        this.staticImage = new Image();
        this.staticImage.src = `${folder}/static.png`;
        
        this.currentFrame = -1; // -1 significa static
        this.targetFrame = -1;
        this.isAnimating = false;
        this.animationDirection = 1; // 1 para frente, -1 para trás
        this.lastFrameTime = 0;
        this.frameDelay = 100; // ms entre frames
        
        this.loadFrames();
    }

    async loadFrames() {
        // Tenta carregar frames move00, move01... até falhar
        let index = 0;
        let loading = true;
        
        while (loading && index < 20) { // Limite de segurança de 20 frames
            const frameStr = index.toString().padStart(2, '0');
            const img = new Image();
            img.src = `${this.folder}/move${frameStr}.png`;
            
            // Usamos uma promessa para verificar se a imagem existe
            const success = await new Promise(resolve => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });
            
            if (success) {
                this.frames.push(img);
                index++;
            } else {
                loading = false;
            }
        }
        console.log(`Objeto ${this.name} carregou ${this.frames.length} frames de animação.`);
    }

    interact() {
        if (this.isAnimating) return; // Não interrompe animação em curso
        
        this.isAnimating = true;
        if (this.currentFrame <= 0) {
            // Inicia animação para frente
            this.animationDirection = 1;
            this.targetFrame = this.frames.length - 1;
            this.currentFrame = 0;
        } else {
            // Inicia animação para trás
            this.animationDirection = -1;
            this.targetFrame = -1;
            this.currentFrame = this.frames.length - 1;
        }
    }

    update(now) {
        if (!this.isAnimating || this.frames.length === 0) return;

        if (now - this.lastFrameTime > this.frameDelay) {
            this.lastFrameTime = now;
            
            if (this.currentFrame === this.targetFrame) {
                this.isAnimating = false;
            } else {
                this.currentFrame += this.animationDirection;
            }
        }
    }

    draw(ctx) {
        let imgToDraw = this.staticImage;
        
        if (this.currentFrame >= 0 && this.frames[this.currentFrame]) {
            imgToDraw = this.frames[this.currentFrame];
        }

        if (imgToDraw.complete && imgToDraw.naturalWidth > 0) {
            ctx.drawImage(imgToDraw, this.x, this.y, this.width, this.height);
        } else {
            super.draw(ctx);
        }
    }
}

// ==================== FUNÇÕES DE CRIAÇÃO DE OBJETOS ====================

function createObject(x, y, width, height, imageSrc = null, type = 'solid', name = '', folder = null) {
    if (type === 'interactive' && folder) {
        return new AnimatedInteractiveObject(x, y, width, height, folder, name);
    }
    return new CollisionObject(x, y, width, height, imageSrc, type, name);
}

function drawObjects(ctx, objects) {
    const now = Date.now();
    for (let obj of objects) {
        if (obj.update) obj.update(now);
        obj.draw(ctx);
    }
}

// Exportando para o escopo global se necessário
if (typeof window !== 'undefined') {
    window.CollisionObject = CollisionObject;
    window.AnimatedInteractiveObject = AnimatedInteractiveObject;
    window.createObject = createObject;
    window.drawObjects = drawObjects;
}
