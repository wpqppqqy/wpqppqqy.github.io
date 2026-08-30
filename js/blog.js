const GITHUB_USER = "wpqppqqy";
const REPO_NAME = "wpqppqqy.github.io";
const contentEl = document.getElementById('content');
const backBtn = document.getElementById('backBtn');
let allPosts;
async function fetchAllDiscussions() {
    try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/discussions?per_page=100&sort=created&direction=desc`;
        const res = await fetch(apiUrl, {
            headers: {
                "Accept": "application/vnd.github.html+json"
            }
        });
        allPosts = await res.json();
        allPosts = await Promise.all(
            allPosts.map(async (post) => {
                const commentsUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/discussions/${post.number}/comments?per_page=100&sort=created&direction=desc`;
                const commentsRes = await fetch(commentsUrl, {
                    headers: {
                        "Accept": "application/vnd.github.html+json"
                    }
                });
                let allComments = await commentsRes.json();
                const commentMap = {};
                const topLevelComments = [];
                allComments.forEach(comment => {
                    commentMap[comment.id] = {
                        ...comment,
                        children: []
                    };
                });
                allComments.forEach(comment => {
                    if (comment.parent_id === null || comment.parent_id === undefined) {
                        topLevelComments.push(commentMap[comment.id]);
                    } else if (commentMap[comment.parent_id]) {
                        commentMap[comment.parent_id].children.push(commentMap[comment.id]);
                    }
                });
                topLevelComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                topLevelComments.forEach(top => {
                    top.children.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                });
                return {
                    ...post,
                    comments: topLevelComments
                };
            })
        );
        allPosts = allPosts.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
        renderPostList();
    } catch (err) {
        contentEl.innerHTML = `<div class="post-content">加载博文失败，请检查网络后刷新重试</div>`;
        console.error('加载失败：', err);
    }
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

function renderComment(comment) {
    const commentDate = new Date(comment.created_at).toLocaleString('zh-CN');
    let html = `
    <div class="comment-item">
      <div class="post-meta">
        <img class="author-avatar" src="${comment.user.avatar_url}" alt="${comment.user.login}">
        <span>${comment.user.login}</span>
        <span>${commentDate}</span>
      </div>
      <div class="post-content">${comment.body_html}</div>
  `;
    if (comment.children.length > 0) {
        html += `<div class="comments-section"><h4>回复 (${comment.children.length}条)</h4>`;
        comment.children.forEach(child => {
            html += renderComment(child);
        });
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

function renderSinglePost(post) {
    const createDate = new Date(post.created_at).toLocaleString('zh-CN');
    let commentsHtml = `<div class="comments-section"><h3>评论区 (${post.comments.reduce((total, c) => total + 1 + c.children.length, 0)}条)</h3>`;
    post.comments.forEach(comment => {
        commentsHtml += renderComment(comment);
    })
    commentsHtml += `</div>`;
    contentEl.innerHTML = `
    <h2 class="post-title">${post.title}</h2>
    <div class="post-meta">
      <span>${post.user.login}</span>
      <span>发布于 ${createDate}</span>
    </div>
    <div class="post-content">${post.body_html}</div>
    ${commentsHtml}
  `;
    backBtn.style.display = 'block';
}
backBtn.addEventListener('click', renderPostList);
fetchAllDiscussions();