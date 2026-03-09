"use client";

// Opens current workspace files in StackBlitz via POST form submission
// StackBlitz SDK-free approach: POST to https://stackblitz.com/run

interface Props {
  files: Record<string, { content: string }>;
  projectName?: string;
}

export function StackBlitzButton({ files, projectName = "dalkak-app" }: Props) {
  const openInStackBlitz = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://stackblitz.com/run";
    form.target = "_blank";

    // Add project title
    const titleInput = document.createElement("input");
    titleInput.type = "hidden";
    titleInput.name = "project[title]";
    titleInput.value = projectName;
    form.appendChild(titleInput);

    // Add files
    Object.entries(files).forEach(([filename, { content }]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = `project[files][${filename}]`;
      input.value = content;
      form.appendChild(input);
    });

    // Add template
    const templateInput = document.createElement("input");
    templateInput.type = "hidden";
    templateInput.name = "project[template]";
    templateInput.value = "html";
    form.appendChild(templateInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <button
      onClick={openInStackBlitz}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 8,
        background: "#1269D3",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
      }}
      title="StackBlitz에서 열기"
    >
      ⚡ StackBlitz
    </button>
  );
}
