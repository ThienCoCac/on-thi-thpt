// Kiểu dữ liệu nội dung tĩnh. Không import thư viện để dùng được ở cả server và client.
export type ExamType = 'FULL_EXAM' | 'TOPIC_TEST' | 'MINI_TEST';
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_IN'
  | 'ESSAY';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type AnswerValue = string | string[] | null;

export interface ContentOption {
  key: string;
  text: string;
  imageUrl?: string | null;
}

export interface TopicContent {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface SubjectContent {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  topics: TopicContent[];
}

export interface ExamQuestionContent {
  id: string;
  partName: string;
  topic: string;
  type: QuestionType;
  content: string;
  options: ContentOption[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: Difficulty;
  score: number;
  tags: string[];
}

export interface ExamContent {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: string;
  type: ExamType;
  durationMinutes: number;
  totalScore: number;
  examYear: number | null;
  examCode: string | null;
  isFree: boolean;
  isFeatured: boolean;
  publishedAt: string;
  updatedAt: string;
  questions: ExamQuestionContent[];
}

export interface ArticleContent {
  id: string;
  title: string;
  slug: string;
  subject: string;
  relatedExam: string | null;
  coverImageUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  content: string;
}

export interface PostContent {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string | null;
  coverImageUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  content: string;
}

export interface SubjectRef {
  name: string;
  slug: string;
}

export interface AuthorRef {
  fullName: string;
}

export interface ExamSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: ExamType;
  durationMinutes: number;
  totalScore: number;
  examYear: number | null;
  examCode: string | null;
  isFree: boolean;
  isFeatured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  subject: SubjectRef;
  questionCount: number;
}

export interface ExamPart {
  name: string;
  questionCount: number;
  score: number;
}

export interface DifficultyBreakdownItem {
  key: Difficulty;
  count: number;
}

export interface TopicBreakdownItem {
  name: string;
  slug: string;
  count: number;
}

export interface ExamDetail extends ExamSummary {
  parts: ExamPart[];
  difficulties: DifficultyBreakdownItem[];
  topics: TopicBreakdownItem[];
  relatedArticles: ArticleSummary[];
}

export interface SubjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  examCount: number;
  topicCount: number;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: Date;
  updatedAt: Date;
  subject: SubjectRef | null;
  author: AuthorRef;
  relatedExam: { title: string; slug: string } | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  contentHtml: string;
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string | null;
  publishedAt: Date;
  updatedAt: Date;
  author: AuthorRef;
}

export interface PostDetail extends PostSummary {
  content: string;
  contentHtml: string;
}

export interface ContentStats {
  exams: number;
  questions: number;
  articles: number;
  posts: number;
}

// Dữ liệu chuyển sang trình duyệt cho luồng làm bài và chấm điểm tại máy.
export interface RunnerQuestion {
  id: string;
  order: number;
  partName: string;
  type: QuestionType;
  contentHtml: string;
  imageUrl: string | null;
  score: number;
  options: ContentOption[];
  correctAnswer: string | string[];
  explanationHtml: string;
  difficulty: Difficulty;
  topicName: string | null;
  tags: string[];
}

export interface RunnerExam {
  id: string;
  title: string;
  slug: string;
  subjectName: string;
  durationMinutes: number;
  totalScore: number;
  questions: RunnerQuestion[];
}

export interface GradedQuestion {
  question: RunnerQuestion;
  selectedAnswer: AnswerValue;
  isFlagged: boolean;
  isCorrect: boolean | null;
  scoreEarned: number;
}

export interface DifficultyResult {
  key: Difficulty;
  total: number;
  correct: number;
}

export interface GradeResult {
  score: number;
  maxScore: number;
  correctCount: number;
  questionCount: number;
  unansweredCount: number;
  accuracy: number;
  timeSpentSeconds: number;
  gradedQuestions: GradedQuestion[];
  difficulties: DifficultyResult[];
}
