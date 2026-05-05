/**
 * Gemini APIとの通信を担当するモジュール
 */

/**
 * ユーザーのAPIキーを利用して利用可能なモデル一覧を取得する
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Array<{name: string, displayName: string}>>}
 */
export async function fetchAvailableModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    const supportedModels = data.models.filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
    );
    return supportedModels.map(m => ({
      name: m.name, // e.g., "models/gemini-1.5-flash"
      displayName: m.displayName || m.name
    }));
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return null;
  }
}

/**
 * ユーザーの成績データからAIチューターのアドバイスを取得する
 * @param {string} apiKey - Gemini API Key
 * @param {string} modelName - 選択されたモデル名 (models/...)
 * @param {string} courseName - コース名 (SAA-C03など)
 * @param {Array} stats - 分野別の成績データ
 * @returns {Promise<string|null>} - AIからのアドバイステキスト
 */
export async function getAiAdvice(apiKey, modelName, courseName, stats) {
  const modelUrl = modelName || 'models/gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelUrl}:generateContent?key=${apiKey}`;
  
  // 統計データを文字列化してプロンプトに埋め込めるようにする
  const statsText = stats.map(s => `- ${s.categoryId}: 正答率 ${s.rate}% (${s.correct}/${s.answered}問)`).join('\n');
  
  const prompt = `
あなたはプロフェッショナルなAWS認定インストラクターです。
生徒が「${courseName}」の試験に向けた模擬テストを実施しました。以下の分野別成績データを見て、生徒の弱点を分析してください。
最も正答率が低い分野、またはまだ学習が不足している分野について、優しく励ましながら、**具体的なアドバイスを100〜150文字程度で**提供してください。
（例：「〇〇の理解が少し不足していますね。本番ではAとBの違いがよく問われるので、復習しておきましょう！」など）

【生徒の成績データ】
${statsText}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Failed to get AI advice:', error);
    return null;
  }
}

/**
 * 弱点分野に基づき、指定された数のオリジナル問題を生成する
 * @param {string} apiKey - Gemini API Key
 * @param {string} modelName - 選択されたモデル名
 * @param {string} courseName - コース名 (SAA-C03など)
 * @param {string} targetCategory - 重点補強するカテゴリID
 * @param {number} count - 生成する問題数
 * @returns {Promise<Array|null>} - パース済みの問題オブジェクト配列
 */
export async function generateCustomQuestions(apiKey, modelName, courseName, targetCategory, count = 5) {
  const modelUrl = modelName || 'models/gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelUrl}:generateContent?key=${apiKey}`;
  
  const prompt = `
あなたはプロのAWS問題作成者です。生徒が「${courseName}」の試験対策をしており、特に「${targetCategory}」分野の理解が不足しています。
この分野の弱点補強に特化した、本番同等の難易度を持つオリジナル模擬問題を${count}問作成してください。

【厳密な出力フォーマット】
以下のJSON配列フォーマットのみを出力してください。マークダウン（\`\`\`json など）や説明文は一切含めず、純粋なJSONテキストのみを返してください。

[
  {
    "id": "ai-gen-<一意な文字列>",
    "category": "${targetCategory}",
    "difficulty": 3,
    "question": "具体的なシナリオベースの問題文...",
    "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "answerIndex": 0,
    "explanation": "なぜその選択肢が正解なのか、なぜ他が間違っているのかの詳細な解説..."
  }
]
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8, // 創造性を少し持たせる
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    // AIの出力にマークダウンブロックが含まれていた場合のクリーニング
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return null;
  }
}
