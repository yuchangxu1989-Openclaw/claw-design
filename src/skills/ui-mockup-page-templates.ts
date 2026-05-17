import type { MockupPage, MockupPageTemplate, MockupViewport } from './ui-mockup-types.js';

type TemplateBuilder = (title: string, viewport: MockupViewport) => MockupPage[];

const isMobile = (v: MockupViewport) => v === 'mobile';

const loginTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'login', title: `${title} — 登录`, viewport,
  sections: [
    ...(isMobile(viewport) ? [] : [{
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [{ id: 'navbar-1', type: 'navbar' as const, label: title }],
    }]),
    {
      id: 'login-form', title: '登录表单', layout: 'column' as const,
      components: [
        { id: 'logo', type: 'image' as const, label: `${title} 标识` },
        { id: 'title', type: 'card' as const, label: '欢迎回来' },
        { id: 'email', type: 'input' as const, label: '邮箱 / 手机号' },
        { id: 'password', type: 'input' as const, label: '密码' },
        { id: 'remember', type: 'toggle' as const, label: '记住我' },
        { id: 'login-btn', type: 'button' as const, label: '登录' },
        { id: 'divider', type: 'divider' as const, label: '或' },
        { id: 'social-wechat', type: 'button' as const, label: '微信登录', state: 'secondary' },
        { id: 'social-google', type: 'button' as const, label: 'Google 登录', state: 'secondary' },
        { id: 'forgot-link', type: 'button' as const, label: '忘记密码？', state: 'link' },
        { id: 'register-link', type: 'button' as const, label: '没有账号？立即注册', state: 'link' },
      ],
    },
  ],
}];

const registerTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'register', title: `${title} — 注册`, viewport,
  sections: [
    ...(isMobile(viewport) ? [] : [{
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [{ id: 'navbar-1', type: 'navbar' as const, label: title }],
    }]),
    {
      id: 'register-form', title: '注册表单', layout: 'column' as const,
      components: [
        { id: 'logo', type: 'image' as const, label: `${title} 标识` },
        { id: 'title', type: 'card' as const, label: '创建账号' },
        { id: 'phone', type: 'input' as const, label: '手机号' },
        { id: 'sms-row', type: 'form' as const, label: '获取验证码' },
        { id: 'nickname', type: 'input' as const, label: '昵称' },
        { id: 'password', type: 'input' as const, label: '设置密码' },
        { id: 'confirm-pw', type: 'input' as const, label: '确认密码' },
        { id: 'agreement', type: 'toggle' as const, label: '同意用户协议与隐私政策' },
        { id: 'register-btn', type: 'button' as const, label: '注册' },
        { id: 'login-link', type: 'button' as const, label: '已有账号？去登录', state: 'link' },
      ],
    },
  ],
}];

const forgotPasswordTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'forgot-password', title: `${title} — 找回密码`, viewport,
  sections: [{
    id: 'reset-form', title: '找回密码', layout: 'column' as const,
    components: [
      { id: 'logo', type: 'image' as const, label: `${title} 标识` },
      { id: 'title', type: 'card' as const, label: '找回密码' },
      { id: 'desc', type: 'card' as const, label: '输入注册手机号，我们将发送验证码' },
      { id: 'phone', type: 'input' as const, label: '手机号' },
      { id: 'sms-code', type: 'form' as const, label: '获取验证码' },
      { id: 'new-pw', type: 'input' as const, label: '新密码' },
      { id: 'confirm-pw', type: 'input' as const, label: '确认新密码' },
      { id: 'submit-btn', type: 'button' as const, label: '重置密码' },
      { id: 'back-link', type: 'button' as const, label: '返回登录', state: 'link' },
    ],
  }],
}];

const settingsTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'settings', title: `${title} — 设置`, viewport,
  sections: [
    {
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [{ id: 'navbar-1', type: 'navbar' as const, label: title }],
    },
    ...(isMobile(viewport) ? [] : [{
      id: 'sidebar', title: '设置菜单', layout: 'column' as const,
      components: [{ id: 'sidebar-1', type: 'sidebar' as const, label: '账号 · 通知 · 隐私 · 外观 · 安全' }],
    }]),
    {
      id: 'account', title: '账号设置', layout: 'column' as const,
      components: [
        { id: 'avatar-upload', type: 'avatar' as const, label: '头像' },
        { id: 'nickname', type: 'input' as const, label: '昵称' },
        { id: 'email', type: 'input' as const, label: '邮箱' },
        { id: 'phone', type: 'input' as const, label: '手机号' },
        { id: 'save-btn', type: 'button' as const, label: '保存修改' },
      ],
    },
    {
      id: 'notification', title: '通知设置', layout: 'column' as const,
      components: [
        { id: 'push-toggle', type: 'toggle' as const, label: '推送通知' },
        { id: 'email-toggle', type: 'toggle' as const, label: '邮件通知' },
        { id: 'sms-toggle', type: 'toggle' as const, label: '短信通知' },
      ],
    },
    {
      id: 'appearance', title: '外观设置', layout: 'column' as const,
      components: [
        { id: 'theme-toggle', type: 'toggle' as const, label: '深色模式' },
        { id: 'lang-select', type: 'input' as const, label: '语言选择' },
      ],
    },
  ],
}];

const profileTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'profile', title: `${title} — 个人中心`, viewport,
  sections: [
    {
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [{ id: 'navbar-1', type: 'navbar' as const, label: title }],
    },
    {
      id: 'profile-header', title: '用户信息', layout: isMobile(viewport) ? 'column' as const : 'row' as const,
      components: [
        { id: 'avatar', type: 'avatar' as const, label: '用户头像' },
        { id: 'user-info', type: 'card' as const, label: '个人资料与加入时间' },
        { id: 'edit-btn', type: 'button' as const, label: '编辑资料', state: 'secondary' },
      ],
    },
    {
      id: 'stats', title: '数据概览', layout: 'row' as const,
      components: [
        { id: 'stat-posts', type: 'stat' as const, label: '发布' },
        { id: 'stat-followers', type: 'stat' as const, label: '粉丝' },
        { id: 'stat-following', type: 'stat' as const, label: '关注' },
      ],
    },
    {
      id: 'content-tabs', title: '内容', layout: 'column' as const,
      components: [
        { id: 'tabs', type: 'tabs' as const, label: '动态 · 收藏 · 点赞' },
        { id: 'content-list', type: 'list' as const, label: '最新内容' },
      ],
    },
  ],
}];

const productListTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'product-list', title: `${title} — 商品列表`, viewport,
  sections: [
    {
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [
        { id: 'navbar-1', type: 'navbar' as const, label: title },
        { id: 'search-bar', type: 'search' as const, label: '搜索商品' },
      ],
    },
    {
      id: 'filters', title: '筛选', layout: 'row' as const,
      components: [
        { id: 'cat-filter', type: 'tabs' as const, label: '全部 · 热销 · 新品 · 促销' },
        { id: 'sort', type: 'input' as const, label: '按综合排序' },
      ],
    },
    {
      id: 'products', title: '商品网格', layout: 'grid' as const,
      components: [
        { id: 'prod-1', type: 'card' as const, label: '轻量通勤背包', children: [
          { id: 'prod-1-img', type: 'image' as const, label: '轻量通勤背包图片' },
          { id: 'prod-1-title', type: 'card' as const, label: '轻量通勤背包' },
          { id: 'prod-1-price', type: 'price' as const, label: '¥199.00' },
          { id: 'prod-1-rating', type: 'rating' as const, label: '4.8 分' },
        ]},
        { id: 'prod-2', type: 'card' as const, label: '桌面无线充', children: [
          { id: 'prod-2-img', type: 'image' as const, label: '桌面无线充图片' },
          { id: 'prod-2-title', type: 'card' as const, label: '桌面无线充' },
          { id: 'prod-2-price', type: 'price' as const, label: '¥299.00' },
          { id: 'prod-2-tag', type: 'tag' as const, label: '热销' },
        ]},
        { id: 'prod-3', type: 'card' as const, label: '降噪蓝牙耳机', children: [
          { id: 'prod-3-img', type: 'image' as const, label: '降噪蓝牙耳机图片' },
          { id: 'prod-3-title', type: 'card' as const, label: '降噪蓝牙耳机' },
          { id: 'prod-3-price', type: 'price' as const, label: '¥99.00' },
          { id: 'prod-3-tag', type: 'tag' as const, label: '新品' },
        ]},
        { id: 'prod-4', type: 'card' as const, label: '便携办公显示器', children: [
          { id: 'prod-4-img', type: 'image' as const, label: '便携办公显示器图片' },
          { id: 'prod-4-title', type: 'card' as const, label: '便携办公显示器' },
          { id: 'prod-4-price', type: 'price' as const, label: '¥459.00' },
          { id: 'prod-4-rating', type: 'rating' as const, label: '4.5 分' },
        ]},
      ],
    },
    ...(isMobile(viewport) ? [{
      id: 'bottom-nav', title: '底部导航', layout: 'row' as const,
      components: [{ id: 'bottom-tab', type: 'navbar' as const, label: '首页 · 分类 · 购物车 · 我的' }],
    }] : []),
  ],
}];

const productDetailTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'product-detail', title: `${title} — 商品详情`, viewport,
  sections: [
    {
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [
        { id: 'navbar-1', type: 'navbar' as const, label: `${title} / 返回` },
        ...(isMobile(viewport) ? [] : [{ id: 'breadcrumb', type: 'breadcrumb' as const, label: '首页 > 分类 > 商品详情' }]),
      ],
    },
    {
      id: 'product-main', title: '商品信息', layout: isMobile(viewport) ? 'column' as const : 'row' as const,
      components: [
        { id: 'gallery', type: 'image' as const, label: '产品展示图', width: isMobile(viewport) ? '100%' : '50%' },
        { id: 'info', type: 'card' as const, label: '精选产品信息', children: [
          { id: 'prod-title', type: 'card' as const, label: '新一代轻办公套装' },
          { id: 'prod-price', type: 'price' as const, label: '¥199.00  原价 ¥299.00' },
          { id: 'prod-rating', type: 'rating' as const, label: '4.8 分 · 2.3k 评价' },
          { id: 'prod-tags', type: 'tag' as const, label: '包邮 · 7天退换 · 正品保障' },
          { id: 'sku-select', type: 'form' as const, label: '选择颜色与规格' },
          { id: 'quantity', type: 'input' as const, label: '数量' },
          { id: 'buy-btn', type: 'button' as const, label: '立即购买' },
          { id: 'cart-btn', type: 'button' as const, label: '加入购物车', state: 'secondary' },
        ]},
      ],
    },
    {
      id: 'details-tabs', title: '详情', layout: 'column' as const,
      components: [
        { id: 'tabs', type: 'tabs' as const, label: '详情 · 参数 · 评价' },
        { id: 'detail-content', type: 'placeholder' as const, label: '查看详细介绍' },
      ],
    },
  ],
}];

const articleDetailTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'article-detail', title: `${title} — 文章详情`, viewport,
  sections: [
    {
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [{ id: 'navbar-1', type: 'navbar' as const, label: title }],
    },
    {
      id: 'article-header', title: '文章头部', layout: 'column' as const,
      components: [
        ...(isMobile(viewport) ? [] : [{ id: 'breadcrumb', type: 'breadcrumb' as const, label: '首页 > 专栏 > 文章' }]),
        { id: 'article-title', type: 'hero' as const, label: '重新理解高效协作' },
        { id: 'meta', type: 'card' as const, label: '作者信息与发布时间' },
        { id: 'cover', type: 'image' as const, label: '封面图' },
      ],
    },
    {
      id: 'article-body', title: '正文', layout: 'column' as const,
      components: [
        { id: 'content', type: 'placeholder' as const, label: '文章内容预览', height: '300px' },
        { id: 'tags', type: 'tag' as const, label: '技术 · 前端 · 设计' },
      ],
    },
    {
      id: 'article-actions', title: '互动', layout: 'row' as const,
      components: [
        { id: 'like-btn', type: 'button' as const, label: '点赞 128', state: 'secondary' },
        { id: 'collect-btn', type: 'button' as const, label: '收藏 56', state: 'secondary' },
        { id: 'share-btn', type: 'button' as const, label: '分享', state: 'secondary' },
      ],
    },
    {
      id: 'comments', title: '评论区', layout: 'column' as const,
      components: [
        { id: 'comment-input', type: 'form' as const, label: '写下你的想法' },
        { id: 'comment-list', type: 'list' as const, label: '读者评论' },
      ],
    },
  ],
}];

const dashboardTemplate: TemplateBuilder = (title, viewport) => [{
  name: 'dashboard', title: `${title} — 数据看板`, viewport,
  sections: [
    {
      id: 'nav', title: '导航', layout: 'column' as const,
      components: [
        { id: 'navbar-1', type: 'navbar' as const, label: `${title} 管理后台` },
      ],
    },
    ...(isMobile(viewport) ? [] : [{
      id: 'sidebar', title: '侧边栏', layout: 'column' as const,
      components: [{ id: 'sidebar-1', type: 'sidebar' as const, label: '概览 / 用户 / 订单 / 内容 / 设置' }],
    }]),
    {
      id: 'kpi', title: 'KPI 指标', layout: 'row' as const,
      components: [
        { id: 'kpi-users', type: 'stat' as const, label: '总用户数' },
        { id: 'kpi-revenue', type: 'stat' as const, label: '今日营收' },
        { id: 'kpi-orders', type: 'stat' as const, label: '订单量' },
        { id: 'kpi-conversion', type: 'stat' as const, label: '转化率' },
      ],
    },
    {
      id: 'charts', title: '图表区', layout: isMobile(viewport) ? 'column' as const : 'row' as const,
      components: [
        { id: 'chart-trend', type: 'placeholder' as const, label: '趋势折线图', height: '200px' },
        { id: 'chart-pie', type: 'placeholder' as const, label: '分布饼图', height: '200px' },
      ],
    },
    {
      id: 'recent', title: '最近数据', layout: 'column' as const,
      components: [
        { id: 'data-table', type: 'table' as const, label: '最近订单 / 用户活动' },
      ],
    },
  ],
}];

const PAGE_TEMPLATE_MAP: Record<MockupPageTemplate, TemplateBuilder> = {
  'generic': (title, viewport) => [{
    name: 'main', title: `${title} — 主页面`, viewport,
    sections: [
      { id: 'nav', title: '导航', layout: 'column', components: [{ id: 'navbar-1', type: 'navbar', label: title }] },
      { id: 'hero', title: '首屏', layout: 'column', components: [
        { id: 'hero-title', type: 'card', label: `${title} 核心亮点` },
        { id: 'hero-cta', type: 'button', label: '查看方案' },
      ]},
      { id: 'content', title: '内容区', layout: 'grid', components: [
        { id: 'card-1', type: 'card', label: '核心服务', state: 'default' },
        { id: 'card-2', type: 'card', label: '方案亮点', state: 'default' },
        { id: 'card-3', type: 'card', label: '用户口碑', state: 'default' },
      ]},
      { id: 'data', title: '数据区', layout: 'row', components: [
        { id: 'stat-1', type: 'stat', label: '用户数' },
        { id: 'stat-2', type: 'stat', label: '转化率' },
        { id: 'stat-3', type: 'stat', label: '活跃度' },
      ]},
      { id: 'footer', title: '底部', layout: 'column', components: [{ id: 'footer-1', type: 'footer', label: '版权与帮助' }] },
    ],
  }],
  'login': loginTemplate,
  'register': registerTemplate,
  'forgot-password': forgotPasswordTemplate,
  'settings': settingsTemplate,
  'profile': profileTemplate,
  'product-list': productListTemplate,
  'product-detail': productDetailTemplate,
  'article-detail': articleDetailTemplate,
  'dashboard': dashboardTemplate,
};

export function buildPagesFromTemplate(
  template: MockupPageTemplate,
  title: string,
  viewport: MockupViewport,
): MockupPage[] {
  const builder = PAGE_TEMPLATE_MAP[template];
  return builder(title, viewport);
}

const TEMPLATE_KEYWORDS: Record<MockupPageTemplate, RegExp> = {
  'login': /login|登录|sign\s*in/i,
  'register': /register|注册|sign\s*up|创建账号/i,
  'forgot-password': /forgot|找回密码|reset\s*password|重置密码/i,
  'settings': /settings?|设置|偏好|preferences/i,
  'profile': /profile|个人中心|我的|用户中心|个人主页/i,
  'product-list': /product\s*list|商品列表|商品页|goods\s*list|商城/i,
  'product-detail': /product\s*detail|商品详情|goods\s*detail/i,
  'article-detail': /article|文章详情|博客|blog|内容详情|资讯/i,
  'dashboard': /dashboard|看板|数据面板|管理后台|admin|控制台/i,
  'generic': /./,
};

export function inferPageTemplate(input: string): MockupPageTemplate {
  for (const [template, regex] of Object.entries(TEMPLATE_KEYWORDS)) {
    if (template === 'generic') continue;
    if (regex.test(input)) return template as MockupPageTemplate;
  }
  return 'generic';
}
