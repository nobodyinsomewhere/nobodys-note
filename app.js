(() => {
  const STORAGE_KEY = "nobodys_note_theme";

  const QUOTES = [
    "写下来，不为解释，只为不忘。",
    "有些字不必说给谁听，留在纸面上就已经足够。",
    "深夜适合写字，不适合辩解。",
    "被记下来的东西，总比被说出口的更安静。",
    "有些情绪适合沉下去，再变成文字。",
    "字不会替人辩解，但会替人留下痕迹。",
    "不是写作比说话更高贵，只是有些东西更适合被轻轻放下。",
    "风吹不走的，才写下来。"
  ];

  let PLAYLIST = [];

  function $(id) {
    return document.getElementById(id);
  }

  function applyTheme(theme) {
    const finalTheme = theme || "mist-cyan";
    document.documentElement.setAttribute("data-theme", finalTheme);

    try {
      localStorage.setItem(STORAGE_KEY, finalTheme);
    } catch {}

    const select = $("themeSelect");
    if (select) {
      select.value = finalTheme;
    }
  }

  function initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem(STORAGE_KEY);
    } catch {}

    if (!savedTheme) {
      const hour = new Date().getHours();
      savedTheme = (hour >= 22 || hour < 6) ? "ink-night" : "mist-cyan";
    }

    applyTheme(savedTheme);

    const select = $("themeSelect");
    if (select) {
      select.addEventListener("change", () => {
        applyTheme(select.value);
      });
    }
  }

  async function loadPlaylist() {
    try {
      const res = await fetch("./playlist.json", { cache: "no-store" });
      if (!res.ok) throw new Error("playlist.json 加载失败");
      PLAYLIST = await res.json();
    } catch (err) {
      console.error(err);
      PLAYLIST = [];
    }
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function getCurrentFile() {
    const raw = window.location.pathname.split("/").pop();
    return raw || "index.html";
  }

  function renderQuote() {
    const box = $("heroQuote");
    if (!box) return;

    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    box.textContent = quote;

    const refreshBtn = $("refreshQuoteBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        box.textContent = newQuote;
      });
    }
  }

  function renderLatest(posts) {
    const box = $("latestPreview");
    if (!box || !Array.isArray(posts) || !posts.length) return;

    const latest = posts[0];
    box.innerHTML = `
      <div class="latest-kicker">最近更新</div>
      <h2 class="latest-title">
        <a href="./${escapeHtml(latest.file)}">${escapeHtml(latest.title)}</a>
      </h2>
      <p class="latest-date">${escapeHtml(latest.date || "")}</p>
      <p class="latest-excerpt">${escapeHtml(latest.excerpt || "")}</p>
      <a class="latest-link" href="./${escapeHtml(latest.file)}">读这一篇</a>
    `;
  }

  function renderMetaStrip(posts) {
    const box = $("metaStrip");
    if (!box || !Array.isArray(posts)) return;

    const count = posts.length;
    const latestDate = posts[0]?.date || "--";

    box.innerHTML = `
      <span class="meta-pill">收录：${count} 篇</span>
      <span class="meta-pill">最近更新：${escapeHtml(latestDate)}</span>
    `;
  }

  function renderPosts(posts) {
    const list = $("postList");
    if (!list) return;

    if (!Array.isArray(posts) || !posts.length) {
      list.innerHTML = `
        <article class="post-card">
          <div class="post-card-head">
            <span class="post-order">00</span>
            <span class="post-meta">暂无文章</span>
          </div>
          <div class="post-divider"></div>
          <h2 class="post-title">这里还没有任何记录</h2>
          <p class="post-excerpt">你可以先通过 editor.html 生成一篇文章，再上传到仓库中。</p>
        </article>
      `;
      return;
    }

    list.innerHTML = posts.map((post, index) => `
      <article class="post-card">
        <div class="post-card-head">
          <span class="post-order">${String(index + 1).padStart(2, "0")}</span>
          <span class="post-meta">${escapeHtml(post.date || "")}</span>
        </div>
        <div class="post-divider"></div>
        <h2 class="post-title">
          <a href="./${escapeHtml(post.file || "#")}">${escapeHtml(post.title || "未命名文章")}</a>
        </h2>
        <p class="post-excerpt">${escapeHtml(post.excerpt || "")}</p>
        <a class="read-link" href="./${escapeHtml(post.file || "#")}">读下去</a>
      </article>
    `).join("");
  }

  function bindHomeActions(posts) {
    const latestBtn = $("latestJumpBtn");
    const randomBtn = $("randomJumpBtn");

    if (latestBtn) {
      latestBtn.addEventListener("click", () => {
        if (!posts?.length) return;
        window.location.href = `./${posts[0].file}`;
      });
    }

    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        if (!posts?.length) return;
        const item = posts[Math.floor(Math.random() * posts.length)];
        window.location.href = `./${item.file}`;
      });
    }
  }

  function initMusic() {
    const audio = $("bgPlayer");
    const trackName = $("trackName");
    const trackIndex = $("trackIndex");
    const playerStatus = $("playerStatus");
    const prevBtn = $("prevTrackBtn");
    const toggleBtn = $("togglePlayBtn");
    const nextBtn = $("nextTrackBtn");
    const disc = $("disc");
    const coverImage = $("coverImage");

    if (!audio || !trackName || !trackIndex || !playerStatus || !prevBtn || !toggleBtn || !nextBtn || !disc || !coverImage) {
      return;
    }

    let currentIndex = 0;

    function renderTrackInfo() {
      if (!PLAYLIST.length) {
        trackName.textContent = "暂无音乐";
        trackIndex.textContent = "playlist 0 / 0";
        disc.classList.remove("has-cover");
        coverImage.removeAttribute("src");
        return;
      }

      const current = PLAYLIST[currentIndex];
      trackName.textContent = current?.title || "未命名音轨";
      trackIndex.textContent = `playlist ${currentIndex + 1} / ${PLAYLIST.length}`;

      if (current?.cover) {
        coverImage.src = current.cover;
        disc.classList.add("has-cover");
      } else {
        coverImage.removeAttribute("src");
        disc.classList.remove("has-cover");
      }
    }

    function loadTrack(index) {
      if (!PLAYLIST.length) return;
      currentIndex = (index + PLAYLIST.length) % PLAYLIST.length;
      audio.src = PLAYLIST[currentIndex].file;
      renderTrackInfo();
      playerStatus.textContent = "当前未播放。";
      toggleBtn.textContent = "播放";
      disc.classList.remove("spinning");
    }

    async function togglePlay() {
      if (!PLAYLIST.length) return;

      if (!audio.src) {
        loadTrack(currentIndex);
      }

      if (audio.paused) {
        try {
          await audio.play();
        } catch (err) {
          console.error(err);
          playerStatus.textContent = "请再次点击播放。";
        }
      } else {
        audio.pause();
      }
    }

    prevBtn.addEventListener("click", () => {
      loadTrack(currentIndex - 1);
      playerStatus.textContent = "已切换，请点击播放。";
    });

    nextBtn.addEventListener("click", () => {
      loadTrack(currentIndex + 1);
      playerStatus.textContent = "已切换，请点击播放。";
    });

    toggleBtn.addEventListener("click", togglePlay);

    audio.addEventListener("play", () => {
      playerStatus.textContent = "正在播放。";
      toggleBtn.textContent = "暂停";
      disc.classList.add("spinning");
    });

    audio.addEventListener("pause", () => {
      if (!audio.ended) {
        playerStatus.textContent = "已暂停。";
      }
      toggleBtn.textContent = "播放";
      disc.classList.remove("spinning");
    });

    audio.addEventListener("ended", () => {
      disc.classList.remove("spinning");
      loadTrack(currentIndex + 1);
      playerStatus.textContent = "已切到下一首，请点击播放。";
    });

    audio.addEventListener("error", () => {
      playerStatus.textContent = "未找到音乐文件，请检查 music 文件夹。";
      toggleBtn.textContent = "播放";
      disc.classList.remove("spinning");
    });

    loadTrack(0);
  }

  function renderArticlePager(posts) {
    const pager = $("articlePager");
    if (!pager || !Array.isArray(posts) || !posts.length) return;

    const current = getCurrentFile();
    const index = posts.findIndex(item => item.file === current);

    if (index === -1) {
      pager.innerHTML = "";
      return;
    }

    const prev = posts[index - 1] || null;
    const next = posts[index + 1] || null;

    pager.innerHTML = `
      ${
        prev
          ? `<a class="pager-card" href="./${escapeHtml(prev.file)}">
              <span class="pager-label">上一篇</span>
              <span class="pager-title">${escapeHtml(prev.title)}</span>
            </a>`
          : `<div class="pager-card">
              <span class="pager-label">上一篇</span>
              <span class="pager-empty">已经是最新一篇</span>
            </div>`
      }

      ${
        next
          ? `<a class="pager-card" href="./${escapeHtml(next.file)}">
              <span class="pager-label">下一篇</span>
              <span class="pager-title">${escapeHtml(next.title)}</span>
            </a>`
          : `<div class="pager-card">
              <span class="pager-label">下一篇</span>
              <span class="pager-empty">已经是最早一篇</span>
            </div>`
      }
    `;
  }

  function initReadingBar() {
    const bar = $("readingBar");
    if (!bar) return;

    window.addEventListener("scroll", () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = progress + "%";
    });
  }

  function initBackTop() {
    const btn = $("backTopBtn");
    if (!btn) return;

    window.addEventListener("scroll", () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      btn.classList.toggle("visible", scrollTop > 300);
    });

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function loadPosts() {
    try {
      const res = await fetch("./posts.json", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("posts.json 加载失败");
      }

      const posts = await res.json();

      renderQuote();
      renderLatest(posts);
      renderMetaStrip(posts);
      renderPosts(posts);
      bindHomeActions(posts);
      renderArticlePager(posts);
    } catch (err) {
      console.error(err);

      const list = $("postList");
      if (list) {
        list.innerHTML = `
          <article class="post-card">
            <div class="post-card-head">
              <span class="post-order">!!</span>
              <span class="post-meta">读取失败</span>
            </div>
            <div class="post-divider"></div>
            <h2 class="post-title">无法加载文章列表</h2>
            <p class="post-excerpt">请确认 posts.json 已存在，且内容格式正确。</p>
          </article>
        `;
      }

      const latest = $("latestPreview");
      if (latest) {
        latest.innerHTML = `
          <div class="latest-kicker">最近更新</div>
          <h2 class="latest-title">无法读取最新内容</h2>
          <p class="latest-date">--</p>
          <p class="latest-excerpt">请检查 posts.json 是否存在。</p>
        `;
      }
    }
  }

  async function init() {
    initTheme();
    await loadPlaylist();
    initMusic();
    initReadingBar();
    initBackTop();
    await loadPosts();
  }

  init();
})();
