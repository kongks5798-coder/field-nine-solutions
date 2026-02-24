import * as Y from "yjs";

/**
 * Bind a Monaco editor instance to a Yjs Y.Text type with awareness (remote cursors).
 * Uses dynamic import of y-monaco to prevent SSR issues.
 *
 * @returns Object with destroy() method for cleanup
 */
export async function bindMonacoToYjs(
  editor: unknown, // monaco.editor.IStandaloneCodeEditor
  yText: Y.Text,
  awareness: unknown,
): Promise<{ destroy: () => void }> {
  // Dynamic import to avoid SSR bundling
  const { MonacoBinding } = await import("y-monaco");

  // y-monaco expects the editor instance and the Y.Text + awareness
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoEditor = editor as any;
  const model = monacoEditor.getModel();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const binding = new MonacoBinding(
    yText,
    model,
    new Set([monacoEditor]),
    awareness as any,
  );

  return {
    destroy: () => {
      binding.destroy();
    },
  };
}
