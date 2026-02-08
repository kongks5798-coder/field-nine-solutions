// Stay22 API 테스트
const API_KEY = "stay22_9c0c35cf-c212-454f-a789-5379a1305202";
const AFFILIATE_ID = "fieldnine";

console.log("=== Stay22 API 테스트 ===\n");

// 테스트: 도쿄 호텔 검색
const params = new URLSearchParams({
  address: "Tokyo, Japan",
  checkin: "2026-02-10",
  checkout: "2026-02-12",
  guests: "2",
  rooms: "1"
});

const url = "https://www.stay22.com/api/v2/affiliate/search?" + params.toString();

console.log("검색: 도쿄, 2026-02-10 ~ 02-12, 2명\n");

try {
  const res = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json"
    }
  });
  
  console.log("응답 상태:", res.status, res.statusText);
  
  if (res.ok) {
    const data = await res.json();
    console.log("\n✅ Stay22 API 연결 성공!");
    console.log("호텔 수:", data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      console.log("\n샘플 호텔:");
      data.results.slice(0, 3).forEach((h, i) => {
        console.log("[" + (i+1) + "] " + h.name);
        console.log("    가격: $" + h.price);
        console.log("    평점: " + h.rating);
      });
    }
  } else {
    const text = await res.text();
    console.log("응답:", text);
  }
} catch (err) {
  console.log("❌ 에러:", err.message);
}

// Affiliate 링크 생성 테스트
console.log("\n=== Affiliate 링크 생성 ===");
const affiliateLink = "https://www.stay22.com/allez/search?address=Tokyo%2CJapan&checkin=2026-02-10&checkout=2026-02-12&aid=" + AFFILIATE_ID;
console.log("링크:", affiliateLink);
