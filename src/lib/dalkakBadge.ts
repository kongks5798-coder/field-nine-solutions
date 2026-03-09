// dalkakBadge.ts — Inject "Made with 딸깍" viral badge into published HTML
// Badge is fixed bottom-right, dismissible via localStorage, links back to fieldnine.io

export function injectDalkakBadge(html: string, slug: string): string {
  const badge = `
<style id="dalkak-badge-style">
#dalkak-badge-wrap *{box-sizing:border-box}
#dalkak-badge{position:fixed;bottom:14px;right:14px;z-index:2147483647;
  display:flex;align-items:center;gap:6px;padding:6px 10px 6px 8px;
  background:rgba(10,10,20,0.82);backdrop-filter:blur(10px);
  border:1px solid rgba(249,115,22,0.35);border-radius:20px;
  font-family:-apple-system,'Pretendard Variable','Pretendard',sans-serif;
  font-size:11px;font-weight:600;color:#f1f5f9;
  text-decoration:none;cursor:pointer;transition:all .2s ease;
  box-shadow:0 4px 16px rgba(0,0,0,0.4);}
#dalkak-badge:hover{background:rgba(249,115,22,0.18);border-color:rgba(249,115,22,0.6);color:#fff;}
#dalkak-badge-close{width:16px;height:16px;display:flex;align-items:center;
  justify-content:center;font-size:10px;color:#64748b;cursor:pointer;
  border-radius:50%;flex-shrink:0;margin-left:2px;line-height:1;}
#dalkak-badge-close:hover{color:#f97316;}
</style>
<div id="dalkak-badge-wrap">
<a id="dalkak-badge" href="https://fieldnine.io?utm_source=badge&utm_medium=app&utm_campaign=viral&ref=${slug}" target="_blank" rel="noopener noreferrer">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="flex-shrink:0">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  딸깍으로 만들었어요
  <span id="dalkak-badge-close" role="button" aria-label="배지 닫기"
    onclick="event.preventDefault();event.stopPropagation();try{localStorage.setItem('dalkak_badge_${slug}','1')}catch(e){}var w=document.getElementById('dalkak-badge-wrap');if(w)w.style.display='none'">&#x2715;</span>
</a>
</div>
<script>
(function(){try{if(localStorage.getItem('dalkak_badge_${slug}')){var w=document.getElementById('dalkak-badge-wrap');if(w)w.style.display='none';}}catch(e){}}());
</script>`;

  if (html.includes("</body>")) return html.replace("</body>", badge + "\n</body>");
  return html + badge;
}
