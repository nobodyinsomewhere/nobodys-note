(() => {
  const STORAGE_KEY = "nobodys_note_theme";

  function $(id) {
    return document.getElementById(id);
  }

  function applyTheme(theme) {
    const finalTheme = theme || "mist-cyan";
    document.documentElement.setAttribute("data-theme", finalTheme);
    localStorage.setItem(STORAGE_KEY, finalTheme);

    const select = $("themeSelect");
    if (select) {
      select.value = finalTheme;
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY) || "mist-cyan";
    applyTheme(savedTheme);

    const select = $("themeSelect");
    if (select) {
      select.addEventListener("change", () => {
        applyTheme(select.value);
      });
    }
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderPosts(posts) {
    const list = $("postList");
    if (!list) return;

    if (!Array.isArray(posts) || !posts.length) {
      list.innerHTML = `
        <article class="post-card refined-card">
          <div class="post-meta">暂无文章</div>
          <h2 class="post-title">这里还没有任何记录</h2>
          <p class="post-excerpt">你可以先通过 editor.html 生成一篇文章，再上传到仓库中。</p>
        </article>
      `;
      return;
    }

    list.innerHTML = posts.map(post => `
      <article class="post-card refined-card">
        <div class="post-meta">${escapeHtml(post.date || "")}</div>
        <h2 class="post-title">
          <a href="./${escapeHtml(post.file || "#")}">${escapeHtml(post.title || "未命名文章")}</a>
        </h2>
        <p class="post-excerpt">
          ${escapeHtml(post.excerpt || "")}
        </p>
        <a class="read-link" href="./${escapeHtml(post.file || "#")}">读下去</a>
      </article>
    `).join("");
  }

  async function loadPosts() {
    const list = $("postList");
    if (!list) return;

    try {
      const res = await fetch("./posts.json", { cache: "no-store" });

      if (!res.ok) {
        throw new Error("posts.json 加载失败");
      }

      const posts = await res.json();
      renderPosts(posts);
    } catch (err) {
      console.error(err);
      list.innerHTML = `
        <article class="post-card refined-card">
          <div class="post-meta">读取失败</div>
          <h2 class="post-title">无法加载文章列表</h2>
          <p class="post-excerpt">请确认 posts.json 已存在，且内容格式正确。</p>
        </article>
      `;
    }
  }

  async function init() {
    initTheme();
    await loadPosts();
  }

  init();
})();
