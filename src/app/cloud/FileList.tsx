export default function FileList() {
  // 실제 파일 리스트는 추후 API/Supabase 연동
  const files = [
    { name: "sample1.pdf", size: 123456 },
    { name: "image2.png", size: 45678 },
  ];
  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold mb-2 text-cyan-700 dark:text-cyan-200">파일 리스트</h2>
      <ul className="space-y-2">
        {files.map((file, idx) => (
          <li key={idx} className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-900 rounded px-3 py-2 text-sm">
            <span>{file.name}</span>
            <span className="text-xs text-gray-400">{Math.round(file.size / 1024)} KB</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-xs text-gray-400">(데모) 실제 파일 리스트/다운로드 연동은 추후 구현</div>
    </div>
  );
}
