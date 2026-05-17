/** 将题库中的相对路径转为可部署的完整 URL（兼容 GitHub Pages 的 base 路径） */
export function panoramaSrc(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${clean}`;
}
