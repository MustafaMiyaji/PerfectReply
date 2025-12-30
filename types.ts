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

export interface ChatAnalysis {
  summary: string;
  tags: string[];
  partnerStyle: string;
}

export interface GeneratedReply {
  text: string;
  tone: string;
  reasoning: string;
}