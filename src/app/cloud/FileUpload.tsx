"use client";
import { useRef, useState } from "react";

export default function FileUpload() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState<File[]>([]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-medium text-cyan-700 dark:text-cyan-200">파일 업로드</label>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 focus:outline-none"
        onChange={handleFiles}
      />
      <ul className="mt-4 space-y-2">
        {files.map((file, idx) => (
          <li key={idx} className="text-xs text-gray-700 dark:text-gray-200 bg-cyan-50 dark:bg-cyan-900 rounded px-2 py-1">
            {file.name} ({Math.round(file.size / 1024)} KB)
          </li>
        ))}
      </ul>
      <div className="mt-2 text-xs text-gray-400">(데모) 실제 업로드/다운로드 연동은 추후 구현</div>
    </div>
  );
}
