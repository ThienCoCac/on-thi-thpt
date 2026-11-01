// Màu nhận diện từng môn. Lớp Tailwind phải viết đầy đủ để bộ sinh CSS giữ lại.
export interface SubjectTheme {
  chip: string;
  bar: string;
  hoverBorder: string;
  glow: string;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  toan: {
    chip: 'border-transparent bg-sky-100 text-sky-800',
    bar: 'bg-gradient-to-r from-sky-400 to-sky-600',
    hoverBorder: 'hover:border-sky-300',
    glow: 'bg-sky-500/10',
  },
  'ngu-van': {
    chip: 'border-transparent bg-rose-100 text-rose-800',
    bar: 'bg-gradient-to-r from-rose-400 to-rose-600',
    hoverBorder: 'hover:border-rose-300',
    glow: 'bg-rose-500/10',
  },
  'tieng-anh': {
    chip: 'border-transparent bg-indigo-100 text-indigo-800',
    bar: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
    hoverBorder: 'hover:border-indigo-300',
    glow: 'bg-indigo-500/10',
  },
  'kinh-te-va-phap-luat': {
    chip: 'border-transparent bg-amber-100 text-amber-900',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-600',
    hoverBorder: 'hover:border-amber-300',
    glow: 'bg-amber-500/10',
  },
  'lich-su': {
    chip: 'border-transparent bg-orange-100 text-orange-900',
    bar: 'bg-gradient-to-r from-orange-400 to-orange-600',
    hoverBorder: 'hover:border-orange-300',
    glow: 'bg-orange-500/10',
  },
  'danh-gia-nang-luc': {
    chip: 'border-transparent bg-purple-100 text-purple-800',
    bar: 'bg-gradient-to-r from-purple-400 to-purple-600',
    hoverBorder: 'hover:border-purple-300',
    glow: 'bg-purple-500/10',
  },
  'dia-li': {
    chip: 'border-transparent bg-teal-100 text-teal-800',
    bar: 'bg-gradient-to-r from-teal-400 to-teal-600',
    hoverBorder: 'hover:border-teal-300',
    glow: 'bg-teal-500/10',
  },
  'tin-hoc': {
    chip: 'border-transparent bg-emerald-100 text-emerald-800',
    bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
    glow: 'bg-emerald-500/10',
  },
};

const FALLBACK_THEME: SubjectTheme = {
  chip: 'border-transparent bg-secondary text-secondary-foreground',
  bar: 'bg-gradient-to-r from-slate-400 to-slate-600',
  hoverBorder: 'hover:border-slate-300',
  glow: 'bg-slate-500/10',
};

export function subjectTheme(slug: string): SubjectTheme {
  return SUBJECT_THEMES[slug] ?? FALLBACK_THEME;
}
