"use client";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SupabaseFileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setUploading(true);
    setMessage("");
    const fileArr = Array.from(e.target.files);
    setFiles(fileArr);
    for (const file of fileArr) {
      const { error } = await supabase.storage.from("files").upload(file.name, file, { upsert: true });
      if (error) {
        setMessage(`업로드 실패: ${error.message}`);
        setUploading(false);
        return;
      }
    }
    setMessage("업로드 성공!");
    setUploading(false);
  }

  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-medium text-cyan-700 dark:text-cyan-200">Supabase 파일 업로드</label>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 focus:outline-none"
        onChange={handleUpload}
        disabled={uploading}
      />
      {message && <div className="mt-2 text-xs text-cyan-700 dark:text-cyan-200">{message}</div>}
    </div>
  );
}
