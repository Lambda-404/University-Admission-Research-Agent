export interface ResearchPreset {
  university: string;
  major: string;
  description: string;
  flag?: string;
}

export const POPULAR_PRESETS: ResearchPreset[] = [
  {
    university: "University of Manchester",
    major: "Computer Science BSc",
    description: "Top UK CS program, checks A*AA A Level & 7.0 IELTS",
  },
  {
    university: "University of Oxford",
    major: "Computer Science BA",
    description: "Rigorous entry requirements including MAT & A*AA A Level",
  },
  {
    university: "Imperial College London",
    major: "Computing BEng",
    description: "STEM specialist university with high A Level & STEP/IELTS requirements",
  },
  {
    university: "University of Cambridge",
    major: "Computer Science BA",
    description: "Preeminent CS course with TMUA admission test & A*AA requirements",
  },
  {
    university: "UCL (University College London)",
    major: "Computer Science BSc",
    description: "London research institution checking International A Level & IELTS Academic",
  },
  {
    university: "University of Edinburgh",
    major: "Computer Science BSc",
    description: "Leading Scottish university with international A Level & English standards",
  },
];
