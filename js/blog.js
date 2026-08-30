const GITHUB_USER = "wpqppqqy";
const REPO_NAME = "wpqppqqy.github.io";
const contentEl = document.getElementById('content');
const backBtn = document.getElementById('backBtn');
let allPosts;
async function fetchAllDiscussions() {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/discussions?per_page=100&sort=created&direction=desc`;
    const res = await fetch(apiUrl, {
        headers: {
            "Accept": "application/vnd.github.html+json"
        }
    });
    allPosts = await res.json();
    allPosts = allPosts.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );
    renderPostList();
}

function renderPostList() {
    contentEl.innerHTML = '';
    backBtn.style.display = 'none';
    allPosts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'post-item';
        const createDate = new Date(post.created_at).toLocaleString('zh-CN');
        postEl.innerHTML = `
                    <div class="post-title">${post.title}</div>
                    <div class="post-meta">发布于 ${createDate}</div>
                `;
        postEl.addEventListener('click', () => renderSinglePost(post));
        contentEl.appendChild(postEl);
    });
}

function renderSinglePost(post) {
    const createDate = new Date(post.created_at).toLocaleString('zh-CN');
    contentEl.innerHTML = `
                <h2 class="post-title">${post.title}</h2>
                <div class="post-meta">发布于 ${createDate}</div>
                <div class="post-content">${post.body_html}</div>
            `;
    backBtn.style.display = 'block';
}
backBtn.addEventListener('click', renderPostList);
fetchAllDiscussions();