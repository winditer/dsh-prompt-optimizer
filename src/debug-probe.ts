/** 可见调试探针：点击/流程计数直接显示在设置面板（不依赖 console/日志，用于桌面环境定位）。 */
export const probe = {
  clicks: 0,
  lastClickAt: '',
  lastStep: '',
  lastError: '',
};
