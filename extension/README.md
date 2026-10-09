# Dsign 浏览器插件

这是 Dsign 的 Chrome / Edge Manifest V3 版本。正式发布后，用户可从 Chrome Web Store 或 Microsoft Edge Add-ons 安装 Dsign，点击浏览器工具栏里的 Dsign 图标，即可在当前网页开启或关闭标注浮层；再次点击会切换状态。

## 面向用户的安装方式

上架后，用户只需要：

1. 打开 Chrome Web Store 或 Microsoft Edge Add-ons。
2. 搜索 `Dsign`，进入官方插件页。
3. 点击“添加到浏览器”，确认安装。
4. 将 Dsign 固定到浏览器工具栏，然后在要评审的网页点击图标。

当前商店页面尚未开放。下面的开发者安装步骤仅用于发布前内部验证，不是面向普通用户的正式安装入口。

## 开发者验证（非用户安装方式）

1. 打开 Chrome 或 Edge 的扩展管理页：`chrome://extensions` 或 `edge://extensions`。
2. 打开右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择当前 `extension` 文件夹。
5. 固定 Dsign 图标，在要审阅的页面点击它。

首次访问 `file://` 本地 HTML 页面时，需要在扩展管理页打开“允许访问文件网址”。浏览器内部页面、扩展商店页面和部分受保护页面不允许注入，这是浏览器的安全限制。

## 运行时来源

`content.js` 由根目录的 `index.html` 内嵌 `annotatorSource` 生成。源码改动后，在项目根目录执行：

```sh
./scripts/build-extension.sh
```

再回到扩展管理页点击刷新按钮即可加载最新版本。
