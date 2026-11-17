/** @format */

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM Elements
const postsContainer = document.getElementById("postsContainer");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorContainer = document.getElementById("errorContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const sortSelect = document.getElementById("sortSelect");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageIndicator = document.getElementById("pageIndicator");

// Modal Elements
const openModalBtn = document.getElementById("openModalBtn");
const postModal = document.getElementById("postModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addPostForm = document.getElementById("addPostForm");
const postTitleInput = document.getElementById("postTitle");
const postBodyInput = document.getElementById("postBody");
const titleError = document.getElementById("titleError");
const bodyError = document.getElementById("bodyError");
const successResult = document.getElementById("successResult");
const modalCloseSuccessBtn = document.getElementById("modalCloseSuccessBtn");

// Helper to read query parameters from URL
function getStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    page: parseInt(params.get("_page")) || 1,
    limit: parseInt(params.get("_limit")) || 5,
    titleLike: params.get("title_like") || "",
    sort: params.get("_sort") || "",
    order: params.get("_order") || "",
  };
}

// Helper to update query parameters in URL without reloading page
function updateURLState(newState) {
  const params = new URLSearchParams(window.location.search);

  Object.keys(newState).forEach((key) => {
    if (newState[key] !== null && newState[key] !== undefined && newState[key] !== "") {
      params.set(key, newState[key]);
    } else {
      params.delete(key);
    }
  });

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, "", newUrl);
}

// Fetch and Render Posts based on current URL state
async function fetchAndRenderPosts() {
  const state = getStateFromURL();

  // Sync UI controls with current URL state values
  searchInput.value = state.titleLike;
  if (state.sort && state.order) {
    sortSelect.value = `${state.sort}-${state.order}`;
  } else {
    sortSelect.value = "";
  }
  pageIndicator.innerText = `Page ${state.page}`;

  // Build API Query URL
  const queryParams = new URLSearchParams({
    _page: state.page,
    _limit: state.limit,
  });
  if (state.titleLike) queryParams.append("title_like", state.titleLike);
  if (state.sort) queryParams.append("_sort", state.sort);
  if (state.order) queryParams.append("_order", state.order);

  loadingIndicator.classList.remove("hidden");
  errorContainer.classList.add("hidden");
  postsContainer.innerHTML = "";

  try {
    const response = await fetch(`${API_URL}?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch posts from server.");

    const posts = await response.json();
    loadingIndicator.classList.add("hidden");

    if (posts.length === 0) {
      postsContainer.innerHTML = `<p class="loading">No posts found.</p>`;
      nextBtn.disabled = true;
    } else {
      nextBtn.disabled = posts.length < state.limit;
      renderPosts(posts);
    }

    prevBtn.disabled = state.page <= 1;
  } catch (err) {
    loadingIndicator.classList.add("hidden");
    errorContainer.textContent = err.message;
    errorContainer.classList.remove("hidden");
  }
}

// Render posts array into DOM
function renderPosts(posts) {
  postsContainer.innerHTML = posts
    .map(
      (post) => `
    <div class="post-card">
      <div class="post-header">
        <span class="post-id">ID: ${post.id}</span>
      </div>
      <h3 class="post-title">${escapeHTML(post.title)}</h3>
      <p class="post-body">${escapeHTML(post.body)}</p>
    </div>
  `,
    )
    .join("");
}

// Basic HTML Sanitizer helper to prevent XSS injection
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[tag] || tag);
}

// Event Listeners for Search & Sort
searchBtn.addEventListener("click", () => {
  const titleLike = searchInput.value.trim();
  updateURLState({ title_like: titleLike, _page: 1 });
  fetchAndRenderPosts();
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

sortSelect.addEventListener("change", () => {
  const val = sortSelect.value;
  let sortField = "";
  let sortOrder = "";

  if (val) {
    const parts = val.split("-");
    sortField = parts[0];
    sortOrder = parts[1];
  }

  updateURLState({ _sort: sortField, _order: sortOrder, _page: 1 });
  fetchAndRenderPosts();
});

// Pagination Listeners
prevBtn.addEventListener("click", () => {
  const state = getStateFromURL();
  if (state.page > 1) {
    updateURLState({ _page: state.page - 1 });
    fetchAndRenderPosts();
  }
});

nextBtn.addEventListener("click", () => {
  const state = getStateFromURL();
  updateURLState({ _page: state.page + 1 });
  fetchAndRenderPosts();
});

// Modal Actions
openModalBtn.addEventListener("click", () => {
  addPostForm.reset();
  titleError.textContent = "";
  bodyError.textContent = "";
  addPostForm.classList.remove("hidden");
  successResult.classList.add("hidden");
  postModal.classList.remove("hidden");
});

const closeModal = () => {
  postModal.classList.add("hidden");
};

closeModalBtn.addEventListener("click", closeModal);
modalCloseSuccessBtn.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === postModal) closeModal();
});

// Client-side Validation & Add Post Submit
addPostForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = postTitleInput.value.trim();
  const body = postBodyInput.value.trim();

  let isValid = true;

  // Title Validation: required, no digits, <= 30 chars
  if (!title) {
    titleError.textContent = "Title is required.";
    isValid = false;
  } else if (/\d/.test(title)) {
    titleError.textContent = "Title cannot contain digits.";
    isValid = false;
  } else if (title.length > 30) {
    titleError.textContent = "Title must be 30 characters or fewer.";
    isValid = false;
  } else {
    titleError.textContent = "";
  }

  // Body Validation: required, no digits
  if (!body) {
    bodyError.textContent = "Body is required.";
    isValid = false;
  } else if (/\d/.test(body)) {
    bodyError.textContent = "Body cannot contain digits.";
    isValid = false;
  } else {
    bodyError.textContent = "";
  }

  if (!isValid) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });

    if (!response.ok) throw new Error("Failed to create post.");

    const result = await response.json();

    // Populate success result box
    document.getElementById("resId").textContent = result.id;
    document.getElementById("resTitle").textContent = result.title;
    document.getElementById("resBody").textContent = result.body;

    addPostForm.classList.add("hidden");
    successResult.classList.remove("hidden");
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// Initialize app on load
window.addEventListener("popstate", fetchAndRenderPosts);
fetchAndRenderPosts();
