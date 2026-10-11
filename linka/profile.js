/* =========================================================
   LINKA PROFILE JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       REAL PROFILE PICTURE  (shared with Home / Messages)
    ====================================================== */

    if (window.LINKA) {

        const me = LINKA.me;

        function fillAvatar(element) {

            if (!element) return;

            element.textContent = "";

            const img = document.createElement("img");

            img.src = me.photo;
            img.alt = me.name;
            img.draggable = false;

            /* if the picture is missing, fall back to a letter */
            img.addEventListener("error", () => {
                img.remove();
                element.textContent = me.name.charAt(0);
            });

            element.appendChild(img);
        }

        fillAvatar(document.getElementById("meAvatarSmall"));
        fillAvatar(document.getElementById("heroAvatar"));
        fillAvatar(document.getElementById("createAvatar"));

        document
            .querySelectorAll(".post-author-avatar")
            .forEach(fillAvatar);

        /* Friends list: real people from the system, with photos */
        document.querySelectorAll(".friend-avatar[data-user]").forEach(element => {

            const user = LINKA.getUser(element.dataset.user);

            if (!user) return;

            element.textContent = "";

            const img = document.createElement("img");

            img.src = user.photo;
            img.alt = user.name;
            img.draggable = false;

            img.addEventListener("error", () => {
                img.remove();
                element.textContent = user.name.charAt(0);
            });

            element.appendChild(img);
        });

        const nameSmall = document.getElementById("meNameSmall");
        if (nameSmall) nameSmall.textContent = me.name.split(" ")[0];
    }


    /* =====================================================
       NAVIGATION  (links into the rest of LINKA)
    ====================================== */

    document.querySelectorAll("[data-href]").forEach(element => {

        element.addEventListener("click", () => {
            window.location.href = element.dataset.href;
        });

    });


    const editProfileBtn =
        document.getElementById("editProfileBtn");

    const editModal =
        document.getElementById("editModal");

    const closeModal =
        document.getElementById("closeModal");

    const saveProfileBtn =
        document.getElementById("saveProfileBtn");

    const nameInput =
        document.getElementById("nameInput");

    const usernameInput =
        document.getElementById("usernameInput");

    const bioInput =
        document.getElementById("bioInput");

    const profileName =
        document.querySelector(
            ".profile-name-row h1"
        );

    const username =
        document.querySelector(
            ".username"
        );

    const bio =
        document.querySelector(
            ".bio"
        );

    const tabs =
        document.querySelectorAll(
            ".profile-tab"
        );

    const likeButtons =
        document.querySelectorAll(
            ".like-btn"
        );

    const createPostBtn =
        document.getElementById(
            "createPostBtn"
        );

    const notificationBtn =
        document.getElementById(
            "notificationBtn"
        );

    const globalSearch =
        document.getElementById(
            "globalSearch"
        );


    /* =====================================================
       EDIT PROFILE
    ====================================================== */

    editProfileBtn.addEventListener(
        "click",
        () => {

            editModal.classList.add("show");

            nameInput.focus();

        }
    );


    closeModal.addEventListener(
        "click",
        () => {

            editModal.classList.remove("show");

        }
    );


    editModal.addEventListener(
        "click",
        event => {

            if (
                event.target === editModal
            ) {

                editModal.classList.remove("show");

            }

        }
    );


    /* =====================================================
       SAVE PROFILE
    ====================================================== */

    saveProfileBtn.addEventListener(
        "click",
        () => {

            const newName =
                nameInput.value.trim();

            const newUsername =
                usernameInput.value.trim();

            const newBio =
                bioInput.value.trim();


            if (newName) {

                profileName.innerHTML =
                    `${escapeHTML(newName)}
                    <span class="verified">✓</span>`;

            }


            if (newUsername) {

                username.textContent =
                    newUsername.startsWith("@")
                        ? newUsername
                        : `@${newUsername}`;

            }


            if (newBio) {

                bio.textContent =
                    newBio;

            }


            editModal.classList.remove(
                "show"
            );

        }
    );


    /* =====================================================
       PROFILE TABS
    ====================================================== */

    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                tabs.forEach(item => {
                    item.classList.remove(
                        "active"
                    );
                });

                tab.classList.add(
                    "active"
                );

                const selectedTab =
                    tab.dataset.tab;

                console.log(
                    `Selected profile tab: ${selectedTab}`
                );

            }
        );

    });


    /* =====================================================
       LIKE BUTTONS
    ====================================================== */

    const LIKE_KEY = "linka_liked_profile_posts";

    function getLiked() {
        try { return JSON.parse(localStorage.getItem(LIKE_KEY)) || []; }
        catch (e) { return []; }
    }

    function saveLiked(id) {
        try {
            const list = getLiked();
            if (!list.includes(id)) {
                list.push(id);
                localStorage.setItem(LIKE_KEY, JSON.stringify(list));
            }
        } catch (e) {}
    }

    function setLikedLook(button) {
        button.classList.add("liked");
        button.innerHTML = "<span>♥</span> Liked";
    }

    function floatHeart(button) {
        const heart = document.createElement("span");
        heart.textContent = "♥";
        heart.style.position = "absolute";
        heart.style.color = "#1264e8";
        heart.style.fontSize = "18px";
        heart.style.pointerEvents = "none";
        heart.style.animation = "floatHeart .7s ease forwards";
        button.style.position = "relative";
        button.appendChild(heart);
        setTimeout(() => heart.remove(), 700);
    }

    if (!document.getElementById("floatHeartStyle")) {
        const st = document.createElement("style");
        st.id = "floatHeartStyle";
        st.textContent =
            "@keyframes floatHeart{0%{opacity:1;transform:translateY(0) scale(.7)}" +
            "100%{opacity:0;transform:translateY(-28px) scale(1.2)}}";
        document.head.appendChild(st);
    }

    likeButtons.forEach((button, i) => {

        const post = button.closest(".post-card");
        const countEl = post ? post.querySelector(".like-count") : null;
        const id = "profile-post-" + i;

        // liked before (page reload): show blue and add my like back to the count
        if (getLiked().includes(id)) {
            setLikedLook(button);
            if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
        }

        button.addEventListener("click", () => {

            // only ONE like per post
            if (button.classList.contains("liked")) return;

            if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;

            setLikedLook(button);
            saveLiked(id);
            floatHeart(button);

        });

    });


    /* =====================================================
       CREATE POST
    ====================================================== */

    createPostBtn.addEventListener(
        "click",
        () => {

            alert(
                "Post composer coming next."
            );

        }
    );


    /* =====================================================
       NOTIFICATIONS
    ====================================================== */

    notificationBtn.addEventListener(
        "click",
        () => {

            alert(
                "You have 3 new notifications."
            );

        }
    );


    /* =====================================================
       SEARCH
    ====================================================== */

    globalSearch.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                globalSearch.value.trim()
            ) {

                alert(
                    `Searching LINKA for "${globalSearch.value.trim()}"`
                );

            }

        }
    );


    /* =====================================================
       COVER PHOTO
    ====================================================== */

    document
        .getElementById("editCoverBtn")
        .addEventListener(
            "click",
            () => {

                alert(
                    "Cover photo editor coming next."
                );

            }
        );


    /* =====================================================
       PROFILE PHOTO
    ====================================================== */

    document
        .getElementById("avatarEditBtn")
        .addEventListener(
            "click",
            () => {

                alert(
                    "Profile photo editor coming next."
                );

            }
        );


    /* =====================================================
       MORE BUTTON
    ====================================================== */

    document
        .getElementById("moreBtn")
        .addEventListener(
            "click",
            () => {

                alert(
                    "More profile options coming next."
                );

            }
        );


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

    function escapeHTML(value) {

        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});