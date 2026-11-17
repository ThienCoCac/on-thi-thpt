export interface RoadmapQuestion {
  id: string;
  lessonId: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface RoadmapLesson {
  id: string;
  title: string;
  stageId: string;
  minutes: number;
  goal: string;
  theory: string;
  example: { question: string; steps: string[] };
  pitfall: string;
  recall: string;
  examSlugs: string[];
  prerequisites: string[];
  questions: RoadmapQuestion[];
}

export interface RoadmapStage {
  id: string;
  title: string;
  level: string;
  description: string;
  target: string;
  lessonIds: string[];
  checkpointIds: string[];
}

export interface ChemistryRoadmap {
  version: number;
  title: string;
  lessons: RoadmapLesson[];
  stages: RoadmapStage[];
  diagnosticIds: string[];
  finalIds: string[];
  sources: { title: string; url: string; note: string }[];
}

export type RoadmapLessonSummary = Pick<RoadmapLesson, 'id' | 'title' | 'stageId' | 'minutes' | 'goal'>;
export type RoadmapCatalog = Omit<ChemistryRoadmap, 'lessons'> & {
  lessons: RoadmapLessonSummary[];
  questions: RoadmapQuestion[];
};
