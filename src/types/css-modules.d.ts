// Allow importing .css files as modules (used by xterm and other libraries)
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "@xterm/xterm/css/xterm.css" {
  const content: unknown;
  export default content;
}
