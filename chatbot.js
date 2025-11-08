const CONFIG = {
    API_URL: 'https://chatbotcv-backend-2.onrender.com/',
    SESSION_STORAGE_KEY: 'chatbot_session',
    THEME_STORAGE_KEY: 'chatbot_theme',
    CHAT_HISTORY_KEY: 'chatbot_chat_history',
    CURRENT_CHAT_KEY: 'chatbot_current_chat',
    MODE_MAPPING: {
        'cv': 'cv',
        'digital-twin': 'human_chat'
    }
};

// ===== Chat History Manager =====
class ChatHistoryManager {
    constructor() {
        this.chats = this.loadChats();
        this.currentChatId = localStorage.getItem(CONFIG.CURRENT_CHAT_KEY) || null;
    }

    loadChats() {
        try {
            const stored = localStorage.getItem(CONFIG.CHAT_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading chat history:', error);
            return [];
        }
    }

    saveChats() {
        try {
            localStorage.setItem(CONFIG.CHAT_HISTORY_KEY, JSON.stringify(this.chats));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    createChat(mode, firstMessage) {
        const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const chat = {
            id: chatId,
            mode: mode,
            title: this.generateTitle(firstMessage, mode),
            timestamp: Date.now(),
            messages: [],
            lastUpdated: Date.now()
        };
        
        this.chats.unshift(chat); // Add to beginning
        this.currentChatId = chatId;
        this.saveChats();
        localStorage.setItem(CONFIG.CURRENT_CHAT_KEY, chatId);
        
        return chat;
    }

    generateTitle(message, mode) {
        const maxLength = 50;
        let title = message.trim();
        
        if (title.length > maxLength) {
            title = title.substring(0, maxLength) + '...';
        }
        
        const modePrefix = mode === 'cv' ? '💼' : '🤖';
        return `${modePrefix} ${title}`;
    }

    updateChatTitle(chatId, newTitle) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.title = newTitle;
            this.saveChats();
        }
    }

    addMessage(chatId, role, content) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.messages.push({ role, content, timestamp: Date.now() });
            chat.lastUpdated = Date.now();
            this.saveChats();
        }
    }

    getCurrentChat() {
        return this.chats.find(c => c.id === this.currentChatId);
    }

    loadChat(chatId) {
        this.currentChatId = chatId;
        localStorage.setItem(CONFIG.CURRENT_CHAT_KEY, chatId);
        return this.chats.find(c => c.id === chatId);
    }

    deleteChat(chatId) {
        this.chats = this.chats.filter(c => c.id !== chatId);
        
        if (this.currentChatId === chatId) {
            this.currentChatId = null;
            localStorage.removeItem(CONFIG.CURRENT_CHAT_KEY);
        }
        
        this.saveChats();
    }

    clearAllChats() {
        this.chats = [];
        this.currentChatId = null;
        this.saveChats();
        localStorage.removeItem(CONFIG.CURRENT_CHAT_KEY);
    }

    getRecentChats(limit = 20) {
        return this.chats
            .sort((a, b) => b.lastUpdated - a.lastUpdated)
            .slice(0, limit);
    }
}

// ===== State Management =====
class ChatState {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.currentMode = null;
        this.conversationHistory = [];
        this.isTyping = false;
        this.currentChatId = null;
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
        
        // Save to chat history
        if (this.currentChatId) {
            chatHistoryManager.addMessage(this.currentChatId, role, content);
        }
    }

    clearHistory() {
        this.conversationHistory = [];
        this.currentChatId = null;
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    getBackendMode() {
        return CONFIG.MODE_MAPPING[this.currentMode] || this.currentMode;
    }

    loadConversationFromHistory(messages) {
        this.conversationHistory = messages.map(m => ({
            role: m.role,
            content: m.content
        }));
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

// ===== Initialize Managers =====
const chatHistoryManager = new ChatHistoryManager();
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
    static showIntroMessage() {
        elements.messagesContainer.innerHTML = `
            <div class="intro-message">
                <h1>Hello guys,</h1>
                <p>Mình có một tên miền cá nhân chưa dùng đến, mình thấy khá phí nên muốn làm một thứ gì đó thật cá nhân nên mình quyết định build nên trang web này.</p>
                <p>Mình có hai chế độ chat:</p>
                <br>
                <p>- Trò chuyện với trợ lý của tôi (CV ASK)</p><br>
                <p>- Trò chuyện với tôi phiên bản trùng sinh (DIGITAL TWIN)</p>
                <br>
                <p>Với chế độ Digital twin, về cơ bản tôi đang cố gắng xây dựng một phiên bản số của tôi (ở mức độ những gì một thằng sinh viên có thể làm). Mặc dù biết mức độ khả thi không được cao, nhưng tôi xem như đây là một trải nghiệm mới và một mục tiêu mà tôi ấp ủ khá lâu (fan cuồng của IronMan mà :v)<br>
                Anyway thì còn khá nhiều thiếu sót về lượng thông tin được lưu trữ, hi vọng việc bỏ ôn thi để build project này là xứng đáng =))</p>
                <br>
                <div class="mode-selection-prompt">
                    <h3>From BaroDev with luv</h3>
                </div>
            </div>
        `;
    }

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
            requestAnimationFrame(() => {
                elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
            });
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
        const escapeHtml = (unsafe) => {
            const div = document.createElement('div');
            div.textContent = unsafe;
            return div.innerHTML;
        };

        let formatted = escapeHtml(text);
        
        formatted = formatted
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
            <div class="suggestions-title">💡 Câu hỏi đề xuất:</div>
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
            if (mode && btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    static disableInput() {
        if (elements.messageInput) {
            elements.messageInput.disabled = true;
            elements.messageInput.placeholder = "Vui lòng chọn chế độ chat trước...";
        }
        if (elements.sendBtn) elements.sendBtn.disabled = true;
        
        document.body.setAttribute('data-mode-required', 'true');
    }

    static enableInput() {
        if (elements.messageInput) {
            elements.messageInput.disabled = false;
            elements.messageInput.placeholder = "Type your message here...";
            elements.messageInput.focus();
        }
        if (elements.sendBtn) elements.sendBtn.disabled = false;
        
        document.body.setAttribute('data-mode-required', 'false');
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
            'cv': 'Trò chuyện với trợ lí Jarvis, cô ấy sẽ cung cấp các thông tin về học tập và công việc, các dự án cá nhân của tôi.',
            'digital-twin': 'Trò chuyện với Bora, phiên bản số của tôi. Mục tiêu là làm cho bạn không phân biệt được đâu là tôi, đâu là Bora.'
        };
        return descriptions[mode] || 'Start chatting!';
    }

    static getModeExamples(mode) {
        const examples = {
            'cv': [
                'Kinh nghiệm làm việc của bạn như thế nào?',
                'Bạn có những kỹ năng kỹ thuật gì?',
                'Dự án nào bạn đã làm?',
                'Bạn đã tốt nghiệp chưa?'
            ],
            'digital-twin': [
                'Bạn tên là gì?',
                'Bạn có người yêu không?',
                'Bạn có những người bạn thân nào?',
                'Kể cho tôi nghe về tuổi thơ của bạn'
            ]
        };
        return examples[mode] || ['Hello!'];
    }

    static renderChatHistory() {
        if (!elements.chatHistory) return;

        const chats = chatHistoryManager.getRecentChats();
        
        if (chats.length === 0) {
            elements.chatHistory.innerHTML = '<div class="no-history">Chưa có lịch sử chat</div>';
            return;
        }

        elements.chatHistory.innerHTML = chats.map(chat => `
            <div class="chat-history-item ${chat.id === state.currentChatId ? 'active' : ''}" 
                 data-chat-id="${chat.id}">
                <div class="chat-item-content" data-chat-id="${chat.id}">
                    <div class="chat-item-title">${this.escapeHtml(chat.title)}</div>
                    <div class="chat-item-date">${this.formatDate(chat.lastUpdated)}</div>
                </div>
                <button class="chat-item-delete" data-chat-id="${chat.id}" title="Xóa chat">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Add event listeners
        elements.chatHistory.querySelectorAll('.chat-item-content').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                chatManager.loadChatFromHistory(chatId);
            });
        });

        elements.chatHistory.querySelectorAll('.chat-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = btn.getAttribute('data-chat-id');
                chatManager.deleteChatFromHistory(chatId);
            });
        });
    }

    static formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        return date.toLocaleDateString('vi-VN');
    }

    static updateChatTitle(title) {
        if (elements.currentChatTitle) {
            elements.currentChatTitle.textContent = title;
        }
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
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
                console.warn(`Suggestions API error: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return data.suggestions || [];
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
        if (!state.currentMode) {
            UIManager.addMessage('assistant', '⚠️ Vui lòng chọn chế độ chat ở sidebar trước khi gửi tin nhắn!');
            return;
        }

        if (!message || !message.trim() || state.isTyping) return;

        const trimmedMessage = message.trim();
        
        if (trimmedMessage.length > 5000) {
            UIManager.addMessage('assistant', '⚠️ Tin nhắn quá dài. Vui lòng giới hạn dưới 5000 ký tự.');
            return;
        }

        // Create new chat if this is the first message
        if (!state.currentChatId) {
            const chat = chatHistoryManager.createChat(state.currentMode, trimmedMessage);
            state.currentChatId = chat.id;
            UIManager.updateChatTitle(chat.title);
            UIManager.renderChatHistory();
        }

        state.isTyping = true;
        UIManager.hideSuggestions();
        UIManager.disableInput();

        UIManager.addMessage('user', trimmedMessage);
        state.addMessage('user', trimmedMessage);

        elements.messageInput.value = '';
        this.adjustTextareaHeight();

        UIManager.showTypingIndicator();

        try {
            const backendMode = state.getBackendMode();
            
            const response = await APIManager.sendMessage(
                trimmedMessage,
                backendMode,
                state.sessionId,
                state.conversationHistory
            );

            UIManager.addMessage('assistant', response.answer);
            state.addMessage('assistant', response.answer);

            const suggestions = await APIManager.getSuggestions(trimmedMessage, backendMode);
            UIManager.showSuggestions(suggestions);

        } catch (error) {
            UIManager.hideTypingIndicator();
            const errorMessage = error.message.includes('Failed to fetch') 
                ? '⚠️ Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
                : '⚠️ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
            UIManager.addMessage('assistant', errorMessage);
            console.error('Chat error:', error);
        } finally {
            state.isTyping = false;
            UIManager.enableInput();
        }
    }

    startNewChat() {
        elements.messagesContainer.innerHTML = '';
        
        state.currentMode = null;
        state.currentChatId = null;
        UIManager.updateModeButtons(null);
        UIManager.showIntroMessage();
        UIManager.hideSuggestions();
        UIManager.disableInput();

        APIManager.clearSession(state.sessionId);
        state.clearHistory();

        if (elements.messageInput) {
            elements.messageInput.value = '';
            this.adjustTextareaHeight();
        }
        
        UIManager.updateChatTitle('New Conversation');
        localStorage.removeItem(CONFIG.CURRENT_CHAT_KEY);
    }

    changeMode(mode) {
        if (!CONFIG.MODE_MAPPING[mode]) {
            console.warn(`Invalid mode: ${mode}`);
            return;
        }

        const oldMode = state.currentMode;
        state.setMode(mode);
        UIManager.updateModeButtons(mode);
        UIManager.enableInput();
        
        UIManager.showWelcome(mode);
        UIManager.hideSuggestions();
        
        if (oldMode !== mode && oldMode !== null) {
            APIManager.clearSession(state.sessionId);
            state.clearHistory();
            state.currentChatId = null;
        }
        
        UIManager.updateChatTitle(`${UIManager.getModeName(mode)} - New Chat`);
        
        if (ResponsiveManager.isMobile()) {
            UIManager.closeSidebar();
        }
    }

    loadChatFromHistory(chatId) {
        const chat = chatHistoryManager.loadChat(chatId);
        if (!chat) return;

        state.currentChatId = chatId;
        state.currentMode = chat.mode;
        state.loadConversationFromHistory(chat.messages);

        UIManager.updateModeButtons(chat.mode);
        UIManager.enableInput();

        elements.messagesContainer.innerHTML = '';
        
        chat.messages.forEach(msg => {
            UIManager.addMessage(msg.role, msg.content);
        });

        UIManager.updateChatTitle(chat.title);
        UIManager.renderChatHistory();

        if (ResponsiveManager.isMobile()) {
            UIManager.closeSidebar();
        }
    }

    deleteChatFromHistory(chatId) {
        const isCurrentChat = state.currentChatId === chatId;
        
        if (confirm('Bạn có chắc muốn xóa đoạn chat này?')) {
            chatHistoryManager.deleteChat(chatId);
            UIManager.renderChatHistory();
            
            if (isCurrentChat) {
                this.startNewChat();
            }
        }
    }

    clearAllHistory() {
        if (confirm('Bạn có chắc muốn xóa TẤT CẢ lịch sử chat? Hành động này không thể hoàn tác!')) {
            chatHistoryManager.clearAllChats();
            UIManager.renderChatHistory();
            this.startNewChat();
        }
    }

    adjustTextareaHeight() {
        if (elements.messageInput) {
            elements.messageInput.style.height = 'auto';
            const newHeight = Math.min(elements.messageInput.scrollHeight, 200);
            elements.messageInput.style.height = newHeight + 'px';
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

    if (elements.clearHistoryBtn) {
        elements.clearHistoryBtn.addEventListener('click', () => {
            chatManager.clearAllHistory();
        });
    }
}

// ===== About Info =====
function showAboutInfo() {
    elements.messagesContainer.innerHTML = `
<div class="about-message">
  <h1><i class="fas fa-user-circle"></i> Về Tôi</h1>

  <h2><i class="fas fa-info-circle"></i> Giới Thiệu</h2>
  <p>
    Xin chào! Tôi là <strong>Tống Gia Bảo (BaroDev)</strong> — một <strong>AI Engineer</strong> và 
    <strong>Backend Developer</strong> đam mê xây dựng các ứng dụng tích hợp trí tuệ nhân tạo.  
    Tôi yêu thích việc kết hợp giữa <em>AI reasoning</em> và <em>real-world application</em> để tạo ra 
    những hệ thống hữu ích, thông minh và thân thiện với người dùng.
  </p>

  <h2><i class="fas fa-project"></i> Về Dự Án </h2>
  <p>
    Đây là <strong>AI Assistant cá nhân</strong> mà tôi phát triển, mô phỏng tính cách và tư duy của chính tôi.  
    Chatbot này hoạt động với hai chế độ chính:
  </p>
  <ul>
    <li><strong>CV Ask:</strong> Cung cấp thông tin về sự nghiệp, kỹ năng và kinh nghiệm làm việc của tôi.</li>
    <li><strong>Digital Twin:</strong> Phiên bản trùng sinh của tôi</li>
  </ul>

  <h2><i class="fas fa-code"></i> Kỹ Năng</h2>
  <ul>
    <li><strong>AI & Machine Learning:</strong> RAG Pipeline, LangChain, OpenAI API, Google Gemini API, Deep Learning, Machine Leaning, Build model from scratch.</li>
    <li><strong>Backend Development:</strong> FastAPI, Node.js, RESTful API Design</li>
    <li><strong>Frontend Development:</strong> HTML, CSS, JavaScript, React</li>
    <li><strong>Database:</strong> MongoDB, MySQL</li>
    <li><strong>Version Control:</strong> Git, GitHub</li>
  </ul>

  <h2><i class="fas fa-project-diagram"></i> Dự Án Tiêu Biểu</h2>
  <ul>
    <li>
      <strong>Admission Advisor:</strong>  
      Hệ thống tư vấn tuyển sinh đại học sử dụng LLM, giúp học sinh tra cứu thông tin 
      và nhận gợi ý chọn trường phù hợp
    </li>
    <li>
      <strong>AI Personal Assistant:</strong>  
      Trợ lý ảo thông minh tích hợp <em>Knowledge Graph</em> và LLM, 
      có khả năng trả lời câu hỏi và phân tích CV.
    </li>
    <li>
      <strong>Virtual Painting:</strong>  
      Ứng dụng vẽ trong không gian thật bằng <em>hand gesture recognition</em> (Computer Vision) 
      sử dụng OpenCV và Mediapipe.
    </li>
    <li>
      <strong>AI Digital Twin:</strong>  
      Phiên bản AI của chính tôi, có khả năng trò chuyện, ghi nhớ và phản hồi tự nhiên như con người.
    </li>
    <li>
      <strong>Time Series Forecasting:</strong>  
      Thử nghiệm các mô hình ANN, LSTM và Transfer Learning để dự đoán dữ liệu chuỗi thời gian.
    </li>
  </ul>

  <h2><i class="fas fa-envelope"></i> Liên Hệ</h2>
  <div class="social-links">
    <a href="https://github.com/tonggiabao8825" target="_blank" rel="noopener noreferrer">
      <i class="fab fa-github"></i> GitHub
    </a>
    <a href="mailto:tonggiabao8825@gmail.com">
      <i class="fas fa-envelope"></i> Email
    </a>
  </div>
</div>

    `;
}

//responisve
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

        if (this.isMobile() && window.visualViewport) {
            let lastHeight = window.innerHeight;
            window.visualViewport.addEventListener('resize', () => {
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

function initializeApp() {
    
    state.currentMode = null;
    
    UIManager.updateModeButtons(null);
    
    UIManager.disableInput();
    initializeEventListeners();
    ResponsiveManager.init();
    UIManager.showIntroMessage();
    

}

// ===== Start the app =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}