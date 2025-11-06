// Event Listeners
document.getElementById("send-button").addEventListener("click", sendmessage);
document.getElementById("user-input").addEventListener("keypress", function(event){
    if(event.key === "Enter") {
        sendmessage();
    }
});

// Handle suggestion clicks
document.querySelectorAll('.suggestion').forEach(suggestion => {
    suggestion.addEventListener('click', function() {
        const userInput = document.getElementById("user-input");
        userInput.value = this.textContent;
        userInput.focus();
        sendmessage();
    });
});

// Function to add messages with new structure
function addMessage(type, content) {
    const chatbox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    messageDiv.className = type;
    
    // Create avatar
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    const avatarIcon = document.createElement("i");
    avatarIcon.className = type === "user-message" ? "bx bx-user" : "bx bx-bot";
    avatar.appendChild(avatarIcon);
    
    // Create message content
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    messageContent.appendChild(paragraph);
    
    // Append elements based on message type
    if (type === "user-message") {
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
    }
    
    const typingIndicator = document.querySelector(".typing-indicator");
    chatbox.insertBefore(messageDiv, typingIndicator);
    
    chatbox.scrollTop = chatbox.scrollHeight;
    
    return { messageDiv, paragraph }; 
}

// Function to simulate streaming text effect
async function streamText(element, text, speed = 30) {
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(resolve => setTimeout(resolve, speed));
        element.parentElement.parentElement.scrollTop = element.parentElement.parentElement.scrollHeight;
    }
}

// Main send message function
async function sendmessage() {
    const chatbox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input").value.trim();
    const typingIndicator = document.querySelector(".typing-indicator");
    const sendButton = document.getElementById("send-button");
    
    if(!userInput) {
        return;
    }
    
    // Add user message
    addMessage("user-message", userInput);
    document.getElementById("user-input").value = "";
    
    // Disable send button while processing
    sendButton.disabled = true;
    sendButton.style.opacity = "0.6";
    
    // Show typing indicator
    typingIndicator.style.display = "flex";
    chatbox.scrollTop = chatbox.scrollHeight;
    
    try {
        const response = await fetch("https://chatbotcv-backend-2.onrender.com/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: userInput})
        });
        
        const data = await response.json();
        typingIndicator.style.display = "none";
        const { messageDiv, paragraph } = addMessage("bot-message", "");
        await streamText(paragraph, data.answer);
    }
    catch(e) {
        typingIndicator.style.display = "none";
        const { messageDiv, paragraph } = addMessage("bot-message", "");
        await streamText(paragraph, `❌ Unable to connect to server! ${e.message}`);
    }
    finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.style.opacity = "1";
    }
}