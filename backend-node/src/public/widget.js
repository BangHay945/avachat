(function() {
  "use strict";

  // ── Configuration ──────────────────────────────────
  var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var API_URL = "http://localhost:4000";
  var CONTAINER_ID = "avachat-widget";
  var TOGGLE_ID = "avachat-toggle";
  var FRAME_ID = "avachat-frame";
  var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  var ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

  // ── Styles ─────────────────────────────────────────
  function injectStyles() {
    var css = [
      "#" + CONTAINER_ID + " { position:fixed; bottom:24px; right:24px; z-index:2147483647; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }",
      "#" + TOGGLE_ID + " { width:56px; height:56px; border-radius:50%; background:#7c3aed; border:none; cursor:pointer; box-shadow:0 4px 16px rgba(124,58,237,0.4); display:flex; align-items:center; justify-content:center; transition:all 0.2s; position:relative; }",
      "#" + TOGGLE_ID + ":hover { transform:scale(1.05); box-shadow:0 6px 20px rgba(124,58,237,0.5); }",
      "#" + TOGGLE_ID + " svg { width:24px; height:24px; fill:white; }",
      "#" + TOGGLE_ID + " .badge { position:absolute; top:-4px; right:-4px; background:#ef4444; color:white; font-size:11px; font-weight:bold; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; display:none; }",
      "#" + FRAME_ID + " { position:absolute; bottom:72px; right:0; width:380px; height:560px; background:white; border-radius:16px; box-shadow:0 8px 32px rgba(0,0,0,0.15); overflow:hidden; display:none; flex-direction:column; }",
      "#" + FRAME_ID + ".open { display:flex; }",
      "#" + FRAME_ID + " .header { background:#7c3aed; color:white; padding:16px; display:flex; align-items:center; gap:12px; }",
      "#" + FRAME_ID + " .header .avatar { width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:18px; }",
      "#" + FRAME_ID + " .header .info { flex:1; }",
      "#" + FRAME_ID + " .header .info .name { font-weight:600; font-size:15px; }",
      "#" + FRAME_ID + " .header .info .status { font-size:12px; opacity:0.8; }",
      "#" + FRAME_ID + " .header .close-btn { background:none; border:none; color:white; cursor:pointer; padding:4px; font-size:20px; opacity:0.8; }",
      "#" + FRAME_ID + " .header .close-btn:hover { opacity:1; }",
      "#" + FRAME_ID + " .messages { flex:1; overflow-y:auto; padding:16px; background:#f8fafc; display:flex; flex-direction:column; gap:8px; }",
      "#" + FRAME_ID + " .messages .bubble { max-width:80%; padding:10px 14px; border-radius:16px; font-size:14px; line-height:1.5; word-break:break-word; }",
      "#" + FRAME_ID + " .messages .bubble.agent { align-self:flex-start; background:white; color:#1e293b; border-bottom-left-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05); }",
      "#" + FRAME_ID + " .messages .bubble.customer { align-self:flex-end; background:#7c3aed; color:white; border-bottom-right-radius:4px; }",
      "#" + FRAME_ID + " .messages .bubble.system { align-self:center; background:rgba(124,58,237,0.1); color:#7c3aed; font-size:12px; border-radius:8px; padding:6px 12px; text-align:center; }",
      "#" + FRAME_ID + " .messages .bubble .time { font-size:10px; opacity:0.6; margin-top:4px; text-align:right; }",
      "#" + FRAME_ID + " .messages .bubble img { max-width:100%; border-radius:8px; margin-top:4px; cursor:pointer; }",
      "#" + FRAME_ID + " .messages .file-attach { display:flex; align-items:center; gap:8px; padding:8px; background:rgba(0,0,0,0.05); border-radius:8px; margin-top:4px; font-size:13px; }",
      "#" + FRAME_ID + " .typing { padding:4px 16px; font-size:12px; color:#94a3b8; display:none; }",
      "#" + FRAME_ID + " .typing.active { display:block; }",
      "#" + FRAME_ID + " .input-area { padding:12px 16px; border-top:1px solid #e2e8f0; display:flex; gap:8px; align-items:flex-end; }",
      "#" + FRAME_ID + " .input-area textarea { flex:1; border:1px solid #e2e8f0; border-radius:20px; padding:10px 16px; font-size:14px; resize:none; outline:none; max-height:100px; font-family:inherit; }",
      "#" + FRAME_ID + " .input-area textarea:focus { border-color:#7c3aed; box-shadow:0 0 0 3px rgba(124,58,237,0.1); }",
      "#" + FRAME_ID + " .input-area .send-btn, #" + FRAME_ID + " .input-area .attach-btn { width:36px; height:36px; border-radius:50%; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }",
      "#" + FRAME_ID + " .input-area .send-btn { background:#7c3aed; color:white; }",
      "#" + FRAME_ID + " .input-area .send-btn:disabled { opacity:0.5; cursor:not-allowed; }",
      "#" + FRAME_ID + " .input-area .send-btn:hover:not(:disabled) { background:#6d28d9; }",
      "#" + FRAME_ID + " .input-area .attach-btn { background:#f1f5f9; color:#64748b; }",
      "#" + FRAME_ID + " .input-area .attach-btn:hover { background:#e2e8f0; }",
      "#" + FRAME_ID + " .pre-chat { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px; gap:16px; }",
      "#" + FRAME_ID + " .pre-chat h3 { font-size:18px; color:#1e293b; }",
      "#" + FRAME_ID + " .pre-chat p { font-size:14px; color:#64748b; text-align:center; }",
      "#" + FRAME_ID + " .pre-chat input { width:100%; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; font-size:14px; outline:none; }",
      "#" + FRAME_ID + " .pre-chat input:focus { border-color:#7c3aed; }",
      "#" + FRAME_ID + " .pre-chat .start-btn { background:#7c3aed; color:white; border:none; border-radius:8px; padding:10px 24px; font-size:15px; font-weight:600; cursor:pointer; }",
      "#" + FRAME_ID + " .pre-chat .start-btn:hover { background:#6d28d9; }",
      "#" + FRAME_ID + " .pre-chat .start-btn:disabled { opacity:0.5; cursor:not-allowed; }",
      "#" + FRAME_ID + " .error-banner { background:#fef2f2; color:#dc2626; padding:8px 16px; font-size:12px; text-align:center; display:none; }",
      "#" + FRAME_ID + " .error-banner.show { display:block; }",
      "@media(max-width:480px) {",
      "  #" + FRAME_ID + " { width:100vw; height:100vh; bottom:0; right:0; border-radius:0; position:fixed; }",
      "  #" + FRAME_ID + ".open { bottom:0; }",
      "  #" + TOGGLE_ID + " { display:none; }",
      "}",
    ].join("\n");
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Helper ─────────────────────────────────────────
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function isImage(type) {
    return type && type.startsWith("image/");
  }

  function triggerDownload(url, filename) {
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── API Client ─────────────────────────────────────
  function apiPost(path, body) {
    return fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function(r) { return r.json(); });
  }

  function apiGet(path) {
    return fetch(API_URL + path).then(function(r) { return r.json(); });
  }

  // ── File Upload ────────────────────────────────────
  async function uploadFile(file) {
    try {
      return await fileToDataUrl(file);
    } catch (e) {
      console.error("Upload error:", e);
      throw e;
    }
  }

  function fileToDataUrl(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() { resolve({ dataUrl: reader.result, name: file.name, type: file.type }); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function createFileInput() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx";
    input.style.display = "none";
    document.body.appendChild(input);
    return input;
  }

  // ── Chat Widget ────────────────────────────────────
  function ChatWidget() {
    var self = this;
    this.conversationId = null;
    this.customerName = null;
    this.isOpen = false;
    this.unreadCount = 0;
    this.userId = "customer-" + Date.now();
    this.hasPreChat = true;
    this.uploadedFiles = {};
    this.fileInput = createFileInput();
    this.typingTimer = null;
    this.elements = {};
  }

  ChatWidget.prototype.mount = function() {
    var root = document.getElementById(CONTAINER_ID);
    if (root) { root.innerHTML = ""; } else { root = document.createElement("div"); root.id = CONTAINER_ID; document.body.appendChild(root); }

    // Toggle button
    var toggle = document.createElement("button");
    toggle.id = TOGGLE_ID;
    toggle.title = "Open chat";
    toggle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><span class="badge">0</span>';
    this.elements.toggle = toggle;
    this.elements.badge = toggle.querySelector(".badge");
    var self = this;

    // Chat frame
    var frame = document.createElement("div");
    frame.id = FRAME_ID;
    frame.innerHTML = [
      '<div class="header">',
      '  <div class="avatar">💬</div>',
      '  <div class="info"><div class="name">Customer Support</div><div class="status">Online</div></div>',
      '  <button class="close-btn">&times;</button>',
      '</div>',
      '<div class="error-banner"></div>',
      '<div class="messages"></div>',
      '<div class="typing">Agent is typing...</div>',
      '<div class="pre-chat">',
      '  <h3>Welcome!</h3>',
      '  <p>Please enter your details to start a conversation.</p>',
      '  <input type="text" placeholder="Your Name" class="name-input" />',
      '  <button class="start-btn">Start Chat</button>',
      '</div>',
      '<div class="input-area" style="display:none">',
      '  <button class="attach-btn" title="Attach file">📎</button>',
      '  <textarea rows="1" placeholder="Type your message..." class="message-input"></textarea>',
      '  <button class="send-btn" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
      '</div>',
    ].join("\n");

    root.appendChild(toggle);
    root.appendChild(frame);

    this.elements.root = root;
    this.elements.frame = frame;
    this.elements.messages = frame.querySelector(".messages");
    this.elements.typing = frame.querySelector(".typing");
    this.elements.preChat = frame.querySelector(".pre-chat");
    this.elements.inputArea = frame.querySelector(".input-area");
    this.elements.messageInput = frame.querySelector("textarea.message-input");
    this.elements.sendBtn = frame.querySelector(".send-btn");
    this.elements.attachBtn = frame.querySelector(".attach-btn");
    this.elements.errorBanner = frame.querySelector(".error-banner");

    // Event listeners
    toggle.onclick = function() { self.toggle(); };
    frame.querySelector(".close-btn").onclick = function(e) { e.stopPropagation(); self.close(); };
    frame.querySelector(".start-btn").onclick = function() { self.startChat(); };
    frame.querySelector(".name-input").onkeydown = function(e) { if (e.key === "Enter") self.startChat(); };

    this.elements.messageInput.oninput = function() {
      self.elements.sendBtn.disabled = !self.elements.messageInput.value.trim();
      self.resizeTextarea();
      if (self.conversationId) {
        clearTimeout(self.typingTimer);
        self.typingTimer = setTimeout(function() { apiPost("/api/v1/webhook/simulate/" + self.conversationId + "/typing", { typing: true }); }, 300);
      }
    };
    this.elements.messageInput.onkeydown = function(e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); self.send(); }
    };
    this.elements.sendBtn.onclick = function() { self.send(); };
    this.elements.attachBtn.onclick = function() { self.fileInput.click(); };

    this.fileInput.onchange = function(e) {
      if (e.target.files.length === 0) return;
      var file = e.target.files[0];
      if (!ALLOWED_TYPES.includes(file.type)) { self.showError("File type not supported. Allowed: images, PDF, DOC"); return; }
      if (file.size > MAX_FILE_SIZE) { self.showError("File too large. Max 10MB"); return; }
      uploadFile(file).then(function(result) {
        self.uploadedFiles[result.name] = result;
        self.addMessage("customer", isImage(file.type) ? '<img src="' + result.dataUrl + '" alt="' + result.name + '" />' : '<div class="file-attach">📄 ' + escapeHtml(result.name) + '</div>');
        self.scrollToBottom();
        self.sendFile(result);
      }).catch(function() { self.showError("Failed to upload file"); });
    };
  };

  ChatWidget.prototype.toggle = function() {
    if (this.isOpen) { this.close(); } else { this.open(); }
  };

  ChatWidget.prototype.open = function() {
    this.isOpen = true;
    this.elements.frame.classList.add("open");
    this.elements.toggle.style.display = "none";
    this.resetUnread();
    if (document.getElementById(CONTAINER_ID).querySelector(".name-input")) {
      document.getElementById(CONTAINER_ID).querySelector(".name-input").focus();
    }
  };

  ChatWidget.prototype.close = function() {
    this.isOpen = false;
    this.elements.frame.classList.remove("open");
    this.elements.toggle.style.display = "flex";
  };

  ChatWidget.prototype.startChat = function() {
    var nameInput = this.elements.frame.querySelector(".name-input");
    var name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    this.customerName = name;
    this.hasPreChat = false;
    this.elements.preChat.style.display = "none";
    this.elements.inputArea.style.display = "flex";
    this.elements.messageInput.focus();

    var self = this;
    apiPost("/api/v1/webhook/simulate", {
      channel: "livechat",
      customerName: name,
      message: "Hello!",
    }).then(function(resp) {
      if (resp.success) {
        self.conversationId = resp.conversation.id;
        self.addMessage("system", "Connected! An agent will respond shortly.");
        self.scrollToBottom();
        setTimeout(function() { self.addMessage("agent", "Hello " + escapeHtml(name) + "! Welcome to our live chat. How can we help you today?"); self.scrollToBottom(); }, 1500);
      }
    }).catch(function() { self.showError("Connection failed. Please try again."); });
  };

  ChatWidget.prototype.send = function() {
    var text = this.elements.messageInput.value.trim();
    if (!text) return;
    this.elements.messageInput.value = "";
    this.elements.sendBtn.disabled = true;
    this.resizeTextarea();

    this.addMessage("customer", escapeHtml(text));
    this.scrollToBottom();

    if (!this.conversationId) return;

    var self = this;
    apiPost("/api/v1/webhook/simulate/" + this.conversationId + "/message", { message: text })
      .catch(function() { self.showError("Failed to send message"); });
  };

  ChatWidget.prototype.sendFile = function(fileData) {
    if (!this.conversationId) return;
    var self = this;
    apiPost("/api/v1/webhook/simulate/" + this.conversationId + "/message", {
      message: isImage(fileData.type) ? "[Sent an image: " + fileData.name + "]" : "[Sent a file: " + fileData.name + "]",
    }).catch(function() { self.showError("Failed to send file"); });
  };

  ChatWidget.prototype.addMessage = function(sender, content) {
    var div = document.createElement("div");
    div.className = "bubble " + sender;
    div.innerHTML = content + '<div class="time">' + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</div>';
    this.elements.messages.appendChild(div);
  };

  ChatWidget.prototype.addFileMessage = function(sender, fileData) {
    var div = document.createElement("div");
    div.className = "bubble " + sender;
    if (isImage(fileData.type)) {
      var img = document.createElement("img");
      img.src = fileData.dataUrl;
      img.alt = fileData.name;
      img.onclick = function() { triggerDownload(fileData.dataUrl, fileData.name); };
      div.appendChild(img);
    } else {
      var fileDiv = document.createElement("div");
      fileDiv.className = "file-attach";
      fileDiv.innerHTML = "📄 " + escapeHtml(fileData.name);
      fileDiv.style.cursor = "pointer";
      fileDiv.onclick = function() { triggerDownload(fileData.dataUrl, fileData.name); };
      div.appendChild(fileDiv);
    }
    div.innerHTML += '<div class="time">' + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</div>';
    this.elements.messages.appendChild(div);
  };

  ChatWidget.prototype.scrollToBottom = function() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  };

  ChatWidget.prototype.resizeTextarea = function() {
    var el = this.elements.messageInput;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  ChatWidget.prototype.showError = function(msg) {
    this.elements.errorBanner.textContent = msg;
    this.elements.errorBanner.classList.add("show");
    var self = this;
    setTimeout(function() { self.elements.errorBanner.classList.remove("show"); }, 4000);
  };

  ChatWidget.prototype.incrementUnread = function() {
    if (!this.isOpen) {
      this.unreadCount++;
      this.elements.badge.textContent = this.unreadCount > 99 ? "99+" : this.unreadCount;
      this.elements.badge.style.display = "flex";
    }
  };

  ChatWidget.prototype.resetUnread = function() {
    this.unreadCount = 0;
    this.elements.badge.style.display = "none";
  };

  // ── Initialize ─────────────────────────────────────
  injectStyles();

  var widget = new ChatWidget();
  widget.mount();
  window.AvaChatWidget = widget;
})();
