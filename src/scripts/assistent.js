// assistent.js
// Assistente Virtual para o Livreto - Mundo Mágico da Leitura
// Baseado no código original da Abelha, adaptado para o robô amigável

// ======================================================
// 1. CONFIGURAÇÕES
// ======================================================

// As chaves vêm do arquivo config.js
const GEMINI_API_KEY = window.ENV?.GEMINI_API_KEY;
const APPS_SCRIPT_URL = window.ENV?.APPS_SCRIPT_URL;

// Validação simples
if (!GEMINI_API_KEY || GEMINI_API_KEY === "COLE_SUA_CHAVE_NOVA_AQUI") {
    //console.warn("⚠️ Configure a API Key no arquivo config.js!");
}

// URL da API Gemini (usando modelo flash para respostas rápidas)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Instrução sistêmica para o assistente ROBÔ do LIVRETO
const SYSTEM_INSTRUCTION = `
Você é o **Robô do Livreto**, um assistente super divertido e amigável de um site infantil chamado "Livreto - Mundo Mágico da Leitura".

SUA PERSONALIDADE:
- Use muitos emojis! 📚✨👩‍🏫📖🌈
- Seja alegre, paciente e use linguagem simples para crianças
- Você pode usar: 📚 (livros), 👩‍🏫 (professora), ✨ (magia), 🌟 (estrela), 🎨 (arte), 🎵 (música)
- Sempre termine com uma pergunta ou incentivo para a criança continuar explorando

SUA FUNÇÃO PRINCIPAL:
Você ajuda as crianças a navegarem pelo site, sugere histórias, brincadeiras e responde perguntas sobre o mundo da leitura.

REGRAS IMPORTANTES:

1. **Se for CONVERSA NORMAL** (perguntas, sugestões, cumprimentos):
   Responda de forma natural, como um amigo professor animado!

2. **Se for uma AÇÃO ESPECÍFICA** (agendar, enviar email, salvar dados, favoritar):
   NÃO responda em texto normal. Retorne APENAS um JSON neste formato exato:

   {
     "tipo": "acao",
     "funcao": "tipo_da_acao",
     "dados": { 
        "titulo": "título extraído", 
        "data": "data no formato ISO", 
        "detalhes": "outras informações" 
     }
   }

   Tipos de função válidos: "agendar", "email", "favoritar", "lembrar"

3. **Se for uma pergunta sobre navegação no site** (ex: "quero ver histórias de dragão"):
   Responda sugerindo o card correto, mas como texto normal.

EXEMPLO DE RESPOSTA AÇÃO:
{ "tipo": "acao", "funcao": "agendar", "dados": { "titulo": "Hora do Conto", "data": "2024-03-15T15:00:00", "detalhes": "História de Dragões" } }

EXEMPLO DE CONVERSA NORMAL:
"Olá, pequeno leitor! 🌟 Que bom ver você por aqui! Hoje temos histórias incríveis de dragões e astronautas. O que você quer explorar hoje? 📚👩‍🏫"
`;

// ======================================================
// 2. ELEMENTOS DA UI
// ======================================================

// Elementos do assistente (já existem no HTML)
const assistantContainer = document.getElementById('assistantContainer');
const bubbleText = document.getElementById('bubbleText');
const helpEmoji = document.querySelector('.help-emoji'); // O robô 👩‍🏫

// Cria um elemento para debug visual (opcional)
const debugElement = document.createElement('div');
debugElement.style.position = 'fixed';
debugElement.style.bottom = '10px';
debugElement.style.left = '10px';
debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
debugElement.style.color = 'white';
debugElement.style.padding = '5px 10px';
debugElement.style.borderRadius = '20px';
debugElement.style.fontSize = '12px';
debugElement.style.zIndex = '9999';
debugElement.style.display = 'none'; // Começa escondido, ative se precisar debug
document.body.appendChild(debugElement);

function setDebug(text) {
    debugElement.textContent = text;
    //console.log('[Robô Livreto]', text);
}

// ======================================================
// 3. FUNÇÕES PRINCIPAIS
// ======================================================

/**
 * Processa o texto do usuário com a API Gemini
 * @param {string} textoUsuario - O que o usuário falou
 */
async function processarComGemini(textoUsuario) {
    if (!bubbleText) return;

    bubbleText.innerText = "Processando... 👩‍🏫✨";
    setDebug(`Processando: "${textoUsuario}"`);

    // Verifica se a API key foi configurada
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("SUA_NOVA") || GEMINI_API_KEY === "COLE_SUA_CHAVE_NOVA_AQUI") {
        bubbleText.innerText = "Ops! Preciso que meu criador configure minha chave mágica! 🔧✨";
        return;
    }

    try {
        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: SYSTEM_INSTRUCTION + "\n\nUsuário (criança) disse: " + textoUsuario
                    }]
                }]
            })
        });

        // Tratamento de erro HTTP
        if (!response.ok) {
            const errorDetails = await response.text();
            //console.error("Erro na API Gemini:", errorDetails);
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            bubbleText.innerText = "Hum... não entendi direito. Pode repetir? 🧐📖";
            return;
        }

        let respostaGemini = data.candidates[0].content.parts[0].text;
        setDebug("Resposta bruta: " + respostaGemini.substring(0, 100) + "...");

        // Limpeza: remove marcações de código JSON
        respostaGemini = respostaGemini.replace(/```json/g, "").replace(/```/g, "").trim();

        // Tenta interpretar como JSON (ação)
        try {
            const comando = JSON.parse(respostaGemini);

            if (comando.tipo === "acao") {
                bubbleText.innerText = "Claro! Vou fazer isso pra você! ⚙️✨";
                setDebug(`Ação detectada: ${comando.funcao}`);

                // Verifica se tem URL do Apps Script
                if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== "" && APPS_SCRIPT_URL !== "COLE_SUA_URL_DO_APPS_SCRIPT_AQUI") {
                    executarNoAppScript(comando);
                } else {
                    // Simulação para teste
                    //console.log("🔧 Simulando ação no Apps Script:", comando);
                    bubbleText.innerText = `📋 Anotei aqui: ${comando.funcao}!\n(Livro: ${comando.dados?.titulo || 'sem título'})`;

                    // Depois de 3 segundos, volta ao normal
                    setTimeout(() => {
                        bubbleText.innerText = "Prontinho! Mais alguma coisa mágica hoje? 🌈📚";
                    }, 4000);
                }
            } else {
                // É JSON mas não é ação (improvável, mas trata)
                bubbleText.innerText = respostaGemini;
            }
        } catch (e) {
            // Não é JSON → é conversa normal
            bubbleText.innerText = respostaGemini;
        }

    } catch (erro) {
        //console.error("Erro no processamento:", erro);
        bubbleText.innerText = "Ops! Minhas engrenagens deram uma travadinha. Tente de novo! 🔧👩‍🏫";
    }
}

/**
 * Envia comando para o Google Apps Script (backend)
 * @param {Object} comandoJson - Comando no formato {tipo, funcao, dados}
 */
async function executarNoAppScript(comandoJson) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: 'cors', // Tenta com cors, se falhar, muda para 'no-cors'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(comandoJson)
        });

        // Tenta ler a resposta
        try {
            const resultado = await response.json();
            bubbleText.innerText = resultado.resposta_texto || "Feito com sucesso! 🎉📚";
        } catch (e) {
            // Se não conseguir ler JSON, assume que deu certo
            bubbleText.innerText = "Enviado para o meu caderno mágico! 📒✨";
        }

    } catch (error) {
        //console.error("Erro ao conectar com Apps Script:", error);
        bubbleText.innerText = "Não consegui me conectar com meu caderno mágico, mas anotei aqui! 📝👩‍🏫";

        // Fallback: mostra o comando
        setTimeout(() => {
            bubbleText.innerText = `✏️ Lembrete: ${comandoJson.dados?.titulo || 'ação registrada'}`;
        }, 2000);
    }
}

// ======================================================
// 4. CONTROLE DA UI E INTERAÇÃO
// ======================================================

/**
 * Alterna a visibilidade do assistente
 */
function toggleAssistant() {
    if (!assistantContainer) return;

    assistantContainer.classList.toggle('is-visible');

    if (assistantContainer.classList.contains('is-visible')) {
        // Se estiver abrindo e a mensagem for a padrão, muda para saudação
        if (bubbleText.innerText.includes("Clique em mim") || bubbleText.innerText.includes("Diga")) {
            bubbleText.innerText = "Oi! Tudo bem? Que história você quer explorar hoje? 📚👩‍🏫";
        }
    }
}

/**
 * Mostra o assistente temporariamente com uma mensagem
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {number} tempo - Tempo em ms que ficará visível (padrão 5000)
 */
function showAssistantTemporarily(mensagem, tempo = 5000) {
    if (!assistantContainer || !bubbleText) return;

    bubbleText.innerText = mensagem;
    assistantContainer.classList.add('is-visible');

    setTimeout(() => {
        assistantContainer.classList.remove('is-visible');
    }, tempo);
}

// ======================================================
// 5. WEB SPEECH API (RECONHECIMENTO DE VOZ)
// ======================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase().trim();

        setDebug(`Ouvi: "${transcript}"`);

        // Lista de triggers para acordar o robô (ajustado para ser mais sensível)
        const triggers = ["prof", "professora", "ajuda", "ei prof", "hey prof", "amiga", "oi amiga"];
        const comandoAbrir = triggers.some(trigger => transcript.includes(trigger));
        const estaVisivel = assistantContainer?.classList.contains('is-visible');

        if (comandoAbrir && !estaVisivel) {
            toggleAssistant();
            bubbleText.innerText = "Opa! Ouvi você me chamar! 🌟 Em que posso ajudar?";

            if (helpEmoji) {
                helpEmoji.classList.add('listening');
                setTimeout(() => helpEmoji.classList.remove('listening'), 2000);
            }
        }
        else if (estaVisivel || transcript.length > 3) {
            // Se o robô já está aberto ou a criança falou algo longo, envia para o Gemini
            processarComGemini(transcript);
        }
    };

    recognition.onend = () => {
        // Reinicia o reconhecimento para ficar sempre ouvindo
        setTimeout(() => {
            try {
                recognition.start();
            } catch (e) {
                // Ignora erro se já estiver started
            }
        }, 1000);
    };

    recognition.onerror = (event) => {
        //console.log("Erro no reconhecimento de voz:", event.error);
        setDebug(`Erro voz: ${event.error}`);

        // Se for erro de permissão, tenta de novo em 5s
        if (event.error === 'not-allowed') {
            setTimeout(() => {
                try { recognition.start(); } catch (e) { }
            }, 5000);
        }
    };

    // Inicia o reconhecimento
    try {
        recognition.start();
        setDebug("Reconhecimento de voz iniciado");

        // Feedback visual no robô
        if (helpEmoji) {
            helpEmoji.classList.add('listening');
            setTimeout(() => helpEmoji.classList.remove('listening'), 3000);
        }
    } catch (error) {
        //console.log("Não foi possível iniciar voz automaticamente. Aguardando interação...");

        // Tenta iniciar na primeira interação do usuário
        document.body.addEventListener('click', function startVoiceOnce() {
            try {
                recognition.start();
                setDebug("Voz iniciada após clique");
                document.body.removeEventListener('click', startVoiceOnce);
            } catch (e) { }
        }, { once: true });
    }

} else {
    //console.warn("Navegador não suporta reconhecimento de voz");
    if (bubbleText) {
        bubbleText.innerText = "Dica: Para falar comigo, use um navegador como Chrome ou Edge! 🌐👩‍🏫";
    }
}

// ======================================================
// 6. EVENT LISTENERS
// ======================================================

// Clique no robô (help-emoji) para abrir/fechar
if (helpEmoji) {
    helpEmoji.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita conflito com o showToast original
        toggleAssistant();
    });
}

// Clique fora para fechar (opcional)
document.addEventListener('click', (event) => {
    if (assistantContainer?.classList.contains('is-visible')) {
        // Se clicou fora do assistente e fora do robô
        if (!assistantContainer.contains(event.target) && !helpEmoji?.contains(event.target)) {
            assistantContainer.classList.remove('is-visible');
        }
    }
});

// ======================================================
// 7. INICIALIZAÇÃO E MENSAGENS PERIÓDICAS
// ======================================================

// Mensagem de boas-vindas após 3 segundos
setTimeout(() => {
    if (!assistantContainer?.classList.contains('is-visible')) {
        showAssistantTemporarily('📚✨ Olá! Sou sua Professora do Livreto! Me chame quando precisar de ajuda!', 4000);
    }
}, 3000);

// A cada 2 minutos, se o assistente estiver fechado, dá um "oi" sutil
setInterval(() => {
    if (!assistantContainer?.classList.contains('is-visible')) {
        const mensagens = [
            'Ei! Tudo bem? Quer ouvir uma história? 📖👩‍🏫',
            'Já escolheu sua aventura hoje? 🌟',
            'Posso ajudar você a encontrar um livro legal! 📚',
            'Que tal uma história de dragões? 🐉',
            'Você já visitou a seção de colorir? 🎨'
        ];
        const mensagem = mensagens[Math.floor(Math.random() * mensagens.length)];
        showAssistantTemporarily(mensagem, 4000);
    }
}, 120000); // 2 minutos

// Exporta funções úteis para o console (para debug)
window.LivretoAssistant = {
    toggle: toggleAssistant,
    processar: processarComGemini,
    falar: (msg) => showAssistantTemporarily(msg, 5000)
};

setDebug("🚀 Assistente Professora do Livreto carregado!");