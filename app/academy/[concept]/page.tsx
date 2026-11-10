"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONCEPTS } from "@/lib/engine/curriculum";
import { HINGLISH_TITLES } from "@/components/academy/concept-card";
import { useBull } from "@/lib/state/use-bull";
import { LessonSteps } from "@/components/academy/lesson-steps";
import { ConceptCheck } from "@/components/academy/concept-check";
import { AppliedMission } from "@/components/academy/applied-mission";
import { CheckModal } from "@/components/academy/check-modal";
import { EducationNote } from "@/components/ui/education-note";

interface PageProps {
  params: Promise<{ concept: string }>;
}

export default function ConceptLessonPage({ params }: PageProps) {
  const { concept: conceptSlug } = use(params);

  // Match by id (e.g. C1) or slug (e.g. pe)
  const concept = CONCEPTS.find(
    (c) =>
      c.id.toLowerCase() === conceptSlug.toLowerCase() ||
      c.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(conceptSlug.toLowerCase())
  );

  if (!concept) {
    notFound();
  }

  const { locale, logEvent } = useBull();
  const [modalOpen, setModalOpen] = useState(false);

  const title = locale === "hi-en" ? (HINGLISH_TITLES[concept.id] ?? concept.title) : concept.title;

  const handleLessonComplete = () => {
    logEvent({
      type: "lesson_completed",
      conceptId: concept.id,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500">
        <Link href="/academy" className="hover:underline">
          Academy
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-bold">{concept.id}</span>
        <span>/</span>
        <span className="truncate">{title}</span>
      </nav>

      {/* Concept Header */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Concept {concept.id} · Level 1
              </span>
              <span className="font-mono text-xs text-zinc-500">
                +20 XP on completion
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              {title}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            Take 3-Question Check (+10 XP) →
          </button>
        </div>
      </section>

      {/* 4-Step Lesson Workflow */}
      <section className="space-y-6">
        <LessonSteps
          concept={concept}
          conceptId={concept.id}
          onLessonComplete={handleLessonComplete}
          logEvent={logEvent}
        />
      </section>

      {/* Practice Knowledge Check */}
      <section className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Concept Knowledge Check
        </h2>
        <ConceptCheck
          conceptId={concept.id}
          logEvent={logEvent}
        />
      </section>

      {/* Applied Mission */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Applied Stock Mission (§8.4)
        </h2>
        <AppliedMission
          conceptId={concept.id}
          logEvent={logEvent}
        />
      </section>

      {/* Educational Notice */}
      <EducationNote conceptId={concept.id} />

      {/* Check Modal Dialog */}
      {modalOpen && (
        <CheckModal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          conceptId={concept.id}
          logEvent={logEvent}
        />
      )}
    </main>
  );
}
