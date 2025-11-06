// ===== Configuration =====
const CONFIG = {
    API_URL: 'https://chatbotcv-backend-2.onrender.com/', // Thay đổi URL khi deploy
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
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    newChatBtn: document.getElementById('newChatBtn'),
    themeToggle: document.getElementById('themeToggle'),
    chatContainer: document.getElementById('chatContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    messagesContainer: document.getElementById('messagesContainer'),
    suggestionsContainer: document.getElementById('suggestionsContainer'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    chatHistory: document.getElementById('chatHistory'),
    modeButtons: document.querySelectorAll('.mode-btn'),
    exampleButtons: document.querySelectorAll('.example-btn')
};

// ===== Initialize State =====
const state = new ChatState();

// ===== Theme Management =====
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        elements.themeToggle.addEventListener('click', () => this.toggle());
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, theme);
        
        const icon = elements.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ===== UI Manager =====
class UIManager {
    static showWelcome() {
        elements.welcomeScreen.style.display = 'flex';
        elements.messagesContainer.style.display = 'none';
    }

    static showMessages() {
        elements.welcomeScreen.style.display = 'none';
        elements.messagesContainer.style.display = 'block';
    }

    static toggleSidebar() {
        elements.sidebar.classList.toggle('open');
        elements.sidebarOverlay.classList.toggle('active');
    }

    static closeSidebar() {
        elements.sidebar.classList.remove('open');
        elements.sidebarOverlay.classList.remove('active');
    }

    static scrollToBottom() {
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    }

    static showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-header">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-author">Jarvis</div>
            </div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
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
        
        const avatar = role === 'user' 
            ? '<i class="fas fa-user"></i>' 
            : '<i class="fas fa-robot"></i>';
        
        const author = role === 'user' ? 'You' : 'Jarvis';

        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="message-avatar">${avatar}</div>
                <div class="message-author">${author}</div>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;

        elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    static formatMessage(text) {
        // Convert markdown-like syntax to HTML
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Handle code blocks
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        return formatted;
    }

    static showSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            elements.suggestionsContainer.style.display = 'none';
            return;
        }

        elements.suggestionsContainer.style.display = 'block';
        elements.suggestionsContainer.innerHTML = `
            <div class="suggestions-title"> Câu hỏi gợi ý:</div>
            <div class="suggestions-grid" id="suggestionsGrid">
                ${suggestions.map(s => `
                    <button class="suggestion-btn" data-suggestion="${this.escapeHtml(s)}">
                        ${this.escapeHtml(s)}
                    </button>
                `).join('')}
            </div>
        `;

        // Add event listeners
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestion = btn.getAttribute('data-suggestion');
                chatManager.sendMessage(suggestion);
            });
        });

        // Add swipe hint for mobile
        if (ResponsiveManager.isMobile()) {
            const grid = document.getElementById('suggestionsGrid');
            if (grid && grid.scrollWidth > grid.clientWidth) {
                grid.style.position = 'relative';
            }
        }
    }

    static hideSuggestions() {
        elements.suggestionsContainer.style.display = 'none';
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
        elements.messageInput.disabled = true;
        elements.sendBtn.disabled = true;
    }

    static enableInput() {
        elements.messageInput.disabled = false;
        elements.sendBtn.disabled = false;
        elements.messageInput.focus();
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
        UIManager.showMessages();
        UIManager.hideSuggestions();
        UIManager.disableInput();

        // Add user message to UI
        UIManager.addMessage('user', message);
        state.addMessage('user', message);

        // Clear input
        elements.messageInput.value = '';
        this.adjustTextareaHeight();

        // Show typing indicator
        UIManager.showTypingIndicator();

        try {
            // Send message to API
            const response = await APIManager.sendMessage(
                message,
                state.currentMode,
                state.sessionId,
                state.conversationHistory
            );

            // Add assistant message
            UIManager.addMessage('assistant', response.answer);
            state.addMessage('assistant', response.answer);

            // Get suggestions
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
        // Clear UI
        elements.messagesContainer.innerHTML = '';
        UIManager.showWelcome();
        UIManager.hideSuggestions();

        // Clear state
        APIManager.clearSession(state.sessionId);
        state.clearHistory();

        // Clear input
        elements.messageInput.value = '';
        this.adjustTextareaHeight();
    }

    changeMode(mode) {
        state.setMode(mode);
        UIManager.updateModeButtons(mode);
        
        // If there are messages, notify about mode change
        if (state.conversationHistory.length > 0) {
            UIManager.addMessage('assistant', `🔄 Đã chuyển sang chế độ: ${this.getModeName(mode)}`);
        }
    }

    getModeName(mode) {
        const names = {
            'cv': 'CV & Career',
            'life': 'Life & Advice',
            'technical': 'Technical'
        };
        return names[mode] || mode;
    }

    adjustTextareaHeight() {
        elements.messageInput.style.height = 'auto';
        elements.messageInput.style.height = elements.messageInput.scrollHeight + 'px';
    }
}

// ===== Initialize Managers =====
const themeManager = new ThemeManager();
const chatManager = new ChatManager();

// ===== Event Listeners =====
function initializeEventListeners() {
    // Sidebar toggle
    elements.sidebarToggle.addEventListener('click', () => {
        UIManager.toggleSidebar();
    });

    // Sidebar overlay click (đóng sidebar trên mobile)
    elements.sidebarOverlay.addEventListener('click', () => {
        UIManager.closeSidebar();
    });

    // New chat
    elements.newChatBtn.addEventListener('click', () => {
        chatManager.startNewChat();
    });

    // Mode buttons
    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            chatManager.changeMode(mode);
        });
    });

    // Example questions
    elements.exampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.getAttribute('data-question');
            chatManager.sendMessage(question);
        });
    });

    // Send button
    elements.sendBtn.addEventListener('click', () => {
        const message = elements.messageInput.value;
        chatManager.sendMessage(message);
    });

    // Input events
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

    // Close sidebar on mobile when clicking outside (handled by overlay now)
    // Removed duplicate logic as we now use overlay
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
        // Close sidebar on resize to desktop
        if (this.isDesktop() && elements.sidebar.classList.contains('open')) {
            UIManager.closeSidebar();
        }

        // Adjust textarea on orientation change
        chatManager.adjustTextareaHeight();
    }

    static init() {
        // Handle window resize with debounce
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
                UIManager.scrollToBottom();
            }, 300);
        });

        // Prevent zoom on double tap for better UX
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
}

// ===== Initialize App =====
function initializeApp() {
    console.log('Initializing BaroDev AI Assistant...');
    
    // Set initial mode
    UIManager.updateModeButtons(state.currentMode);
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize responsive manager
    ResponsiveManager.init();
    
    // Show welcome screen
    UIManager.showWelcome();
    
    console.log('✅ App initialized successfully!');
    console.log(`📱 Device: ${ResponsiveManager.isMobile() ? 'Mobile' : ResponsiveManager.isTablet() ? 'Tablet' : 'Desktop'}`);
}

// ===== Start the app =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
