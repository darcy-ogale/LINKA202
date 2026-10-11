/* =========================================
   LINKA
   HOME PAGE JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================
       MESSAGES (shared with messages.html)
    ====================================== */

    if (window.LINKA) {
        LINKA.bindUnreadBadge(".nav-badge");
    }

    document
        .querySelectorAll("[data-href]")
        .forEach(element => {

            element.addEventListener("click", () => {
                window.location.href = element.dataset.href;
            });

        });


    /* =====================================
       CREATE POST MODAL
    ====================================== */

    const modal = document.getElementById("postModal");

    const openPost = document.getElementById("openPost");

    const closeModal = document.getElementById("closeModal");

    const publishPost = document.getElementById("publishPost");

    const postText = document.getElementById("postText");


    function openModal() {

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");

        setTimeout(() => {

            postText.focus();

        }, 250);

    }


    function closePostModal() {

        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");

    }


    openPost.addEventListener("click", openModal);

    closeModal.addEventListener("click", closePostModal);


    modal.addEventListener("click", (event) => {

        if (event.target === modal) {

            closePostModal();

        }

    });


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closePostModal();

        }

    });



    /* =====================================
       PUBLISH POST
    ====================================== */

    publishPost.addEventListener("click", () => {

        const text = postText.value.trim();


        if (!text) {

            postText.focus();

            return;

        }


        const feed = document.querySelector(".feed");

        const createPostCard = document.querySelector(".create-post");


        const newPost = document.createElement("article");

        newPost.className = "post card";


        newPost.innerHTML = `

            <div class="post-header">

                <div class="post-user">

                    <div class="avatar">

                        <img src="Profile/darcy.jpg" alt="Darcy">

                    </div>

                    <div>

                        <strong>Darcy Og</strong>

                        <div class="post-meta">
                            @darcyog · Just now · 🌎
                        </div>

                    </div>

                </div>

                <button class="more-button">
                    •••
                </button>

            </div>


            <div class="post-content">

                <p>${escapeHTML(text)}</p>

            </div>


            <div class="post-stats">

                <span>

                    <span class="reaction-icons">
                        ♥
                    </span>

                    <span class="like-count">
                        0
                    </span>

                </span>

                <span>
                    0 comments · 0 shares
                </span>

            </div>


            <div class="post-actions">

                <button class="like-btn">

                    <span>♡</span>

                    Like

                </button>


                <button>

                    <span>○</span>

                    Comment

                </button>


                <button>

                    <span>↗</span>

                    Share

                </button>

            </div>


            <div class="comment-area">

                <div class="avatar mini-avatar">

                    <img src="Profile/darcy.jpg" alt="Darcy">

                </div>

                <input
                    type="text"
                    placeholder="Write a comment..."
                >

            </div>

        `;


        feed.insertBefore(
            newPost,
            createPostCard.nextElementSibling
        );


        postText.value = "";

        closePostModal();


        attachLikeButton(
            newPost.querySelector(".like-btn")
        );

    });



    /* =====================================
       ESCAPE HTML
    ====================================== */

    function escapeHTML(value) {

        const div = document.createElement("div");

        div.textContent = value;

        return div.innerHTML;

    }



    /* =====================================
       LIKE BUTTONS
    ====================================== */

    const LIKE_KEY = "linka_liked_posts";

    function getLikedPosts() {
        try {
            return JSON.parse(localStorage.getItem(LIKE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveLikedPost(id) {
        try {
            const list = getLikedPosts();
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

    function attachLikeButton(button, restore) {

        const post = button.closest(".post");

        if (!post.dataset.likeId) {
            post.dataset.likeId =
                "post-" + document.querySelectorAll(".post").length +
                "-" + Date.now();
        }

        // already liked before (page reload) -> show blue, count already includes it
        if (restore && getLikedPosts().includes(post.dataset.likeId)) {
            setLikedLook(button);
            const c = post.querySelector(".like-count");
            if (c) c.textContent = (parseInt(c.textContent) || 0) + 1;
            return;
        }

        button.addEventListener("click", () => {

            // only ONE like per post: ignore every extra click
            if (button.classList.contains("liked")) return;

            const countElement = post.querySelector(".like-count");

            let count = parseInt(countElement.textContent) || 0;

            countElement.textContent = count + 1;

            setLikedLook(button);

            saveLikedPost(post.dataset.likeId);

            createHeartAnimation(button);

        });

    }


    document
        .querySelectorAll(".post")
        .forEach((post, i) => {
            post.dataset.likeId = "static-" + i;
        });

    document
        .querySelectorAll(".like-btn")
        .forEach(btn => attachLikeButton(btn, true));



    /* =====================================
       HEART ANIMATION
    ====================================== */

    function createHeartAnimation(button) {

        const heart = document.createElement("span");

        heart.textContent = "♥";

        heart.style.position = "absolute";

        heart.style.color = "#1264e8";

        heart.style.fontSize = "18px";

        heart.style.pointerEvents = "none";

        heart.style.animation =
            "floatHeart .7s ease forwards";


        button.style.position = "relative";

        button.appendChild(heart);


        setTimeout(() => {

            heart.remove();

        }, 700);

    }



    /* =====================================
       NAVIGATION
    ====================================== */

    const navItems =
        document.querySelectorAll(
            ".nav-item, .mobile-nav-item"
        );


    navItems.forEach(item => {

        item.addEventListener("click", (event) => {

            /* Items with a real link (e.g. Messages) just navigate */
            const href = item.getAttribute("href");

            if (href && href !== "#") {
                return;
            }

            event.preventDefault();


            const group =
                item.closest(".sidebar-left")
                    ? ".sidebar-left .nav-item"
                    : ".mobile-nav-item";


            document
                .querySelectorAll(group)
                .forEach(nav => {

                    nav.classList.remove("active");

                });


            item.classList.add("active");

        });

    });



    /* =====================================
       CONNECT BUTTON
    ====================================== */

    document
        .querySelectorAll(".connect-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                if (
                    button.dataset.connected === "true"
                ) {

                    button.textContent = "+";

                    button.dataset.connected =
                        "false";

                } else {

                    button.textContent = "✓";

                    button.dataset.connected =
                        "true";

                }

            });

        });



    /* =====================================
       SEARCH
    ====================================== */

    const searchInput =
        document.getElementById("searchInput");


    searchInput.addEventListener("input", () => {

        const query =
            searchInput.value.toLowerCase().trim();


        const posts =
            document.querySelectorAll(".post");


        posts.forEach(post => {

            const content =
                post.textContent.toLowerCase();


            if (!query || content.includes(query)) {

                post.style.display = "";

            } else {

                post.style.display = "none";

            }

        });

    });



    /* =====================================
       NOTIFICATION BUTTON
    ====================================== */

    const notificationButton =
        document.getElementById("notificationBtn");


    notificationButton.addEventListener("click", () => {

        const dot =
            notificationButton.querySelector(
                ".notification-dot"
            );


        if (dot) {

            dot.style.display = "none";

        }

    });



    /* =====================================
       MOBILE CREATE BUTTON
    ====================================== */

    const mobileCreate =
        document.querySelector(".mobile-create");


    mobileCreate.addEventListener("click", openModal);


    if (window.location.hash === "#create") {
        openModal();
    }



    /* =====================================
       STORY CLICK
    ====================================== */

    document
        .querySelectorAll(".story:not(.create-story)")
        .forEach(story => {

            story.addEventListener("click", () => {

                story.style.transform = "scale(.96)";


                setTimeout(() => {

                    story.style.transform = "";

                }, 150);

            });

        });



    /* =====================================
       COMMENT ENTER
    ====================================== */

    document
        .querySelectorAll(".comment-area input")
        .forEach(input => {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" &&
                        input.value.trim()
                    ) {

                        const comment =
                            input.value.trim();


                        input.value = "";


                        const commentCount =
                            input
                                .closest(".post")
                                .querySelector(
                                    ".post-stats span:last-child"
                                );


                        if (commentCount) {

                            const current =
                                commentCount.textContent;


                            const match =
                                current.match(
                                    /(\d+)\s+comments/
                                );


                            if (match) {

                                const number =
                                    parseInt(match[1]) + 1;


                                commentCount.textContent =
                                    current.replace(
                                        /(\d+)\s+comments/,
                                        `${number} comments`
                                    );

                            }

                        }

                    }

                }
            );

        });

});


/* =========================================
   LIKE FLOAT ANIMATION
========================================= */

const style = document.createElement("style");

style.textContent = `

@keyframes floatHeart {

    0% {
        opacity: 1;
        transform: translateY(0) scale(.7);
    }

    100% {
        opacity: 0;
        transform: translateY(-28px) scale(1.2);
    }

}

`;

document.head.appendChild(style);