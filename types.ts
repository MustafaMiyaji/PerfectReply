
export enum VibeType {
  Spark = 'Spark',     // Flirty
  Repair = 'Repair',   // Apology
  Cool = 'Cool',       // Casual
  Deep = 'Deep',       // Romantic
  Humorous = 'Humorous', // Funny
  Empathetic = 'Empathetic', // Caring
  Custom = 'Custom' // User defined
}

export interface CustomVibeConfig {
  label: string;
  description: string;
  color: string;
  iconName?: string;
}

export interface FileWithId {
  id: string;
  file: File;
}

export interface PersonalityMetrics {
  empathy: number;
  aggression: number;
  humor: number;
  vulnerability: number;
  clarity: number;
}

export interface ChatAnalysis {
  summary: string;
  tags: string[];
  partnerStyle: string;
  redFlags: string[]; // List of potential manipulation/concern signs
  personalityMetrics: PersonalityMetrics; // For Radar Chart
}

export interface GeneratedReply {
  text: string;
  tone: string;
  reasoning: string;
}

export interface IcebreakerSuggestion {
  category: 'Observation' | 'Playful' | 'Direct' | 'Creative';
  text: string;
  whyItWorks: string;
}
