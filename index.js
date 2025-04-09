import express from 'express';
import KuroshiroModule from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const app = express();
app.use(express.json());

const Kuroshiro = KuroshiroModule.default;
const kuroshiro = new Kuroshiro();
const analyzer = new KuromojiAnalyzer();

let isReady = false;

function katakanaToHiragana(str) {
  return str.replace(/[\u30a1-\u30f6]/g, match =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );


function generateRuby(furiganaArray) {
  return furiganaArray
    .map(item => {
      if (!item.reading || item.word === item.reading) {
        return item.word;
      }
      return `<ruby>${item.word}<rt>${item.reading}</rt></ruby>`;
    })
    .join('');
}

  




async function initialize() {
  if (isReady) return;
  await kuroshiro.init(analyzer);
  isReady = true;
  console.log('✅ Kuroshiro initialized.');
}

await initialize();

app.post('/convert', async (req, res) => {
  const text = req.body.text;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const romaji = await kuroshiro.convert(text, { to: 'romaji', mode: 'spaced',  convertLongVowel: true });
    const kana = await kuroshiro.convert(text, { to: 'hiragana', mode: 'spaced' });
    const tokens = await analyzer._analyzer.tokenize(text);

    const furigana = tokens.map(token => {
      const rawReading = token.pronunciation || token.surface_form;
      const reading = katakanaToHiragana(rawReading);
      return {
        word: token.surface_form,
        reading
      };
    }).filter(item => item.word.trim());

    const ruby = generateRuby(furigana);

    res.json({
      input: text,
      romaji: romaji.replace(/\s/g, ''),
      kana: kana.replace(/\s/g, ''),
      furigana,
      ruby
    });
  } catch (err) {
    console.error('❌ Conversion error:', err);
    res.status(500).json({ error: 'Conversion failed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
