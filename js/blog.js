const REPO_OWNER = "wpqppqqy";
const REPO_NAME = "wpqppqqy.github.io";

async function fetchAllDiscussions() {
    const allPosts = [];
    let page = 1;
    // GitHub公开的Discussions REST代理接口，无鉴权、兼容性更强
    const baseUrl = `https://gitee.com/api/v5/repos/${REPO_OWNER}/${REPO_NAME}/discussions`;

    while (true) {
        // 单页最多拉取100条，自动分页拉完全部内容
        const res = await fetch(`${baseUrl}?page=${page}&per_page=100`);
        if (!res.ok) break; // 超出最后一页自动终止循环
        const posts = await res.json();
        if (posts.length === 0) break;
        allPosts.push(...posts);
        page++;
    }
    return allPosts;
}

// 调用并渲染内容
fetchAllDiscussions().then(list => {
    console.log("成功拉取全部Discussions：", list);
    document.getElementById("blog-container").innerHTML = list.map(item => `
    <div class="post-item">
      <h3><a href="${item.html_url}" target="_blank">${item.title}</a></h3>
      <p class="date">发布于：${new Date(item.created_at).toLocaleDateString()}</p>
      <div class="content">${item.body_html}</div>
    </div>
  `).join("")
}).catch(err => console.error("拉取失败，错误信息：", err));