# Dsign

Dsign 是一个直接运行在浏览器里的轻量原型标注工具。它通过书签代码注入浮动面板，可在网页或本地 HTML 上点选元素、记录修改意见与富文本设计说明、微调样式、进入审阅预览、导出带永久 D 标记的评审版，并将结构化标注复制给 AI。

在线使用：https://lvvvvvvvvvvvvvvvvv.github.io/ak47-prototype-annotator/

## 使用

1. 打开公开页面。
2. 将页面中的粉色 Dsign 按钮拖到浏览器书签栏。
3. 在需要审阅的页面点击该书签。
4. Mac 按住 `Command + Shift`，Windows 按住 `Ctrl + Alt` 并点击元素，选择直接微调、文字说明或设计说明。
5. 点击“预览”隐藏编辑界面，通过 `D1`、`D2` 等标记查看设计说明。
6. 点击下载按钮导出 `-Dsign评审版.html`；评审版内嵌净化后的设计说明和只读查看器，不依赖浏览器本地存储。

设计说明支持标题、粗体、斜体、删除线、链接、引用、无序列表、数字列表和字母列表；可使用 `Command/Ctrl + B`、`Command/Ctrl + I`、`Command/Ctrl + Shift + X`、`Command/Ctrl + Shift + 7/8`，也可在行首输入 `# `、`> `、`- `、`1. ` 或 `a. ` 快速转换格式。列表内按 `Tab` / `Shift + Tab` 调整层级，有序列表按 `1 / a / i` 循环。

## 浏览器插件

项目同时提供 Chrome / Edge Manifest V3 插件。正式上架后，用户可直接从 Chrome Web Store 或 Microsoft Edge Add-ons 搜索 Dsign，点击“添加到浏览器”完成安装，再固定工具栏图标即可在任意可注入网页开启或关闭标注。当前插件商店入口仍在准备中；`extension` 目录仅用于产品开发和商店发布前的内部验证。完整说明见 [`extension/README.md`](extension/README.md)。

标注数据仅保存在当前浏览器对应页面的 `localStorage` 中，不会上传到服务器。

## 本地打开

直接双击 `index.html` 或 `原型标注工具-黑白复刻.html` 即可，无需安装依赖。

## 素材声明

Dsign 页面使用用户提供的透明角色 PNG 作为 Logo 和粉色背景装饰；书签栏入口和注入后的浮层都统一显示为 `Dsign`。
