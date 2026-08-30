// 替换为你自己的GitHub用户名和目标仓库名
const REPO_OWNER = "wpqppqqy";
const REPO_NAME = "wpqppqqy.github.io";

// 递归拉取全部Discussions，自动处理分页
async function fetchAllDiscussions() {
    const allDiscussions = [];
    let endCursor = null;
    let hasNextPage = true;

    while (hasNextPage) {
        // 构造GraphQL查询语句，单次最多拉取100条，支持获取标题、正文、分类、创建时间等全量字段
        const query = `
      query {
        repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
          discussions(
            first: 100,
            after: ${endCursor ? `"${endCursor}"` : null},
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            nodes {
              id
              title
              number
              url
              bodyHTML // 直接返回渲染好的HTML内容，无需额外解析Markdown
              createdAt
              category {
                name
                slug
              }
              labels(first: 10) {
                nodes {
                  name
                  color
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

        // 无Token直接请求公开接口
        const res = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query
            })
        });

        const data = await res.json();
        const discussionsPage = data.data.repository.discussions;
        allDiscussions.push(...discussionsPage.nodes);

        // 更新分页状态，拉取下一页
        hasNextPage = discussionsPage.pageInfo.hasNextPage;
        endCursor = discussionsPage.pageInfo.endCursor;
    }

    return allDiscussions;
}

// 调用示例：拉取内容后渲染到页面
fetchAllDiscussions().then(discussions => {
    console.log("拉取到的全部博客内容：", discussions);
    // 在这里编写自定义渲染逻辑，把discussions数组渲染成你想要的博客列表样式
    const blogContainer = document.getElementById("blog-list");
    blogContainer.innerHTML = discussions.map(post => `
    <article class="blog-post">
      <h2><a href="${post.url}" target="_blank">${post.title}</a></h2>
      <div class="meta">
        <span>分类：${post.category.name}</span>
        <span>发布时间：${new Date(post.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="content">${post.bodyHTML}</div>
    </article>
  `).join("");
}).catch(err => {
    console.error("拉取Discussions失败：", err);
});