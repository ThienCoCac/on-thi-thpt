import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LessonPlayer } from '@/components/roadmap/lesson-player';
import { getChemistryRoadmap } from '@/lib/chemistry-roadmap';
import { listExams } from '@/lib/content';
import { ROADMAP_PATH } from '@/lib/roadmap-progress';

export const dynamicParams = false;
export function generateStaticParams() {
  return getChemistryRoadmap().lessons.map((lesson) => ({ lesson: lesson.id }));
}
export function generateMetadata({ params }: { params: { lesson: string } }): Metadata {
  const lesson = getChemistryRoadmap().lessons.find((entry) => entry.id === params.lesson);
  if (!lesson) return {};
  return { title: `${lesson.title} | Lấy lại gốc Hóa`, description: lesson.goal, alternates: { canonical: `${ROADMAP_PATH}/${lesson.id}` } };
}
export default function ChemistryLessonPage({ params }: { params: { lesson: string } }) {
  const roadmap = getChemistryRoadmap();
  const index = roadmap.lessons.findIndex((lesson) => lesson.id === params.lesson);
  if (index < 0) notFound();
  const lesson = roadmap.lessons[index];
  const summary = (i: number) => {
    const entry = roadmap.lessons[i];
    return entry ? { id: entry.id, title: entry.title, stageId: entry.stageId, minutes: entry.minutes, goal: entry.goal } : null;
  };
  const exams = listExams().filter((exam) => lesson.examSlugs.includes(exam.slug)).map(({ slug, title }) => ({ slug, title }));
  return <div className="container py-8 md:py-12"><LessonPlayer
    key={lesson.id} lesson={lesson} index={index} total={roadmap.lessons.length}
    stageTitle={roadmap.stages.find((stage) => stage.id === lesson.stageId)!.title}
    previous={summary(index - 1)} next={summary(index + 1)} exams={exams}
  /></div>;
}
