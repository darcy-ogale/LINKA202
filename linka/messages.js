/* =========================================
   LINKA MESSAGES JAVASCRIPT
   Data comes from linka-data.js (shared with
   the Home page): real users, real profile
   pictures, saved conversations.
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const { messages: store, me, users, format } = window.LINKA;

    /* Demo only: there is no server yet, so the other
       person answers automatically. Set to false when
       a real backend delivers replies. */
    const SIMULATE_REPLIES = true;

    /* Casual Tagalog / Taglish replies. Each rule looks for
       words in what Darcy wrote and answers like a person. */
    const REPLY_RULES = [
        {
            match: /\b(musta|kumusta|kamusta|how are you|how r u)\b/i,
            replies: [
                "Uy! Okay lang naman ako, ikaw musta ka na? 😊",
                "Ayos lang! Medyo pagod pero happy naman 😅 ikaw?",
                "Okay naman, buhay pa hahaha. Ikaw ba musta?"
            ]
        },
        {
            match: /\b(maganda|ganda|app|design|linka|website|gawa)\b/i,
            replies: [
                "Grabe, ang ganda ng app mo! Ang linis ng design 🔥",
                "Oo naman maganda! Smooth pa gamitin, ikaw talaga gumawa nito? 👏",
                "Legit maganda siya ha! Sobrang bagay yung blue na theme 💙"
            ]
        },
        {
            match: /\b(kain|kumain|lunch|dinner|breakfast|gutom|ulam)\b/i,
            replies: [
                "Kakakain ko lang hehe. Ikaw, kumain ka na ba?",
                "Hindi pa ako kumakain, gutom na nga ako eh 😩",
                "Kain tayo minsan! Libre mo ha 😆"
            ]
        },
        {
            match: /\b(salamat|thanks|thank you|tenks)\b/i,
            replies: [
                "Wala 'yon! Basta ikaw 😄",
                "Walang anuman! Anytime lang 😊"
            ]
        },
        {
            match: /\b(tulog|goodnight|good night|gn|bye|paalam|ingat)\b/i,
            replies: [
                "Sige, ingat ka! Usap ulit tayo mamaya 👋",
                "Goodnight! Tulog na rin ako maya-maya 😴"
            ]
        },
        {
            match: /\b(hahaha|haha|lol|lmao|charot)\b/i,
            replies: [
                "Hahaha oo nga eh 😂",
                "Tawang-tawa ako dun ha 🤣"
            ]
        },
        {
            match: /\b(sige|ok|okay|oks|game)\b/i,
            replies: [
                "Sige sige! 👍",
                "Game! Update mo lang ako ha"
            ]
        },
        {
            match: /\b(hi|hello|hey|uy|kumusta)\b/i,
            replies: [
                "Uy Darcy! Napadaan ka 😊",
                "Hello! Ano meron?"
            ]
        }
    ];

    const DEFAULT_REPLIES = [
        "Ay talaga? Kuwento mo pa 😄",
        "Hahaha ang saya naman niyan!",
        "Oo nga eh, tama ka diyan 😊",
        "Grabe ka talaga hahaha",
        "Ganun ba? Sige, usap tayo ulit mamaya ha!",
        "Uy nice! Ano pa balita?"
    ];

    let lastReply = "";

    /* Returns 1-2 replies. If Darcy asks about two things
       (e.g. "musta na? maganda ba app ko") she answers both,
       as two quick texts, like a real person. */
    function pickReplies(text) {

        const rules = REPLY_RULES
            .filter(item => item.match.test(text))
            .slice(0, 2);

        const pools = rules.length
            ? rules.map(rule => rule.replies)
            : [DEFAULT_REPLIES];

        return pools.map(pool => {

            /* don't send the same line twice in a row */
            const choices = pool.filter(reply => reply !== lastReply);

            lastReply =
                choices[Math.floor(Math.random() * choices.length)] || pool[0];

            return lastReply;
        });
    }


    /* =========================================
       ELEMENTS
    ========================================= */

    const layout = document.getElementById("messagesLayout");
    const chatPanel = document.getElementById("chatPanel");
    const conversationList = document.getElementById("conversationList");
    const conversationCount = document.getElementById("conversationCount");
    const messageSearch = document.getElementById("messageSearch");
    const tabs = document.querySelectorAll(".tab");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const chatMessages = document.getElementById("chatMessages");
    const typingIndicator = document.getElementById("typingIndicator");
    const typingAvatar = document.getElementById("typingAvatar");
    const chatEmpty = document.getElementById("chatEmpty");
    const mobileBack = document.getElementById("mobileBack");

    const chatAvatar = document.getElementById("chatAvatar");
    const chatOnline = document.getElementById("chatOnline");
    const chatName = document.getElementById("chatName");
    const chatStatus = document.getElementById("chatStatus");

    const infoAvatar = document.getElementById("infoAvatar");
    const infoName = document.getElementById("infoName");
    const infoHandle = document.getElementById("infoHandle");
    const infoStatus = document.getElementById("infoStatus");
    const infoStatusText = document.getElementById("infoStatusText");

    const newMessageBtn = document.getElementById("newMessageBtn");
    const modal = document.getElementById("newMessageModal");
    const closeModal = document.getElementById("closeModal");
    const recipientInput = document.getElementById("recipientInput");
    const contactList = document.getElementById("contactList");

    const deleteModal = document.getElementById("deleteModal");
    const deletePreview = document.getElementById("deletePreview");
    const deleteCancel = document.getElementById("deleteCancel");
    const deleteConfirm = document.getElementById("deleteConfirm");

    const mobileQuery = window.matchMedia("(max-width: 700px)");

    let activeId = null;          /* user id of the open conversation */
    let activeFilter = "all";
    let pushedByApp = false;      /* did we add a history entry? */
    let pendingDelete = null;     /* { userId, id } waiting for confirmation */
    let holdScroll = null;        /* keep the scroll position after a delete */

    /* which message "Seen" was last drawn under, per conversation */
    const seenShown = {};

    const TRASH_ICON =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M3 6h18"/><path d="M8 6V4h8v2"/>' +
        '<path d="M6 6l1 14h10l1-14"/><path d="M10 11v5M14 11v5"/>' +
        '</svg>';

    const isMobile = () => mobileQuery.matches;
    const isChatOpen = () => layout.classList.contains("chat-open");

    /* On desktop the chat is always on screen. On a phone
       it is only "seen" once the chat screen is open. */
    const isChatVisible = () => !isMobile() || isChatOpen();


    /* =========================================
       AVATARS  (profile picture, letter fallback)
    ========================================= */

    function fillAvatar(element, user) {

        element.classList.remove(
            "avatar-blue",
            "avatar-pink",
            "avatar-green",
            "avatar-purple",
            "avatar-orange"
        );

        element.classList.add("avatar-" + user.color);

        element.textContent = "";

        const img = document.createElement("img");

        img.src = user.photo;
        img.alt = user.name;
        img.draggable = false;

        /* If the picture is missing, show the first letter */
        img.addEventListener("error", () => {
            img.remove();
            element.textContent = user.name.charAt(0);
        });

        element.appendChild(img);

        return element;
    }

    function makeAvatar(user, extraClass) {

        const element = document.createElement("div");

        element.className = "avatar" + (extraClass ? " " + extraClass : "");

        return fillAvatar(element, user);
    }


    /* =========================================
       TOP BAR  (logged-in user)
    ========================================= */

    fillAvatar(document.getElementById("meAvatar"), me);
    fillAvatar(document.getElementById("navAvatar"), me);

    document.getElementById("meName").textContent =
        me.name.split(" ")[0];


    /* =========================================
       CONVERSATION LIST
    ========================================= */

    function threadMatches(thread, query) {

        if (!query) return true;

        if (thread.user.name.toLowerCase().includes(query)) return true;

        return thread.messages.some(message =>
            message.text.toLowerCase().includes(query)
        );
    }

    function previewText(thread) {

        if (!thread.last) return "No messages yet";

        return (thread.last.from === me.id ? "You: " : "") + thread.last.text;
    }

    function renderList() {

        const query = messageSearch.value.toLowerCase().trim();

        const visible = store.threads().filter(thread => {

            if (activeFilter === "unread" && !thread.unread) return false;

            /* Direct messages only for now (no group chats yet) */
            if (activeFilter === "groups") return false;

            return threadMatches(thread, query);
        });

        conversationList.textContent = "";

        visible.forEach(thread => {

            const item = document.createElement("div");

            item.className = "conversation" +
                (thread.userId === activeId ? " active" : "");

            item.setAttribute("role", "button");
            item.tabIndex = 0;

            item.dataset.user = thread.userId;
            item.dataset.name = thread.user.name;
            item.dataset.type = "personal";
            item.dataset.unread = thread.unread ? "true" : "false";


            const avatarBox = document.createElement("div");
            avatarBox.className = "conversation-avatar";
            avatarBox.appendChild(makeAvatar(thread.user));

            if (thread.user.online) {
                const dot = document.createElement("span");
                dot.className = "online";
                avatarBox.appendChild(dot);
            }


            const info = document.createElement("div");
            info.className = "conversation-info";

            const top = document.createElement("div");
            top.className = "conversation-top";

            const name = document.createElement("strong");
            name.textContent = thread.user.name;

            const time = document.createElement("span");
            time.textContent = thread.last
                ? format.listTime(thread.last.ts)
                : "";

            top.append(name, time);


            const bottom = document.createElement("div");
            bottom.className = "conversation-bottom";

            const preview = document.createElement("p");
            preview.textContent = previewText(thread);

            bottom.appendChild(preview);

            if (thread.unread) {
                const badge = document.createElement("span");
                badge.className = "unread-count";
                badge.textContent = thread.unread;
                bottom.appendChild(badge);
            }

            info.append(top, bottom);
            item.append(avatarBox, info);

            item.addEventListener("click", () => openConversation(thread.userId));

            item.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openConversation(thread.userId);
                }
            });

            conversationList.appendChild(item);
        });


        if (!visible.length) {

            const empty = document.createElement("div");
            empty.className = "list-empty";

            empty.textContent =
                store.threads().length === 0
                    ? "No conversations yet. Tap + to start one."
                    : "No conversations found.";

            conversationList.appendChild(empty);
        }

        conversationCount.textContent =
            `${visible.length} conversation${visible.length === 1 ? "" : "s"}`;
    }


    /* =========================================
       CHAT  (header, messages, info panel)
    ========================================= */

    function buildRows(thread) {

        /* Split into day dividers + groups of consecutive
           messages from the same person. */

        const items = [];
        let lastDay = null;
        let group = null;

        thread.messages.forEach(message => {

            const day = new Date(message.ts).toDateString();

            if (day !== lastDay) {
                items.push({ type: "divider", ts: message.ts });
                lastDay = day;
                group = null;
            }

            const mine = message.from === me.id;

            if (
                group &&
                group.mine === mine &&
                message.ts - group.lastTs < 2 * 60000
            ) {
                group.messages.push(message);
                group.lastTs = message.ts;
            } else {
                group = {
                    type: "group",
                    mine,
                    messages: [message],
                    lastTs: message.ts
                };
                items.push(group);
            }
        });

        /* "Seen" (like Messenger): a small picture of the other person
           sits under the LAST of my messages they have read.
           It stays there when they reply, and only moves down when
           they read something newer - it never just vanishes. */
        let seenId = null;

        for (let i = thread.messages.length - 1; i >= 0; i--) {

            const message = thread.messages[i];

            if (message.from === me.id && message.ts <= thread.seen) {
                seenId = message.id;
                break;
            }
        }

        /* Play the little pop only when "Seen" moves to a new
           message, not on every redraw. */
        const previousSeen = seenShown[thread.userId];      /* undefined = first draw */
        const animateSeen =
            seenId !== null &&
            previousSeen !== undefined &&
            previousSeen !== seenId;

        seenShown[thread.userId] = seenId;

        function makeSeenAvatar() {

            const avatar = makeAvatar(
                thread.user,
                "seen-avatar" + (animateSeen ? " pop" : "")
            );

            avatar.title = "Seen";
            avatar.setAttribute("aria-label", "Seen by " + thread.user.name);

            return avatar;
        }

        return items.map(item => {

            if (item.type === "divider") {

                const divider = document.createElement("div");
                divider.className = "date-divider";

                const label = document.createElement("span");
                label.textContent = format.dayLabel(item.ts);

                divider.appendChild(label);

                return divider;
            }

            const row = document.createElement("div");
            row.className = "message-row " + (item.mine ? "sent" : "received");

            if (!item.mine) {
                row.appendChild(makeAvatar(thread.user, "small-avatar"));
            }

            const content = document.createElement("div");
            content.className = "message-content";

            const lastIndex = item.messages.length - 1;
            const seenIndex = item.messages.findIndex(message => message.id === seenId);

            item.messages.forEach((message, position) => {

                content.appendChild(makeBubble(message));

                /* "Seen" under a message in the middle of a group */
                if (position === seenIndex && position !== lastIndex) {

                    const seenRow = document.createElement("div");
                    seenRow.className = "seen-row";
                    seenRow.appendChild(makeSeenAvatar());

                    content.appendChild(seenRow);
                }
            });

            const time = document.createElement("span");
            time.className = "message-time";
            time.textContent = format.clock(item.lastTs);

            if (seenIndex !== -1 && seenIndex === lastIndex) {

                const meta = document.createElement("div");
                meta.className = "message-meta";

                meta.append(time, makeSeenAvatar());
                content.appendChild(meta);

            } else {

                content.appendChild(time);
            }

            row.appendChild(content);

            return row;
        });
    }

    /* One message bubble + its delete button */
    function makeBubble(message) {

        const wrap = document.createElement("div");
        wrap.className = "bubble-wrap";
        wrap.dataset.id = message.id;

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = message.text;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "msg-delete";
        remove.title = "Delete message";
        remove.setAttribute("aria-label", "Delete message");
        remove.innerHTML = TRASH_ICON;

        wrap.append(bubble, remove);

        return wrap;
    }

    function renderChat(options) {

        const thread = activeId ? store.get(activeId) : null;

        chatPanel.classList.toggle("no-chat", !thread);

        if (!thread) {
            chatMessages.replaceChildren(typingIndicator);
            typingIndicator.style.display = "none";
            return;
        }

        const user = thread.user;
        const status = user.online ? "Active now" : "Offline";


        /* Header */
        fillAvatar(chatAvatar, user);
        chatOnline.style.display = user.online ? "" : "none";
        chatName.textContent = user.name;
        chatStatus.textContent = status;
        chatStatus.classList.toggle("offline", !user.online);


        /* Info panel */
        fillAvatar(infoAvatar, user);
        infoName.textContent = user.name;
        infoHandle.textContent = user.handle;
        infoStatusText.textContent = status;
        infoStatus.classList.toggle("offline", !user.online);


        /* Messages */
        fillAvatar(typingAvatar, user);

        const rows = buildRows(thread);

        if (!rows.length) {

            const hello = document.createElement("div");
            hello.className = "chat-hello";

            hello.append(
                makeAvatar(user, "large-avatar"),
                Object.assign(document.createElement("strong"), { textContent: user.name }),
                Object.assign(document.createElement("span"), { textContent: user.handle }),
                Object.assign(document.createElement("p"), {
                    textContent: "This is the start of your conversation. Say hi 👋"
                })
            );

            rows.push(hello);
        }

        chatMessages.replaceChildren(...rows, typingIndicator);

        typingIndicator.style.display = thread.typing ? "flex" : "none";

        if (!options || options.scroll !== false) {
            scrollChatToBottom();
        }
    }

    function scrollChatToBottom() {

        chatMessages.scrollTop = chatMessages.scrollHeight;

        /* once more after layout / transitions settle */
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 60);
    }


    /* =========================================
       OPEN / CLOSE CONVERSATIONS
       On phones the open chat is tracked in the URL
       hash (#chat/<id>) so the phone's Back button /
       swipe returns to the list instead of leaving
       the page.
    ========================================= */

    function routeId() {

        const match = window.location.hash.match(/^#chat\/([\w-]+)$/);

        return match && store.get(match[1]) ? match[1] : null;
    }

    function setChatOpen(open) {

        layout.classList.toggle("chat-open", open);
        document.body.classList.toggle("chat-open", open);

        syncViewport();
    }

    function selectThread(id) {

        if (pendingDelete && pendingDelete.userId !== id) closeDelete();

        activeId = id;

        if (isChatVisible()) {
            store.markRead(id, { silent: true });
        }

        renderList();
        renderChat({ scroll: true });
    }

    function openConversation(id) {

        if (!isMobile()) {
            selectThread(id);
            return;
        }

        const target = "#chat/" + id;

        if (window.location.hash === target) {
            applyRoute();
            return;
        }

        pushedByApp = true;
        window.location.hash = target;      /* -> hashchange -> applyRoute */
    }

    function closeConversation() {

        if (pushedByApp) {
            pushedByApp = false;
            window.history.back();          /* -> hashchange -> applyRoute */
            return;
        }

        try {
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        } catch (error) {
            window.location.hash = "";
        }

        applyRoute();
    }

    function applyRoute() {

        const id = routeId();

        if (isMobile()) {

            if (id) {
                setChatOpen(true);
                selectThread(id);
            } else {
                pushedByApp = false;
                setChatOpen(false);
                renderList();
            }

            return;
        }

        /* Desktop / tablet: chat is always visible */

        setChatOpen(false);

        if (id && id !== activeId) {
            selectThread(id);
        } else if (!activeId || !store.get(activeId)) {
            const first = store.threads()[0];
            selectThread(first ? first.userId : null);
        }
    }

    window.addEventListener("hashchange", applyRoute);

    if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener("change", applyRoute);
    } else {
        mobileQuery.addListener(applyRoute);
    }

    mobileBack.addEventListener("click", closeConversation);


    /* =========================================
       PHONE VIEWPORT  (address bar + keyboard)
       Keeps the chat exactly as tall as the visible
       screen so the composer is never hidden.
    ========================================= */

    function syncViewport() {

        const root = document.documentElement.style;
        const vv = window.visualViewport;

        if (isMobile() && vv) {
            root.setProperty("--app-height", vv.height + "px");
            root.setProperty("--app-top", vv.offsetTop + "px");
        } else {
            root.removeProperty("--app-height");
            root.removeProperty("--app-top");
        }

        if (isMobile() && isChatOpen()) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", syncViewport);
        window.visualViewport.addEventListener("scroll", syncViewport);
    }

    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);

    syncViewport();


    /* =========================================
       SEND MESSAGE
    ========================================= */

    function sendMessage() {

        const text = messageInput.value.trim();

        if (!text || !activeId) return;

        const to = activeId;

        messageInput.value = "";

        store.send(to, text);          /* saves + notifies -> re-render */

        if (SIMULATE_REPLIES) simulateReply(to, text);
    }

    /* keep the keyboard open when tapping Send */
    sendBtn.addEventListener("mousedown", event => event.preventDefault());

    sendBtn.addEventListener("click", sendMessage);

    messageInput.addEventListener("keydown", event => {

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }

    });

    function simulateReply(id, sentText) {

        const replies = pickReplies(sentText);

        /* Saved to storage with real due times (not just a JS timer),
           so "seen" and the reply still arrive on schedule even if
           you switch pages, reload, or close the tab and come back -
           this is the fix for Sophia's messages going missing. */
        store.scheduleReply(id, replies, {
            seenDelay: 700,
            firstDelay: 1300 + Math.min(sentText.length * 25, 1200),
            gap: 1400
        });
    }


    /* =========================================
       STORE CHANGES  (this tab, or Home / other tab)
    ========================================= */

    store.subscribe(() => {

        if (activeId && isChatVisible()) {
            store.markRead(activeId, { silent: true });
        }

        if (activeId && !store.get(activeId)) activeId = null;

        renderList();

        if (holdScroll !== null) {

            /* after deleting a message stay where you were reading,
               don't jump to the bottom */
            renderChat({ scroll: false });
            chatMessages.scrollTop = holdScroll;
            holdScroll = null;

        } else {

            renderChat({ scroll: true });
        }
    });


    /* =========================================
       DELETE A MESSAGE
       Hover a message (or tap it on a phone) and press
       the trash button, then confirm.
    ========================================= */

    function clearSelected() {

        chatMessages
            .querySelectorAll(".bubble-wrap.selected")
            .forEach(item => item.classList.remove("selected"));
    }

    chatMessages.addEventListener("click", event => {

        const trash = event.target.closest(".msg-delete");

        if (trash) {
            askDelete(trash.closest(".bubble-wrap"));
            return;
        }

        /* tapping a message shows / hides its trash button
           (this is how it appears on touch screens) */
        const wrap = event.target.closest(".bubble-wrap");
        const wasSelected = wrap && wrap.classList.contains("selected");

        clearSelected();

        if (wrap && !wasSelected) wrap.classList.add("selected");
    });

    function askDelete(wrap) {

        if (!wrap || !activeId) return;

        const thread = store.get(activeId);
        const message = thread &&
            thread.messages.find(item => item.id === wrap.dataset.id);

        if (!message) return;

        pendingDelete = { userId: activeId, id: message.id };

        deletePreview.textContent = message.text;

        deleteModal.classList.add("show");

        /* focus the safe button first (no keyboard pops up on phones) */
        deleteCancel.focus();
    }

    function closeDelete() {

        pendingDelete = null;

        deleteModal.classList.remove("show");
    }

    function confirmDelete() {

        if (!pendingDelete) return;

        const { userId, id } = pendingDelete;

        closeDelete();

        holdScroll = chatMessages.scrollTop;

        store.deleteMessage(userId, id);       /* saves + re-renders */

        holdScroll = null;
    }

    deleteCancel.addEventListener("click", closeDelete);
    deleteConfirm.addEventListener("click", confirmDelete);

    deleteModal.addEventListener("click", event => {
        if (event.target === deleteModal) closeDelete();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeDelete();
    });


    /* =========================================
       SEARCH + TABS
    ========================================= */

    messageSearch.addEventListener("input", renderList);

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(item => item.classList.remove("active"));
            tab.classList.add("active");

            activeFilter = tab.dataset.filter;

            renderList();
        });

    });


    /* =========================================
       NEW MESSAGE MODAL  (people from the system)
    ========================================= */

    function renderContacts() {

        const query = recipientInput.value.toLowerCase().trim();

        const people = users.filter(user =>
            user.id !== me.id &&
            (
                !query ||
                user.name.toLowerCase().includes(query) ||
                user.handle.toLowerCase().includes(query)
            )
        );

        contactList.textContent = "";

        people.forEach(user => {

            const contact = document.createElement("div");
            contact.className = "contact";
            contact.setAttribute("role", "button");
            contact.tabIndex = 0;

            const text = document.createElement("div");

            const name = document.createElement("strong");
            name.textContent = user.name;

            const handle = document.createElement("span");
            handle.textContent = user.handle;

            text.append(name, handle);
            contact.append(makeAvatar(user), text);

            const choose = () => startConversation(user.id);

            contact.addEventListener("click", choose);

            contact.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    choose();
                }
            });

            contactList.appendChild(contact);
        });

        if (!people.length) {
            const empty = document.createElement("div");
            empty.className = "list-empty";
            empty.textContent = "No people found.";
            contactList.appendChild(empty);
        }
    }

    function startConversation(id) {

        closeNewMessage();

        /* make sure the new chat isn't hidden by a filter */
        messageSearch.value = "";
        activeFilter = "all";

        tabs.forEach(tab =>
            tab.classList.toggle("active", tab.dataset.filter === "all")
        );

        store.ensure(id);
        openConversation(id);
    }

    function openNewMessage() {

        recipientInput.value = "";
        renderContacts();

        modal.classList.add("show");

        /* avoid popping the keyboard open on phones */
        if (!isMobile()) recipientInput.focus();
    }

    function closeNewMessage() {
        modal.classList.remove("show");
    }

    newMessageBtn.addEventListener("click", openNewMessage);
    closeModal.addEventListener("click", closeNewMessage);
    recipientInput.addEventListener("input", renderContacts);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeNewMessage();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeNewMessage();
    });


    /* =========================================
       NAVIGATION  (links into the rest of LINKA)
    ========================================= */

    document.querySelectorAll("[data-href]").forEach(element => {

        element.addEventListener("click", () => {
            window.location.href = element.dataset.href;
        });

    });


    /* =========================================
       GLOBAL SEARCH
    ========================================= */

    const globalSearch = document.getElementById("globalSearch");

    globalSearch.addEventListener("keydown", event => {

        if (event.key === "Enter" && globalSearch.value.trim()) {

            messageSearch.value = globalSearch.value;
            globalSearch.value = "";

            renderList();
        }

    });


    /* =========================================
       NOTIFICATION + INFO BUTTONS
    ========================================= */

    document.getElementById("notificationBtn").addEventListener("click", () => {

        const unread = store.totalUnread();

        alert(
            unread
                ? `You have ${unread} unread message${unread === 1 ? "" : "s"}.`
                : "You're all caught up."
        );

    });

    document.getElementById("infoBtn").addEventListener("click", () => {

        if (window.innerWidth <= 900) {
            alert("Conversation information is available on larger screens.");
        }

    });


    /* =========================================
       START
    ========================================= */

    renderList();
    applyRoute();

});
