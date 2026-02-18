"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SupabaseFileList() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      const { data, error } = await supabase.storage.from("files").list();
      if (!error && data) setFiles(data);
      setLoading(false);
    }
    fetchFiles();
  }, []);

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold mb-2 text-cyan-700 dark:text-cyan-200">Supabase 파일 리스트</h2>
      {loading ? <div className="text-xs text-gray-400">로딩 중...</div> : (
        <ul className="space-y-2">
          {files.map((file, idx) => (
            <li key={idx} className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-900 rounded px-3 py-2 text-sm">
              <span>{file.name}</span>
              <span className="text-xs text-gray-400">{Math.round(file.metadata?.size / 1024 || 0)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
