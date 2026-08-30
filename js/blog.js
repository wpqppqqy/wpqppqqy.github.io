// 替换为你自己的仓库信息
const REPO_OWNER = 'wpqppqqy';
const REPO_NAME = 'wpqppqqy.github.io';

// 递归分页拉取所有Discussions，无需Token
async function fetchAllDiscussions() {
    let allDiscussions = [];
    let endCursor = null;
    let hasNextPage = true;

    while (hasNextPage) {
        // 构造GraphQL查询，单次最多拉取100条
        const query = `
      query {
        repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
          discussions(
            first: 100,
            after: ${endCursor ? `"${endCursor}"` : null},
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            nodes {
              title
              number
              url
              bodyHTML // 直接返回渲染好的HTML内容，无需额外解析Markdown
              createdAt
              labels(first: 10) {
                nodes { name }
              }
              category { name }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

        // 匿名发起请求，不携带任何Token
        const res = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query
            })
        });

        const data = await res.json();
        const discussions = data.data.repository.discussions;
        allDiscussions.push(...discussions.nodes);

        // 更新分页状态
        endCursor = discussions.pageInfo.endCursor;
        hasNextPage = discussions.pageInfo.hasNextPage;
    }

    return allDiscussions;
}

// 将拉取到的Discussions渲染为博客列表
async function renderBlogPage() {
    const postsContainer = document.getElementById('blog-posts');
    const discussions = await fetchAllDiscussions();

    discussions.forEach(post => {
        const postEl = document.createElement('article');
        postEl.className = 'blog-card';
        postEl.innerHTML = `
      <h2><a href="${post.url}" target="_blank">${post.title}</a></h2>
      <div class="meta">
        <span>发布于：${new Date(post.createdAt).toLocaleDateString()}</span>
        <span>分类：${post.category.name}</span>
      </div>
      <div class="content">${post.bodyHTML.slice(0, 300)}...</div>
    `;
        postsContainer.appendChild(postEl);
    });
}

// 页面加载完成后自动执行
document.addEventListener('DOMContentLoaded', renderBlogPage);