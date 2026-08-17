// dsh-prompt-optimizer —— 节点侧（server half）最小模块。
// 入口 patch（- id: prompt-optimizer, name: dsh-prompt-optimizer）经 loader 的
// tree.import(options.name) 解析 exports["."]；本文件兜底让 fiber 健康激活。
// 客户端功能全部在 dist/client.js（exports["./client"]）。

export const name = 'dsh-prompt-optimizer';

export function apply() {
  // 纯 client 插件：节点侧无操作
}