
export type Student = {
  id: string;
  matricola: string;
  nome: string;
  cognome: string;
};

export type Course = {
  id: string;
  nome: string;
  haIntermedio: boolean;
};

export type ExamType = 'intermedio' | 'completo';

export type Exam = {
  id: string;
  courseId: string;
  tipo: ExamType;
  data: string; // ISO date string
};

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type Grade = {
  id: string;
  matricola: string;
  examId: string;
  votoLettera?: LetterGrade;
  votoNumerico?: number; // 18-30
  conLode?: boolean;
};

export type StudentWithGrades = Student & {
  grades: (Grade & { exam: Exam; course: Course })[];
};

export type GradeStats = {
  average: number;
  passing: number;
  failing: number;
  passingPercentage: number;
  distribution: Record<string, number>; // key is grade value (A, B, 18, 19, etc.)
};
