export default {
  async fetch(request, env) {
    const allowedOrigin = "https://utasoo.github.io";
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (origin !== allowedOrigin) return json({ error: "허용되지 않은 사이트에서 온 요청이에요." }, 403);
    if (request.method !== "POST") return json({ error: "POST 요청만 사용할 수 있어요." }, 405);

    try {
      const body = await request.json();
      const story = String(body.story || "").trim().slice(0, 10000);
      const instruction = String(body.instruction || "앞선 이야기와 문체를 유지하며 자연스럽게 다음 장면을 이어 써 줘.").trim().slice(0, 800);

      if (!story) return json({ error: "먼저 이야기 내용을 입력해 주세요." }, 400);

      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "너는 한국어 소설을 함께 쓰는 창작 파트너야. 사용자가 쓴 설정과 문체를 존중하고, 기존 내용을 반복하지 말고 자연스럽게 다음 장면을 이어 써. 결말을 서둘러 내지 말고 1~3문단 정도로 작성해."
          },
          {
            role: "user",
            content: "다음 이야기를 읽고 이어 써 줘.\n\n" + story + "\n\n추가 요청: " + instruction
          }
        ],
        max_tokens: 450
      });

      return json({ success: true, continuation: result.response || "" });
    } catch (error) {
      return json({ error: "AI 응답을 만들지 못했어요. 잠시 후 다시 시도해 주세요." }, 500);
    }
  }
};