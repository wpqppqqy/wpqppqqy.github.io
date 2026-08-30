/**************************
 * 请修改这里为你自己的配置信息
 **************************/
// 你的GitHub用户名
const GITHUB_USER = "wpqppqqy";
// 部署博客的GitHub仓库名，一般为 用户名.github.io
const REPO_NAME = "wpqppqqy.github.io";

// 获取DOM元素：内容容器和返回按钮，后续要操作它们
const contentEl = document.getElementById('content');
const backBtn = document.getElementById('backBtn');
// 全局变量：存储拉取到的所有文章数据，方便在列表和详情间切换
let allPosts;

/**************************
 * 核心功能：通过GitHub官方REST API拉取所有Discussions
 **************************/
async function fetchAllDiscussions() {
    // 拼接GitHub REST API端点：
    // per_page=100 表示一次拉取最多100篇文章，足够个人博客使用
    // sort=created&direction=desc 表示按创建时间倒序排列，最新文章显示在最前面
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/discussions?per_page=100&sort=created&direction=desc`;

    // 发起GET请求，注意请求头设置：
    // Authorization：带PAT令牌鉴权
    // Accept：application/vnd.github.html+json 是GitHub REST API的特殊媒体类型，指定返回渲染好的HTML内容，不需要我们自己解析Markdown
    const res = await fetch(apiUrl, {
        headers: {
            "Accept": "application/vnd.github.html+json"
        }
    });
    allPosts = await res.json();
    // 按创建时间倒序排序
    allPosts = allPosts.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );
    renderPostList();
}

/**************************
 * 渲染文章列表页面
 **************************/
function renderPostList() {
    // 清空内容容器原有内容
    contentEl.innerHTML = '';
    // 隐藏返回按钮，因为现在已经在列表页了
    backBtn.style.display = 'none';
    // 遍历所有拉取到的Discussions，逐个生成文章卡片
    allPosts.forEach(post => {
        // 创建当前文章卡片的DOM元素
        const postEl = document.createElement('div');
        // 添加卡片样式类
        postEl.className = 'post-item';
        // 将REST API返回的创建时间转换为符合中文习惯的本地时间格式
        const createDate = new Date(post.created_at).toLocaleString('zh-CN');
        // 拼接卡片的HTML内容，只显示标题和发布时间
        postEl.innerHTML = `
                    <div class="post-title">${post.title}</div>
                    <div class="post-meta">发布于 ${createDate}</div>
                `;
        // 给卡片绑定点击事件：点击后跳转到对应文章的详情页
        postEl.addEventListener('click', () => renderSinglePost(post));
        // 将生成好的卡片添加到内容容器中
        contentEl.appendChild(postEl);
    });
}

/**************************
 * 渲染单篇文章详情页面
 * 参数post：当前要渲染的文章数据，来自REST API返回结果
 **************************/
function renderSinglePost(post) {
    // 转换发布时间格式
    const createDate = new Date(post.created_at).toLocaleString('zh-CN');
    // 将文章标题、发布时间、已经GitHub渲染好的正文HTML，填充到内容容器
    // post.body_html 就是REST API返回的渲染完成的HTML正文，直接插入即可
    contentEl.innerHTML = `
                <h2 class="post-title">${post.title}</h2>
                <div class="post-meta">发布于 ${createDate}</div>
                <div class="post-content">${post.body_html}</div>
            `;
    // 显示返回列表按钮，方便用户回到文章列表
    backBtn.style.display = 'block';
}

/**************************
 * 绑定返回按钮的点击事件：点击就重新渲染文章列表
 **************************/
backBtn.addEventListener('click', renderPostList);
/**************************
 * 页面加载完成后，自动执行拉取数据渲染列表的逻辑
 **************************/
fetchAllDiscussions();