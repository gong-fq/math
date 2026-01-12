import fetch from "node-fetch";

/* ---------- 题型识别 ---------- */
function detectTopic(text) {
  if (/矩阵|行列式|特征值|线性相关/.test(text)) return "linear-algebra";
  if (/概率|随机变量|分布|期望|方差/.test(text)) return "probability";
  if (/极限|导数|积分|连续/.test(text)) return "calculus";
  if (/方程|不等式|多项式/.test(text)) return "algebra";
  return "general";
}

/* ---------- 系统 Prompt ---------- */
function buildSystemPrompt(topic, level) {
  const topicHint = {
    "linear-algebra": "这是线性代数问题，注意矩阵、行列式、向量空间概念。",
    "probability": "这是概率问题，注意事件与随机变量的区分。",
    "calculus": "这是微积分问题，注意定义域与极限逻辑。",
    "algebra": "这是代数问题，注意等价变形。",
    "general": "这是一般数学问题。"
  }[topic];

  const levelHint = {
    hint: "只给解题思路提示，不给完整解答。",
    step: "分步骤讲解，但省略部分计算细节。",
    full: "完整、规范地讲解每一步。"
  }[level];

  return `
你是一名严谨、循循善诱的数学助教。

【教学原则】
1. 不急于给答案，先讲思路
2. 分步骤编号（①②③…）
3. 数学排版规范：
   - 矩阵用 pmatrix
   - 行列式用 vmatrix
   - 推导过程使用 LaTeX
4. 语言简洁、清楚，像真实老师

【教学模式】
${levelHint}

【题型提示】
${topicHint}

【结尾要求】
最后用「方法小结」总结本题核心思想。
`;
}

export default async (req) => {
  try {
    const { message, level = "step" } = JSON.parse(req.body);

    const topic = detectTopic(message);
    const systemPrompt = buildSystemPrompt(topic, level);

    const response = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.choices?.[0]?.message?.content || "未能生成回答"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
