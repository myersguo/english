import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const WIKTIONARY_URL = 'https://en.wiktionary.org/w/index.php?title=Appendix:Basic_English_word_list&action=raw';
const ECDICT_URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv';

const SECTION_MAP = [
  ['Operations - 100 words', 'operations', 'Operations'],
  ['400 general words', 'general', 'General'],
  ['Things - 200 picturable words', 'picturable', 'Picturable'],
  ['Qualities - 100 descriptive words', 'qualities', 'Qualities'],
  ['Qualities - 50 opposites', 'opposites', 'Opposites']
];

const CATEGORY_CN = {
  operations: '操作词',
  general: '一般事物',
  picturable: '可画事物',
  qualities: '性质词',
  opposites: '对立性质'
};

const EXPECTED = {
  operations: 100,
  general: 400,
  picturable: 200,
  qualities: 100,
  opposites: 50
};

const curatedZh = {
  a: '一个；一类', the: '这；那；这个', I: '我', he: '他', you: '你；你们', who: '谁',
  be: '是；存在', do: '做；助动词', have: '有；已经', come: '来', get: '得到；变得',
  give: '给', go: '去', keep: '保持；保留', let: '让', make: '制造；使得', put: '放置',
  seem: '似乎', take: '拿；带走', say: '说', see: '看见；理解', send: '发送',
  may: '可以；可能', will: '将要；愿意', yes: '是的', no: '不；没有', not: '不',
  please: '请', and: '和；并且', or: '或者', but: '但是', because: '因为', if: '如果',
  about: '关于；大约', across: '穿过', after: '在……之后', against: '反对；靠着',
  among: '在……之中', at: '在', before: '在……之前', between: '在两者之间', by: '通过；在旁边',
  down: '向下', from: '从', in: '在……里面', off: '离开', on: '在……上面', over: '在……上方',
  through: '穿过；通过', to: '到；向', under: '在……下面', up: '向上', with: '和；带有',
  as: '作为；像', for: '为了；给', of: '属于；关于', till: '直到', than: '比',
  all: '全部', any: '任何', every: '每一个', other: '其他的', some: '一些', such: '这样的',
  that: '那个；那', this: '这个；这', though: '虽然', while: '当……时；然而',
  how: '怎样', when: '什么时候', where: '哪里', why: '为什么', again: '再次',
  ever: '曾经；任何时候', far: '远', forward: '向前', here: '这里', near: '附近',
  now: '现在', out: '出去；在外', still: '仍然', then: '然后；那时', there: '那里',
  together: '一起', well: '好地；健康的', almost: '几乎', enough: '足够', even: '甚至',
  little: '少量；小的', much: '许多', only: '仅仅', quite: '相当', so: '如此；所以',
  very: '非常', tomorrow: '明天', yesterday: '昨天', north: '北方', south: '南方',
  east: '东方', west: '西方'
};

const templates = {
  operations: word => operationExample(word),
  general: word => ({
    en: `We talked about ${articleFor(word)} ${word} today.`,
    zh: `我们今天谈到了 ${word}。`
  }),
  picturable: word => ({
    en: `I see the ${word} in the picture.`,
    zh: `我在图中看到这个 ${word}。`
  }),
  qualities: word => ({
    en: `This thing is ${word}.`,
    zh: `这个事物带有 ${word} 的性质。`
  }),
  opposites: word => ({
    en: `This answer is ${word}.`,
    zh: `这个答案是 ${word}。`
  })
};

const operationExamples = {
  come: ['Come here, please.', '请到这里来。'],
  get: ['Get the book from the table.', '从桌上拿那本书。'],
  give: ['Give me the answer.', '把答案给我。'],
  go: ['Go to school in the morning.', '早上去学校。'],
  keep: ['Keep this note with you.', '把这张便条留在身边。'],
  let: ['Let the child see the picture.', '让孩子看这幅图。'],
  make: ['Make a simple sentence.', '造一个简单句子。'],
  put: ['Put the cup on the table.', '把杯子放在桌上。'],
  seem: ['The answer may seem clear.', '答案可能看起来很清楚。'],
  take: ['Take the train to town.', '乘火车去城镇。'],
  be: ['Be ready before class.', '上课前准备好。'],
  do: ['Do the work now.', '现在做这件事。'],
  have: ['I have a good idea.', '我有一个好主意。'],
  say: ['Say the word again.', '再说一遍这个词。'],
  see: ['See the word on the page.', '看页面上的这个词。'],
  send: ['Send the letter today.', '今天寄出这封信。'],
  may: ['You may use this word.', '你可以使用这个词。'],
  will: ['I will learn this word.', '我将学习这个词。']
};

function operationExample(word) {
  const exact = operationExamples[word];
  if (exact) return { en: exact[0], zh: exact[1] };
  return {
    en: `Use ${word} in a short sentence.`,
    zh: `在短句中使用 ${word}。`
  };
}

function articleFor(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSection(wikitext, title, nextTitle) {
  const heading = new RegExp(`==\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*==`);
  const startMatch = wikitext.match(heading);
  const start = startMatch?.index ?? -1;
  if (start < 0) throw new Error(`Missing Wiktionary section: ${title}`);
  const nextHeading = nextTitle
    ? new RegExp(`==\\s*${nextTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*==`)
    : /==\s*Related links\s*==/;
  const nextMatch = wikitext.slice(start + startMatch[0].length).match(nextHeading);
  const end = nextMatch ? start + startMatch[0].length + nextMatch.index : wikitext.length;
  const section = wikitext.slice(start, end);
  return [...section.matchAll(/\[\[([^\]|#:]+)(?:\|[^\]]+)?\]\]/g)]
    .map(match => stripHtml(match[1]))
    .filter(word => /^[A-Za-z]+$/.test(word) || word === 'I')
    .filter((word, index, words) => words.indexOf(word) === index);
}

function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      fields.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  fields.push(value);
  return fields;
}

function cleanDefinition(value) {
  return (value || '')
    .split('\\n')
    .map(line => line.replace(/^[a-z]+\.\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 2)
    .join('; ');
}

function cleanTranslation(value) {
  return (value || '')
    .split('\\n')
    .map(line => line.replace(/^[a-z]+\.\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('；');
}

async function loadDictionary(targetWords) {
  const response = await fetch(ECDICT_URL);
  if (!response.ok) throw new Error(`Failed to fetch ECDICT: ${response.status}`);
  const csv = await response.text();
  const lines = csv.split(/\r?\n/);
  const header = parseCsvLine(lines.shift());
  const wordIndex = header.indexOf('word');
  const definitionIndex = header.indexOf('definition');
  const translationIndex = header.indexOf('translation');
  const wanted = new Set(targetWords.map(word => word.toLowerCase()));
  const dict = new Map();
  for (const line of lines) {
    if (!line) continue;
    const fields = parseCsvLine(line);
    const word = fields[wordIndex];
    if (!word || !wanted.has(word.toLowerCase()) || dict.has(word.toLowerCase())) continue;
    dict.set(word.toLowerCase(), {
      definition: cleanDefinition(fields[definitionIndex]),
      translation: cleanTranslation(fields[translationIndex])
    });
    if (dict.size === wanted.size) break;
  }
  return dict;
}

function buildFallbackDefinition(word, category) {
  if (category === 'operations') return `A Basic English operation or grammar word used to build sentences.`;
  if (category === 'picturable') return `A concrete thing that can be shown in a picture: ${word}.`;
  if (category === 'qualities' || category === 'opposites') return `A quality word used to describe a person, thing, or idea.`;
  return `A general Basic English word for everyday ideas and things.`;
}

function buildFallbackTranslation(word, category) {
  return curatedZh[word] || `${CATEGORY_CN[category]}：${word}`;
}

async function main() {
  const wikiResponse = await fetch(WIKTIONARY_URL);
  if (!wikiResponse.ok) throw new Error(`Failed to fetch Wiktionary: ${wikiResponse.status}`);
  const html = await wikiResponse.text();

  const grouped = {};
  for (let i = 0; i < SECTION_MAP.length; i += 1) {
    const [title, category] = SECTION_MAP[i];
    const nextTitle = SECTION_MAP[i + 1]?.[0];
    grouped[category] = parseSection(html, title, nextTitle);
    if (grouped[category].length !== EXPECTED[category]) {
      throw new Error(`${category} expected ${EXPECTED[category]}, got ${grouped[category].length}`);
    }
  }

  const allWords = Object.values(grouped).flat();
  const dict = await loadDictionary(allWords);
  const records = [];
  for (const [category, words] of Object.entries(grouped)) {
    for (const word of words) {
      const dictionary = dict.get(word.toLowerCase());
      const template = templates[category](word);
      records.push({
        id: `${category}-${word.toLowerCase()}`,
        word,
        category,
        categoryLabel: SECTION_MAP.find(([, id]) => id === category)[2],
        chineseMeaning: dictionary?.translation || buildFallbackTranslation(word, category),
        englishDefinition: dictionary?.definition || buildFallbackDefinition(word, category),
        examples: [template],
        tags: [CATEGORY_CN[category]]
      });
    }
  }

  const output = `import type { BasicWord } from '../types';\n\nexport const basicWords: BasicWord[] = ${JSON.stringify(records, null, 2)};\n`;
  const target = resolve('src/data/basicWords.ts');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output, 'utf8');
  console.log(`Generated ${records.length} words at ${target}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
