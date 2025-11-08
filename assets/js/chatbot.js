// ===== Configuration =====
const CONFIG = {
    API_URL: 'http://127.0.0.1:8000/',
    SESSION_STORAGE_KEY: 'chatbot_session',
    THEME_STORAGE_KEY: 'chatbot_theme',
    CHAT_MODE_STORAGE_KEY: 'chatbot_mode'
};

// ===== State Management =====
class ChatState {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.currentMode = localStorage.getItem(CONFIG.CHAT_MODE_STORAGE_KEY) || 'cv';
        this.conversationHistory = [];
        this.isTyping = false;
    }

    generateSessionId() {
        const stored = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
        if (stored) return stored;
        
        const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, newId);
        return newId;
    }

    addMessage(role, content) {
        this.conversationHistory.push({ role, content });
    }

    clearHistory() {
        this.conversationHistory = [];
        this.sessionId = this.generateSessionId();
    }

    setMode(mode) {
        this.currentMode = mode;
        localStorage.setItem(CONFIG.CHAT_MODE_STORAGE_KEY, mode);
    }
}

// ===== DOM Elements =====
const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    sidebarToggle: document.getElementById('toggle-sidebar'),
    newChatBtn: document.getElementById('new-chat'),
    themeToggle: document.getElementById('toggle-theme'),
    chatContainer: document.getElementById('messages'),
    messagesContainer: document.getElementById('messages'),
    messageInput: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-button'),
    chatHistory: document.getElementById('chat-history'),
    modeButtons: document.querySelectorAll('.chat-mode-btn'),
    aboutBtn: document.getElementById('about-btn'),
    clearHistoryBtn: document.getElementById('clear-history'),
    currentChatTitle: document.getElementById('current-chat-title')
};

// ===== Initialize State =====
const state = new ChatState();

// ===== Theme Management =====
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, theme);
        
        if (elements.themeToggle) {
            const icon = elements.themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            const span = elements.themeToggle.querySelector('span');
            if (span) {
                span.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            }
        }
    }
}

// ===== UI Manager =====
class UIManager {
    static showWelcome(mode) {
        const modeInfo = this.getModeName(mode);
        const modeDesc = this.getModeDescription(mode);
        const examples = this.getModeExamples(mode);
        
        elements.messagesContainer.innerHTML = `
            <div class="intro-message">
                <h1>Welcome to ${modeInfo} Mode</h1>
                <p>${modeDesc}</p>
                <div class="suggestion-chips">
                    ${examples.map(ex => `<button class="suggestion-chip">${ex}</button>`).join('')}
                </div>
            </div>
        `;
        
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                elements.messageInput.value = chip.textContent;
                chatManager.sendMessage(chip.textContent);
            });
        });
    }

    static showMessages() {
        // Messages already showing
    }

    static toggleSidebar() {
        elements.sidebar.classList.toggle('hidden');
        elements.sidebarOverlay.classList.toggle('active');
    }

    static closeSidebar() {
        elements.sidebar.classList.add('hidden');
        elements.sidebarOverlay.classList.remove('active');
    }

    static scrollToBottom() {
        if (elements.chatContainer) {
            elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
        }
    }

    static showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        elements.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    static hideTypingIndicator() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    static addMessage(role, content) {
        this.hideTypingIndicator();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = this.formatMessage(content);
        
        messageDiv.appendChild(messageContent);
        elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    static formatMessage(text) {
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        return formatted;
    }

    static showSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return;
        }

        const existing = document.querySelector('.suggestions-container');
        if (existing) existing.remove();

        const maxSuggestions = ResponsiveManager.isMobile() ? 3 : 5;
        const displayedSuggestions = suggestions.slice(0, maxSuggestions);

        const container = document.createElement('div');
        container.className = 'suggestions-container';
        container.innerHTML = `
            <div class="suggestions-title">💡 Câu hỏi gợi ý:</div>
            <div class="suggestions-grid">
                ${displayedSuggestions.map(s => `
                    <button class="suggestion-chip" data-suggestion="${this.escapeHtml(s)}">
                        ${this.escapeHtml(s)}
                    </button>
                `).join('')}
            </div>
        `;

        elements.messagesContainer.appendChild(container);

        container.querySelectorAll('.suggestion-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestion = btn.getAttribute('data-suggestion');
                elements.messageInput.value = suggestion;
                chatManager.sendMessage(suggestion);
            });
        });

        this.scrollToBottom();
    }

    static hideSuggestions() {
        const container = document.querySelector('.suggestions-container');
        if (container) container.remove();
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static updateModeButtons(mode) {
        elements.modeButtons.forEach(btn => {
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    static disableInput() {
        if (elements.messageInput) elements.messageInput.disabled = true;
        if (elements.sendBtn) elements.sendBtn.disabled = true;
    }

    static enableInput() {
        if (elements.messageInput) elements.messageInput.disabled = false;
        if (elements.sendBtn) elements.sendBtn.disabled = false;
        if (elements.messageInput) elements.messageInput.focus();
    }

    static getModeName(mode) {
        const names = {
            'cv': 'CV Ask',
            'digital-twin': 'Digital Twin'
        };
        return names[mode] || mode;
    }

    static getModeDescription(mode) {
        const descriptions = {
            'cv': 'Hỏi về CV, kinh nghiệm và sự nghiệp của tôi.',
            'digital-twin': 'Trò chuyện với phiên bản AI của tôi.'
        };
        return descriptions[mode] || 'Start chatting!';
    }

    static getModeExamples(mode) {
        const examples = {
            'cv': [
                'Tell me about your work experience',
                'What are your technical skills?',
                'What projects have you worked on?',
                'What is your educational background?'
            ],
            'digital-twin': [
                'What motivates you in your work?',
                'How do you approach problem-solving?',
                'What are your career goals?',
                'Tell me about your interests'
            ]
        };
        return examples[mode] || ['Hello!'];
    }
}

// ===== API Manager =====
class APIManager {
    static async sendMessage(message, mode, sessionId, conversationHistory) {
        try {
            const response = await fetch(`${CONFIG.API_URL}chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    chat_mode: mode,
                    session_id: sessionId,
                    conversation_history: conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    static async getSuggestions(currentQuestion, mode) {
        try {
            const response = await fetch(`${CONFIG.API_URL}suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_question: currentQuestion,
                    chat_mode: mode
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.suggestions;
        } catch (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }
    }

    static async clearSession(sessionId) {
        try {
            await fetch(`${CONFIG.API_URL}clear-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId
                })
            });
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }
}

// ===== Chat Manager =====
class ChatManager {
    async sendMessage(message) {
        if (!message.trim() || state.isTyping) return;

        state.isTyping = true;
        UIManager.hideSuggestions();
        UIManager.disableInput();

        UIManager.addMessage('user', message);
        state.addMessage('user', message);

        elements.messageInput.value = '';
        this.adjustTextareaHeight();

        UIManager.showTypingIndicator();

        try {
            const response = await APIManager.sendMessage(
                message,
                state.currentMode,
                state.sessionId,
                state.conversationHistory
            );

            UIManager.addMessage('assistant', response.answer);
            state.addMessage('assistant', response.answer);

            const suggestions = await APIManager.getSuggestions(message, state.currentMode);
            UIManager.showSuggestions(suggestions);

        } catch (error) {
            UIManager.hideTypingIndicator();
            UIManager.addMessage('assistant', '⚠️ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            state.isTyping = false;
            UIManager.enableInput();
        }
    }

    startNewChat() {
        elements.messagesContainer.innerHTML = '';
        UIManager.showWelcome(state.currentMode);
        UIManager.hideSuggestions();

        APIManager.clearSession(state.sessionId);
        state.clearHistory();

        if (elements.messageInput) {
            elements.messageInput.value = '';
            this.adjustTextareaHeight();
        }
        
        if (elements.currentChatTitle) {
            elements.currentChatTitle.textContent = `${UIManager.getModeName(state.currentMode)} - New Chat`;
        }
    }

    changeMode(mode) {
        const oldMode = state.currentMode;
        state.setMode(mode);
        UIManager.updateModeButtons(mode);
        
        if (oldMode !== mode) {
            this.startNewChat();
        }
        
        if (ResponsiveManager.isMobile()) {
            UIManager.closeSidebar();
        }
    }

    adjustTextareaHeight() {
        if (elements.messageInput) {
            elements.messageInput.style.height = 'auto';
            elements.messageInput.style.height = elements.messageInput.scrollHeight + 'px';
        }
    }
}

// ===== Initialize Managers =====
const themeManager = new ThemeManager();
const chatManager = new ChatManager();

// ===== Event Listeners =====
function initializeEventListeners() {
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            UIManager.toggleSidebar();
        });
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', () => {
            UIManager.closeSidebar();
        });
    }

    if (elements.newChatBtn) {
        elements.newChatBtn.addEventListener('click', () => {
            chatManager.startNewChat();
        });
    }

    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            chatManager.changeMode(mode);
        });
    });

    if (elements.aboutBtn) {
        elements.aboutBtn.addEventListener('click', () => {
            showAboutInfo();
            if (ResponsiveManager.isMobile()) {
                UIManager.closeSidebar();
            }
        });
    }

    if (elements.sendBtn) {
        elements.sendBtn.addEventListener('click', () => {
            const message = elements.messageInput.value;
            chatManager.sendMessage(message);
        });
    }

    if (elements.messageInput) {
        elements.messageInput.addEventListener('input', () => {
            chatManager.adjustTextareaHeight();
        });

        elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = elements.messageInput.value;
                chatManager.sendMessage(message);
            }
        });

        if (ResponsiveManager.isMobile()) {
            elements.messageInput.addEventListener('focus', () => {
                setTimeout(() => {
                    UIManager.scrollToBottom();
                }, 300);
            });
        }
    }
}

// ===== About Info =====
function showAboutInfo() {
    elements.messagesContainer.innerHTML = `
      <div class="about-message">
        <h1><i class="fas fa-user-circle"></i> Về Tôi</h1>
        
        <h2><i class="fas fa-info-circle"></i> Giới Thiệu</h2>
        <p>
          Xin chào! Tôi là <strong>Tống Gia Bảo</strong>, một lập trình viên đam mê công nghệ 
          và phát triển phần mềm. Tôi có kinh nghiệm trong việc xây dựng các ứng dụng web 
          và chatbot AI.
        </p>

        <h2><i class="fas fa-code"></i> Kỹ Năng</h2>
        <ul>
          <li>Lập trình Frontend: HTML, CSS, JavaScript, React</li>
          <li>Lập trình Backend: Node.js, Python</li>
          <li>AI & Machine Learning: OpenAI API, ChatGPT Integration</li>
          <li>Database: MongoDB, MySQL</li>
          <li>Version Control: Git, GitHub</li>
        </ul>

        <h2><i class="fas fa-project-diagram"></i> Dự Án</h2>
        <ul>
          <li>NeoChat AI - Chatbot thông minh với giao diện hiện đại</li>
          <li>Các ứng dụng web tương tác cao</li>
          <li>Tích hợp AI vào các hệ thống thực tế</li>
        </ul>

        <h2><i class="fas fa-envelope"></i> Liên Hệ</h2>
        <div class="social-links">
          <a href="https://github.com/tonggiabao8825" target="_blank">
            <i class="fab fa-github"></i> GitHub
          </a>
          <a href="mailto:tonggiabao8825@gmail.com">
            <i class="fas fa-envelope"></i> Email
          </a>
        </div>
      </div>
    `;
}

// ===== Responsive Utilities =====
class ResponsiveManager {
    static isMobile() {
        return window.innerWidth <= 768;
    }

    static isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    static isDesktop() {
        return window.innerWidth > 1024;
    }

    static handleResize() {
        if (this.isDesktop() && elements.sidebar && !elements.sidebar.classList.contains('hidden')) {
            UIManager.closeSidebar();
        }

        chatManager.adjustTextareaHeight();
    }

    static init() {
        if (this.isMobile() && elements.sidebar) {
            elements.sidebar.classList.add('hidden');
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
                UIManager.scrollToBottom();
            }, 300);
        });

        if (this.isMobile()) {
            let lastHeight = window.innerHeight;
            window.visualViewport?.addEventListener('resize', () => {
                const currentHeight = window.visualViewport.height;
                const diff = lastHeight - currentHeight;
                
                if (diff > 150) {
                    setTimeout(() => {
                        UIManager.scrollToBottom();
                    }, 100);
                }
                lastHeight = currentHeight;
            });
        }
    }
}

// ===== Initialize App =====
function initializeApp() {
    console.log('🚀 Initializing Chatbot...');
    
    UIManager.updateModeButtons(state.currentMode);
    
    initializeEventListeners();
    
    ResponsiveManager.init();
    
    UIManager.showWelcome(state.currentMode);
    
    console.log('✅ App initialized successfully!');
    console.log(`📱 Device: ${ResponsiveManager.isMobile() ? 'Mobile' : ResponsiveManager.isTablet() ? 'Tablet' : 'Desktop'}`);
    console.log(`🎨 Theme: ${themeManager.currentTheme}`);
    console.log(`💬 Mode: ${state.currentMode}`);
}

// ===== Start the app =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
