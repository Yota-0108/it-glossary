require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const termsPath = path.join(__dirname, 'public', 'terms.json');

async function generateMeaning(word, tags) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: 'あなたはIT用語の解説を行う専門家です。与えられたIT用語とタグに基づいて、簡潔でわかりやすい日本語の説明を2〜4文で生成してください。技術的な正確さを保ちながら、初学者にも理解できる表現を使ってください。説明文のみを返し、前置きや後書きは不要です。',
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: `用語: ${word}\nタグ: ${tags.join(', ')}\n\nこの用語の説明を生成してください。`
      }
    ]
  });
  return response.content[0].text.trim();
}

async function main() {
  const terms = JSON.parse(fs.readFileSync(termsPath, 'utf-8'));
  const toGenerate = terms.filter(t => !t.meaning);

  if (toGenerate.length === 0) {
    console.log('意味が未生成の用語はありません。');
    return;
  }

  console.log(`${toGenerate.length}件の意味を生成します...\n`);

  for (const term of terms) {
    if (term.meaning) continue;
    try {
      process.stdout.write(`生成中: ${term.word} ... `);
      term.meaning = await generateMeaning(term.word, term.tags);
      console.log('✓');
      fs.writeFileSync(termsPath, JSON.stringify(terms, null, 2), 'utf-8');
    } catch (err) {
      console.error(`✗ エラー: ${err.message}`);
    }
  }

  console.log('\n完了しました！');
}

main();
