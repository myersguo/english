import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  BookOpen,
  Check,
  GraduationCap,
  Heart,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  Trophy
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { basicWords } from './data/basicWords';
import { categories } from './data/categories';
import { clearProgress, loadProgress, saveProgress } from './storage';
import type { BasicWord, CategoryId, QuizMode, StudyProgress } from './types';
import { cx, makeQuiz, normalizeAnswer, toggleInList, uniqueCategories } from './utils';
import './styles.css';

type ViewId = 'learn' | 'quiz' | 'review' | 'progress' | 'settings';

const navItems: Array<{ id: ViewId; label: string; icon: LucideIcon }> = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: Target },
  { id: 'review', label: 'Review', icon: Star },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

function App() {
  const [view, setView] = useState<ViewId>('learn');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [selectedId, setSelectedId] = useState(basicWords[0]?.id);
  const [progress, setProgress] = useState<StudyProgress>(() => loadProgress());
  const [quizMode, setQuizMode] = useState<QuizMode>('enToZh');
  const [quizSeed, setQuizSeed] = useState(Date.now());
  const [spelling, setSpelling] = useState('');
  const [quizResult, setQuizResult] = useState<'right' | 'wrong' | null>(null);

  useEffect(() => saveProgress(progress), [progress]);

  const counts = useMemo(() => uniqueCategories(basicWords), []);
  const filteredWords = useMemo(() => {
    const value = query.trim().toLowerCase();
    return basicWords.filter(word => {
      const categoryMatch = category === 'all' || word.category === category;
      const queryMatch = !value || [
        word.word,
        word.chineseMeaning,
        word.englishDefinition,
        word.examples.map(example => `${example.en} ${example.zh}`).join(' ')
      ].join(' ').toLowerCase().includes(value);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const selectedWord = basicWords.find(word => word.id === selectedId) ?? filteredWords[0] ?? basicWords[0];
  const favoriteWords = basicWords.filter(word => progress.favorites.includes(word.id));
  const learnedSet = new Set(progress.learned);
  const quiz = useMemo(() => makeQuiz(filteredWords.length >= 4 ? filteredWords : basicWords, quizMode, quizSeed), [filteredWords, quizMode, quizSeed]);
  const learnedRate = Math.round((progress.learned.length / basicWords.length) * 100);
  const quizAccuracy = progress.quizTotal ? Math.round((progress.quizCorrect / progress.quizTotal) * 100) : 0;

  function updateProgress(next: (current: StudyProgress) => StudyProgress) {
    setProgress(current => next(current));
  }

  function selectWord(word: BasicWord) {
    setSelectedId(word.id);
    updateProgress(current => ({ ...current, lastStudiedId: word.id }));
  }

  function markLearned(word: BasicWord) {
    updateProgress(current => ({
      ...current,
      learned: current.learned.includes(word.id) ? current.learned : [...current.learned, word.id],
      lastStudiedId: word.id
    }));
  }

  function toggleFavorite(word: BasicWord) {
    updateProgress(current => ({ ...current, favorites: toggleInList(current.favorites, word.id) }));
  }

  function submitQuiz(choice?: BasicWord) {
    const correct = quizMode === 'spelling'
      ? normalizeAnswer(spelling) === normalizeAnswer(quiz.answer.word)
      : choice?.id === quiz.answer.id;
    setQuizResult(correct ? 'right' : 'wrong');
    updateProgress(current => ({
      ...current,
      quizTotal: current.quizTotal + 1,
      quizCorrect: current.quizCorrect + (correct ? 1 : 0),
      learned: correct && !current.learned.includes(quiz.answer.id)
        ? [...current.learned, quiz.answer.id]
        : current.learned,
      lastStudiedId: quiz.answer.id
    }));
  }

  function nextQuiz() {
    setQuizSeed(Date.now());
    setSpelling('');
    setQuizResult(null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SE</div>
          <div>
            <h1>Simple English</h1>
            <p>Ogden 850</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={cx('nav-button', view === item.id && 'active')} onClick={() => setView(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-meter">
          <span>{learnedRate}% learned</span>
          <div><i style={{ width: `${learnedRate}%` }} /></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">British Academic Scientific International Commercial English</p>
            <h2>850 words, one quiet daily practice.</h2>
          </div>
          <div className="top-stats">
            <Stat label="Learned" value={`${progress.learned.length}/850`} />
            <Stat label="Accuracy" value={`${quizAccuracy}%`} />
          </div>
        </header>

        {view === 'learn' && (
          <section className="learn-board">
            <div className="toolbar">
              <label className="search-box">
                <Search size={17} />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索 word / 中文 / definition" />
              </label>
              <div className="category-row">
                {categories.map(item => (
                  <button
                    key={item.id}
                    className={cx('chip', category === item.id && 'active')}
                    data-tone={item.tone}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.label}
                    <span>{item.id === 'all' ? basicWords.length : counts[item.id as CategoryId]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="learn-summary">
              <span>{filteredWords.length} words</span>
              <span>{category === 'all' ? 'All categories' : categories.find(item => item.id === category)?.label}</span>
            </div>
            <div className="word-card-grid">
              {filteredWords.map((word, index) => (
                <WordStudyCard
                  key={word.id}
                  word={word}
                  index={index}
                  learned={progress.learned.includes(word.id)}
                  favorite={progress.favorites.includes(word.id)}
                  onLearned={() => markLearned(word)}
                  onFavorite={() => toggleFavorite(word)}
                />
              ))}
              {filteredWords.length === 0 && (
                <div className="empty-state">
                  <b>No words found</b>
                  <span>Try another search or category.</span>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'quiz' && (
          <section className="quiz-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Practice</p>
                <h3>测验当前筛选范围</h3>
              </div>
              <Segmented value={quizMode} onChange={mode => { setQuizMode(mode); nextQuiz(); }} />
            </div>
            <div className="quiz-card">
              <p className="quiz-type">{quiz.mode === 'enToZh' ? '选择中文释义' : quiz.mode === 'zhToEn' ? '选择英文单词' : '拼写英文单词'}</p>
              <h4>{quiz.mode === 'enToZh' ? quiz.answer.word : quiz.answer.chineseMeaning}</h4>
              {quiz.mode === 'spelling' ? (
                <div className="spelling-box">
                  <input value={spelling} onChange={event => setSpelling(event.target.value)} placeholder="Type the word" />
                  <button onClick={() => submitQuiz()} disabled={!spelling.trim() || quizResult !== null}>Check</button>
                </div>
              ) : (
                <div className="choice-grid">
                  {quiz.choices.map(choice => (
                    <button key={choice.id} disabled={quizResult !== null} onClick={() => submitQuiz(choice)}>
                      {quiz.mode === 'enToZh' ? choice.chineseMeaning : choice.word}
                    </button>
                  ))}
                </div>
              )}
              {quizResult && (
                <div className={cx('quiz-result', quizResult)}>
                  {quizResult === 'right' ? 'Correct' : `Answer: ${quiz.answer.word} · ${quiz.answer.chineseMeaning}`}
                  <button onClick={nextQuiz}>Next</button>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'review' && (
          <section className="review-grid">
            <PanelTitle icon={Heart} title="Favorites" text={`${favoriteWords.length} saved words`} />
            <div className="mini-card-grid">
              {(favoriteWords.length ? favoriteWords : basicWords.slice(0, 12)).map(word => (
                <button key={word.id} className="mini-card" onClick={() => { setView('learn'); selectWord(word); }}>
                  <b>{word.word}</b>
                  <span>{word.chineseMeaning}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {view === 'progress' && (
          <section className="progress-grid">
            <ProgressBlock icon={GraduationCap} label="Words learned" value={progress.learned.length} max={850} />
            <ProgressBlock icon={Trophy} label="Quiz accuracy" value={quizAccuracy} max={100} suffix="%" />
            <ProgressBlock icon={Sparkles} label="Favorites" value={progress.favorites.length} max={850} />
          </section>
        )}

        {view === 'settings' && (
          <section className="settings-panel">
            <PanelTitle icon={Settings} title="Settings" text="Local-only learning state" />
            <button className="danger-button" onClick={() => { clearProgress(); setProgress(loadProgress()); }}>
              <RotateCcw size={17} />
              Reset local progress
            </button>
            <p className="source-note">Word list: Wiktionary Basic English appendix. Chinese definitions: ECDICT MIT dataset when available, with local fallbacks.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat"><span>{label}</span><b>{value}</b></div>;
}

function WordStudyCard({ word, index, learned, favorite, onLearned, onFavorite }: {
  word: BasicWord;
  index: number;
  learned: boolean;
  favorite: boolean;
  onLearned: () => void;
  onFavorite: () => void;
}) {
  return (
    <article
      className={cx('study-card', learned && 'learned')}
      data-category={word.category}
      style={{ '--card-delay': `${Math.min(index % 18, 17) * 22}ms` } as React.CSSProperties}
    >
      <div className="study-card-top">
        <span>{word.categoryLabel}</span>
        <button className={cx('icon-button compact', favorite && 'active')} onClick={onFavorite} aria-label="Favorite">
          <Heart size={17} />
        </button>
      </div>
      <h3>{word.word}</h3>
      <p className="study-meaning">{shortMeaning(word.chineseMeaning, 4)}</p>
      <p className="study-definition">{word.englishDefinition}</p>
      <div className="study-example">
        <span>Example</span>
        <p>{word.examples[0].en}</p>
        <small>{word.examples[0].zh}</small>
      </div>
      <button className={cx('learn-toggle', learned && 'active')} onClick={onLearned}>
        <Check size={16} />
        {learned ? 'Learned' : 'Mark learned'}
      </button>
      {learned && <div className="learned-badge"><Check size={13} /> Done</div>}
    </article>
  );
}

function WordDetail({ word, learned, favorite, onLearned, onFavorite }: {
  word: BasicWord;
  learned: boolean;
  favorite: boolean;
  onLearned: () => void;
  onFavorite: () => void;
}) {
  const primaryMeaning = shortMeaning(word.chineseMeaning, 4);
  const extraMeaning = word.chineseMeaning.length > primaryMeaning.length ? word.chineseMeaning : '';

  return (
    <article className="detail-card" data-category={word.category}>
      <div className="detail-top">
        <span>{word.categoryLabel}</span>
        <button className={cx('icon-button', favorite && 'active')} onClick={onFavorite} aria-label="Favorite">
          <Heart size={20} />
        </button>
      </div>
      <h3>{word.word}</h3>
      <p className="zh-meaning">{primaryMeaning}</p>
      {extraMeaning && <p className="zh-extra">{extraMeaning}</p>}
      <p className="en-definition">{word.englishDefinition}</p>
      <div className="example-block">
        <span>Example</span>
        <p>{word.examples[0].en}</p>
        <small>{word.examples[0].zh}</small>
      </div>
      <div className="detail-actions">
        <button className="primary-button" onClick={onLearned}>
          <Check size={18} />
          {learned ? 'Learned' : 'Mark learned'}
        </button>
      </div>
    </article>
  );
}

function shortMeaning(value: string, limit: number) {
  const parts = value
    .split(/[；;,，]/)
    .map(part => part.trim())
    .filter(Boolean);
  const short = parts.slice(0, limit).join('，');
  return short || value;
}

function Segmented({ value, onChange }: { value: QuizMode; onChange: (value: QuizMode) => void }) {
  const options: Array<[QuizMode, string]> = [['enToZh', '英译中'], ['zhToEn', '中译英'], ['spelling', '拼写']];
  return (
    <div className="segmented">
      {options.map(([id, label]) => (
        <button key={id} className={value === id ? 'active' : ''} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

function PanelTitle({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="panel-heading">
      <div className="panel-icon"><Icon size={20} /></div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function ProgressBlock({ icon: Icon, label, value, max, suffix = '' }: {
  icon: LucideIcon;
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-block">
      <Icon size={22} />
      <span>{label}</span>
      <b>{value}{suffix}</b>
      <div><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
