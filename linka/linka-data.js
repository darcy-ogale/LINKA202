/* =========================================
   LINKA SHARED DATA
   Used by home.html and messages.html

   - USERS: the people in the system (same
     profile pictures used on the Home page)
   - Session: who is logged in (set by login)
   - Message store: conversations saved in the
     browser (localStorage) so Home and Messages
     always agree (unread badge, last message...)

   To connect a real backend later, replace the
   functions inside LINKA.messages (threads, get,
   send, receive, markRead...) with API calls.
   The rest of the UI does not need to change.
========================================= */

(function (global) {

    "use strict";

    var STORAGE_KEY = "linka.messages.v1";
    var DEFAULT_USER_ID = "darcy";


    /* =========================================
       USERS  (profile pictures live in /Profile)
    ========================================= */

    var USERS = [
        { id: "darcy",   name: "Darcy Og",        handle: "@darcyog",         photo: "Profile/darcy.jpg",   color: "blue",   email: "darz9547@gmail.com" },
        { id: "sofia",   name: "Sophia Martinez", handle: "@sophiamartinez",  photo: "Profile/sofia.jpg",   color: "pink",   online: true },
        { id: "jessica", name: "Jessica Santos",  handle: "@jessicas",        photo: "Profile/jessica.jpg", color: "purple" },
        { id: "mark",    name: "Mark Kim",        handle: "@markkim",         photo: "Profile/mark.jpg",    color: "green" },
        { id: "alex",    name: "Alex",            handle: "@alex",            photo: "Profile/alex.jpg",    color: "orange" },
        { id: "ryan",    name: "Ryan",            handle: "@ryan",            photo: "Profile/ryan.jpg",    color: "blue" },
        { id: "john",    name: "John Manlapat",   handle: "@johnmanlapat",    photo: "Profile/john.jpg",    color: "green" },
        { id: "jake",    name: "Jake David",      handle: "@jakedavid",       photo: "Profile/jake.jpg",    color: "orange" },
        { id: "analiza", name: "Analiza Doculan", handle: "@analizadoculan",  photo: "Profile/analiza.jpg", color: "purple" }
    ];

    function getUser(id) {
        for (var i = 0; i < USERS.length; i++) {
            if (USERS[i].id === id) return USERS[i];
        }
        return null;
    }


    /* =========================================
       SESSION  (written by script.js on login)
    ========================================= */

    function readSession() {

        var stores = [];

        try { stores.push(global.sessionStorage); } catch (e) { }
        try { stores.push(global.localStorage); } catch (e) { }

        for (var i = 0; i < stores.length; i++) {

            try {
                var raw = stores[i] && stores[i].getItem("linkaUser");
                if (raw) return JSON.parse(raw);
            } catch (e) { }

        }

        return null;
    }

    function currentUser() {

        var session = readSession();

        if (session && session.email) {

            for (var i = 0; i < USERS.length; i++) {

                if (
                    USERS[i].email &&
                    USERS[i].email.toLowerCase() === String(session.email).toLowerCase()
                ) {
                    return USERS[i];
                }

            }

        }

        return getUser(DEFAULT_USER_ID);
    }

    var ME = currentUser();


    /* =========================================
       TIME HELPERS
    ========================================= */

    function startOfDay(ts) {
        var d = new Date(ts);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    function formatClock(ts) {
        return new Date(ts).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function dayDiff(ts) {
        return Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000);
    }

    /* Conversation list: 10:42 AM / Yesterday / Monday / Sep 3 */
    function formatListTime(ts) {

        var diff = dayDiff(ts);

        if (diff <= 0) return formatClock(ts);
        if (diff === 1) return "Yesterday";

        if (diff < 7) {
            return new Date(ts).toLocaleDateString([], { weekday: "long" });
        }

        return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
    }

    /* Divider inside a chat: Today / Yesterday / Monday, Sep 3 */
    function formatDayLabel(ts) {

        var diff = dayDiff(ts);

        if (diff <= 0) return "Today";
        if (diff === 1) return "Yesterday";

        return new Date(ts).toLocaleDateString([], {
            weekday: "long",
            month: "short",
            day: "numeric"
        });
    }


    /* =========================================
       MESSAGE STORE
       Shape:
       { v: 1, threads: { <userId>: {
            messages: [ { id, from, text, ts } ],
            unread: <number>,
            updated: <timestamp>
       } } }
    ========================================= */

    var memoryData = null;      /* used if localStorage is blocked */
    var listeners = [];

    function makeId() {
        return "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function seedData() {

        /* Starting conversation: Sophia Martinez only. */

        var base = new Date();
        base.setHours(10, 38, 0, 0);

        if (base.getTime() + 4 * 60000 > Date.now()) {
            base.setDate(base.getDate() - 1);
        }

        var t = base.getTime();
        var min = 60000;

        return {
            v: 1,
            threads: {
                sofia: {
                    unread: 1,
                    seen: t + 3 * min,      /* she has read Darcy's replies */
                    updated: t + 4 * min,
                    messages: [
                        { id: makeId(), from: "sofia", text: "Hey Darcy! 👋",                      ts: t },
                        { id: makeId(), from: "sofia", text: "Did you see the new LINKA design?",   ts: t },
                        { id: makeId(), from: "darcy", text: "Yeah! I just checked it out.",        ts: t + 2 * min },
                        { id: makeId(), from: "darcy", text: "It looks really clean 🔥",            ts: t + 2 * min },
                        { id: makeId(), from: "sofia", text: "That new design looks amazing!",      ts: t + 4 * min }
                    ]
                }
            }
        };
    }

    function isValid(data) {
        return data && data.v === 1 && data.threads && typeof data.threads === "object";
    }

    function readRaw() {

        var data = null;

        try {
            var raw = global.localStorage.getItem(STORAGE_KEY);
            if (raw) data = JSON.parse(raw);
        } catch (e) {
            data = memoryData;
        }

        if (!isValid(data)) {
            data = seedData();
            save(data, true);
        }

        return data;
    }

    function load() {

        var data = readRaw();

        /* Deliver any "seen" / reply that became due while this
           page (or the whole browser) was closed, so nothing is
           ever lost by navigating away or reloading. */
        deliverPending(data);

        return data;
    }

    function save(data, silent) {

        memoryData = data;

        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { /* storage blocked, memory copy is used */ }

        if (!silent) notify();
    }

    function notify() {
        for (var i = 0; i < listeners.length; i++) {
            try { listeners[i](); } catch (e) { }
        }
    }

    /* Changes made in another tab / page */
    global.addEventListener("storage", function (event) {
        if (event.key === STORAGE_KEY) notify();
    });


    /* =========================================
       PENDING REPLIES
       A simulated reply is not just a JS timer:
       it is written to storage with the real
       clock time it is due. That way it still
       arrives on schedule even if the person
       switches pages, reloads, or closes the
       tab and comes back later. (This is what
       was making Sophia's replies disappear.)
    ========================================= */

    function deliverPending(data) {

        var now = Date.now();
        var changed = false;

        Object.keys(data.threads).forEach(function (userId) {

            var thread = data.threads[userId];
            var pending = thread.pending;

            if (!pending) return;

            /* she "read" the message */
            if (!pending.seenDone && now >= pending.seenAt) {
                thread.seen = Math.max(thread.seen || 0, pending.seenSource || 0);
                pending.seenDone = true;
                changed = true;
            }

            /* she "replies" (possibly more than one message due,
               if this ran a long time after the tab was closed) */
            while (pending.seenDone && pending.queue.length && now >= pending.dueAt) {

                var text = pending.queue.shift();

                var message = {
                    id: makeId(),
                    from: userId,
                    text: text,
                    ts: Date.now()
                };

                thread.messages.push(message);
                thread.unread = (thread.unread || 0) + 1;
                thread.updated = message.ts;

                pending.dueAt = Date.now() + pending.gap;

                changed = true;
            }

            if (pending.seenDone && !pending.queue.length) {
                delete thread.pending;
            }
        });

        if (changed) save(data, true);

        return changed;
    }

    /* Check every so often even if nothing else touches storage,
       so "seen" and replies still show up while the chat is open
       and idle, not only after the next click. */
    global.setInterval(function () {
        if (deliverPending(readRaw())) notify();
    }, 800);

    /* Catch up right away when coming back to the tab */
    if (global.document) {
        global.document.addEventListener("visibilitychange", function () {
            if (!global.document.hidden && deliverPending(readRaw())) notify();
        });
    }


    function lastMessage(thread) {
        var list = thread.messages;
        return list.length ? list[list.length - 1] : null;
    }

    function decorate(userId, thread) {

        var last = lastMessage(thread);

        return {
            userId: userId,
            user: getUser(userId),
            messages: thread.messages,
            unread: thread.unread || 0,
            seen: thread.seen || 0,      /* they have read everything up to this time */
            typing: !!(thread.pending && thread.pending.seenDone && thread.pending.queue.length),
            last: last,
            updated: last ? last.ts : (thread.updated || 0)
        };
    }

    var messages = {

        /* All conversations, newest first */
        threads: function () {

            var data = load();
            var out = [];

            Object.keys(data.threads).forEach(function (userId) {
                if (getUser(userId) && userId !== ME.id) {
                    out.push(decorate(userId, data.threads[userId]));
                }
            });

            out.sort(function (a, b) { return b.updated - a.updated; });

            return out;
        },

        get: function (userId) {

            var data = load();
            var thread = data.threads[userId];

            return thread ? decorate(userId, thread) : null;
        },

        /* Start a conversation with someone (no-op if it exists) */
        ensure: function (userId) {

            if (!getUser(userId) || userId === ME.id) return null;

            var data = load();

            if (!data.threads[userId]) {
                data.threads[userId] = { messages: [], unread: 0, updated: Date.now() };
                save(data);
            }

            return decorate(userId, data.threads[userId]);
        },

        /* Message written by the logged-in user */
        send: function (userId, text) {

            text = String(text || "").trim();
            if (!text || !getUser(userId)) return null;

            var data = load();
            var thread = data.threads[userId] ||
                (data.threads[userId] = { messages: [], unread: 0, updated: Date.now() });

            var message = { id: makeId(), from: ME.id, text: text, ts: Date.now() };

            thread.messages.push(message);
            thread.updated = message.ts;

            save(data);

            return message;
        },

        /* Schedule a simulated "seen" and one or more replies.
           Written to storage with real due times, so they still
           arrive on time even after navigating away or reloading
           (see deliverPending above). Replaces anything still
           pending from an earlier message. */
        scheduleReply: function (userId, replyTexts, options) {

            if (!getUser(userId) || !replyTexts || !replyTexts.length) return;

            options = options || {};

            var seenDelay = options.seenDelay || 700;
            var firstDelay = options.firstDelay || 1300;
            var gap = options.gap || 1400;

            var data = load();
            var thread = data.threads[userId];

            if (!thread) return;

            var last = lastMessage(thread);

            thread.pending = {
                seenAt: Date.now() + seenDelay,
                seenSource: last ? last.ts : Date.now(),
                seenDone: false,
                dueAt: Date.now() + seenDelay + firstDelay,
                queue: replyTexts.slice(),
                gap: gap
            };

            save(data);
        },

        /* Message coming from someone else */
        receive: function (userId, text) {

            text = String(text || "").trim();
            if (!text || !getUser(userId)) return null;

            var data = load();
            var thread = data.threads[userId] ||
                (data.threads[userId] = { messages: [], unread: 0, updated: Date.now() });

            var message = { id: makeId(), from: userId, text: text, ts: Date.now() };

            thread.messages.push(message);
            thread.unread = (thread.unread || 0) + 1;
            thread.updated = message.ts;

            /* Answering means they read everything I sent before,
               so "Seen" never gets lost if the read receipt was missed. */
            thread.seen = Math.max(thread.seen || 0, message.ts);

            save(data);

            return message;
        },

        /* Delete one message from a conversation. The chat, the
           conversation preview and the Home unread badge all update. */
        deleteMessage: function (userId, messageId) {

            var data = load();
            var thread = data.threads[userId];

            if (!thread) return false;

            var index = -1;

            for (var i = 0; i < thread.messages.length; i++) {
                if (thread.messages[i].id === messageId) {
                    index = i;
                    break;
                }
            }

            if (index === -1) return false;

            var removed = thread.messages.splice(index, 1)[0];

            /* The unread ones are the newest messages from the other
               person. If the deleted one was among them, count one less. */
            if (removed.from !== ME.id && thread.unread) {

                var newerFromThem = 0;

                for (var j = index; j < thread.messages.length; j++) {
                    if (thread.messages[j].from !== ME.id) newerFromThem++;
                }

                if (newerFromThem < thread.unread) thread.unread--;
            }

            var last = lastMessage(thread);

            if (last) thread.updated = last.ts;

            save(data);

            return true;
        },

        /* The other person has now read the messages I sent */
        markSeen: function (userId) {

            var data = load();
            var thread = data.threads[userId];

            if (!thread) return;

            thread.seen = Date.now();

            save(data);
        },

        markRead: function (userId, options) {

            var data = load();
            var thread = data.threads[userId];

            if (!thread || !thread.unread) return;

            thread.unread = 0;

            save(data, options && options.silent);
        },

        totalUnread: function () {

            var data = load();
            var total = 0;

            Object.keys(data.threads).forEach(function (userId) {
                if (getUser(userId) && userId !== ME.id) {
                    total += data.threads[userId].unread || 0;
                }
            });

            return total;
        },

        /* Number of conversations with something unread
           (like Messenger: 1 chat = 1, however many messages) */
        unreadChats: function () {

            var data = load();
            var total = 0;

            Object.keys(data.threads).forEach(function (userId) {
                if (
                    getUser(userId) &&
                    userId !== ME.id &&
                    (data.threads[userId].unread || 0) > 0
                ) {
                    total++;
                }
            });

            return total;
        },

        /* Called whenever messages change (this tab or another) */
        subscribe: function (callback) {
            listeners.push(callback);
        }
    };


    /* =========================================
       UNREAD BADGE  (used by the Home page)
    ========================================= */

    function bindUnreadBadge(selector) {

        function update() {

            var total = messages.unreadChats();

            document.querySelectorAll(selector).forEach(function (badge) {
                badge.textContent = total > 99 ? "99+" : String(total);
                badge.style.display = total ? "" : "none";
            });
        }

        update();
        messages.subscribe(update);
    }


    global.LINKA = {
        users: USERS,
        me: ME,
        getUser: getUser,
        session: readSession,
        messages: messages,
        format: {
            clock: formatClock,
            listTime: formatListTime,
            dayLabel: formatDayLabel
        },
        bindUnreadBadge: bindUnreadBadge
    };

})(window);
