(function () {
  const pages = window.BOOK_PAGES || [];
  let currentIndex = 0;
  let isAnimating = false;

  const sheetLeft = document.getElementById("sheetLeft");
  const sheetRight = document.getElementById("sheetRight");
  const pageIndicator = document.getElementById("pageIndicator");
  const progressFill = document.getElementById("progressFill");
  const tocPanel = document.getElementById("tocPanel");
  const tocBackdrop = document.getElementById("tocBackdrop");
  const tocList = document.getElementById("tocList");
  const introOverlay = document.getElementById("introOverlay");
  const btnToc = document.getElementById("btnToc");
  const btnCloseToc = document.getElementById("btnCloseToc");

  const chapterOpeners = pages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => page.type === "chapter-opener");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isTocOpen() {
    return tocPanel.classList.contains("is-open");
  }

  function openToc() {
    tocPanel.classList.add("is-open");
    tocPanel.setAttribute("aria-hidden", "false");
    btnToc.textContent = "Close";
    btnToc.setAttribute("aria-label", "Close contents");
    document.body.classList.add("toc-open");
  }

  function closeToc() {
    tocPanel.classList.remove("is-open");
    tocPanel.setAttribute("aria-hidden", "true");
    btnToc.textContent = "Contents";
    btnToc.setAttribute("aria-label", "Table of contents");
    document.body.classList.remove("toc-open");
  }

  function toggleToc() {
    if (isTocOpen()) {
      closeToc();
    } else {
      openToc();
    }
  }

  function renderSpecialPage(page) {
    if (page.type === "cover") {
      const dedication = (page.dedication || [])
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");
      return `
        <div class="cover-page">
          <div class="cover-ornament"></div>
          <h1>${escapeHtml(page.title)}</h1>
          <div class="cover-ornament"></div>
          <p class="cover-subtitle">${escapeHtml(page.subtitle || "")}</p>
          <p class="cover-author">Written by ${escapeHtml(page.author || "")}</p>
          <div class="cover-dedication">${dedication}</div>
        </div>
      `;
    }

    if (page.type === "title-page") {
      return `
        <div class="page-content title-page">
          <h1>${escapeHtml(page.title)}</h1>
          <div class="cover-ornament"></div>
          ${page.html || ""}
        </div>
      `;
    }

    if (page.type === "chapter-opener") {
      return `
        <div class="chapter-opener-page">
          <div class="chapter-number">${escapeHtml(page.number || "")}</div>
          <div class="chapter-rule"></div>
          <h1>${escapeHtml(page.title || page.chapter || "")}</h1>
        </div>
      `;
    }

    if (page.type === "back-cover") {
      return `<div class="page-content back-cover-page">${page.html || ""}</div>`;
    }

    return `<div class="page-content">${page.html || ""}</div>`;
  }

  function renderSheet(page, side) {
    if (!page) {
      sheetLeft.innerHTML = '<div class="empty-sheet">End of book</div>';
      sheetRight.innerHTML = '<div class="empty-sheet"> </div>';
      return;
    }

    const leftPage = side === "spread" ? page : page;
    const rightPage = side === "spread" ? pages[currentIndex + 1] : null;

    if (window.matchMedia("(max-width: 860px)").matches) {
      sheetRight.innerHTML = renderSpecialPage(leftPage);
      sheetRight.dataset.page = `${leftPage.index}`;
      sheetLeft.innerHTML = "";
      sheetLeft.dataset.page = "";
      return;
    }

    sheetLeft.innerHTML = renderSpecialPage(leftPage);
    sheetLeft.dataset.page = `${leftPage.index}`;

    if (rightPage && side === "spread") {
      sheetRight.innerHTML = renderSpecialPage(rightPage);
      sheetRight.dataset.page = `${rightPage.index}`;
    } else {
      sheetRight.innerHTML = '<div class="empty-sheet">Turn the page</div>';
      sheetRight.dataset.page = "";
    }
  }

  function updateUI() {
    const page = pages[currentIndex];
    const total = pages.length;
    const progress = ((currentIndex + 1) / total) * 100;
    pageIndicator.textContent = `Page ${page.index} of ${total}${page.chapter ? ` · ${page.chapter}` : ""}`;
    progressFill.style.width = `${progress}%`;
  }

  function showPage(index, direction) {
    if (isAnimating || index < 0 || index >= pages.length) return;
    isAnimating = true;

    const mobile = window.matchMedia("(max-width: 860px)").matches;
    const turningLeft = sheetLeft;
    const turningRight = sheetRight;

    if (direction === "next") {
      turningRight.classList.add("turning-right");
    } else if (direction === "prev") {
      turningLeft.classList.add("turning-left");
    }

    window.setTimeout(() => {
      currentIndex = index;
      if (mobile) {
        renderSheet(pages[currentIndex], "single");
      } else {
        const spreadStart = currentIndex % 2 === 0 ? currentIndex : currentIndex - 1;
        currentIndex = spreadStart;
        renderSheet(pages[currentIndex], "spread");
      }
      updateUI();
      turningLeft.classList.remove("turning-left");
      turningRight.classList.remove("turning-right");
      isAnimating = false;
    }, 220);
  }

  function nextPage() {
    if (isTocOpen()) return;
    const step = window.matchMedia("(max-width: 860px)").matches ? 1 : 2;
    showPage(Math.min(currentIndex + step, pages.length - 1), "next");
  }

  function prevPage() {
    if (isTocOpen()) return;
    const step = window.matchMedia("(max-width: 860px)").matches ? 1 : 2;
    showPage(Math.max(currentIndex - step, 0), "prev");
  }

  function buildToc() {
    tocList.innerHTML = chapterOpeners
      .map(({ page, index }) => {
        const label = page.title || page.number || page.chapter;
        return `
          <button type="button" class="toc-item" data-index="${index}">
            ${escapeHtml(label)}
            <small>Page ${page.index}</small>
          </button>
        `;
      })
      .join("");

    tocList.querySelectorAll(".toc-item").forEach((button) => {
      button.addEventListener("click", () => {
        closeToc();
        showPage(Number(button.dataset.index), "next");
      });
    });
  }

  document.getElementById("navNext").addEventListener("click", nextPage);
  document.getElementById("navPrev").addEventListener("click", prevPage);
  document.getElementById("btnBegin").addEventListener("click", () => {
    introOverlay.classList.add("hidden");
  });

  function bindCloseHandler(element) {
    const handler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeToc();
    };
    element.addEventListener("click", handler);
    element.addEventListener("touchend", handler, { passive: false });
  }

  btnToc.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleToc();
  });

  bindCloseHandler(btnCloseToc);
  bindCloseHandler(tocBackdrop);

  document.getElementById("btnTheme").addEventListener("click", () => {
    document.body.classList.toggle("night-mode");
  });

  document.getElementById("btnFullscreen").addEventListener("click", async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (isTocOpen() && (event.key === "Escape" || event.key === "Esc")) {
      event.preventDefault();
      closeToc();
      return;
    }

    if (introOverlay.classList.contains("hidden") === false && event.key !== "Enter") return;
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      nextPage();
    }
    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      prevPage();
    }
    if (event.key === "Enter" && !introOverlay.classList.contains("hidden")) {
      introOverlay.classList.add("hidden");
    }
  });

  let touchStartX = 0;
  document.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (isTocOpen()) return;
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) nextPage();
    else prevPage();
  }, { passive: true });

  window.addEventListener("resize", () => {
    renderSheet(pages[currentIndex], window.matchMedia("(max-width: 860px)").matches ? "single" : "spread");
  });

  buildToc();
  renderSheet(pages[0], window.matchMedia("(max-width: 860px)").matches ? "single" : "spread");
  updateUI();
})();
