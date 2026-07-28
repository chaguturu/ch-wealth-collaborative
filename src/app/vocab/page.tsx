import type { Metadata } from "next";
import VocabApp from "@/components/vocab/VocabApp";

export const metadata: Metadata = {
  title: "ISEE Vocabulary",
  description: "Flashcards, synonym drills, and sentence completion for ISEE vocabulary",
};

export default function VocabPage() {
  return <VocabApp />;
}
