
import { Exam, Grade, GradeStats, LetterGrade } from "@/types";
import { getExams, getGrades, getStudents } from "./dataStorage";

// Convert letter grade to numeric equivalent for calculations
export const letterToNumeric = (letter: LetterGrade): number => {
  const mapping: Record<LetterGrade, number> = {
    'A': 30,
    'B': 28.5, // average of 28-29
    'C': 26, // average of 25-27
    'D': 23, // average of 22-24
    'E': 19.5, // average of 18-21
    'F': 0
  };
  return mapping[letter];
};

// Convert numeric grade to letter equivalent
export const numericToLetter = (numeric: number): LetterGrade => {
  if (numeric >= 30) return 'A';
  if (numeric >= 28) return 'B';
  if (numeric >= 25) return 'C';
  if (numeric >= 22) return 'D';
  if (numeric >= 18) return 'E';
  return 'F';
};

// Format grade for display
export const formatGrade = (grade: Grade): string => {
  if (grade.votoLettera) {
    return grade.votoLettera;
  }
  if (grade.votoNumerico) {
    return grade.conLode ? `${grade.votoNumerico}L` : grade.votoNumerico.toString();
  }
  return '';
};

// Check if a grade indicates a passed exam
export const isPassing = (grade: Grade): boolean => {
  if (grade.votoLettera) {
    return grade.votoLettera !== 'F';
  }
  if (grade.votoNumerico) {
    return grade.votoNumerico >= 18;
  }
  return false;
};

// Calculate statistics for a set of grades
export const calculateStats = (grades: Grade[]): GradeStats => {
  if (grades.length === 0) {
    return {
      average: 0,
      passing: 0,
      failing: 0,
      passingPercentage: 0,
      distribution: {}
    };
  }
  
  let totalScore = 0;
  let passing = 0;
  let failing = 0;
  const distribution: Record<string, number> = {};
  
  grades.forEach(grade => {
    // Calculate numeric value for average
    let numericValue = 0;
    let gradeKey = '';
    
    if (grade.votoLettera) {
      numericValue = letterToNumeric(grade.votoLettera);
      gradeKey = grade.votoLettera;
    } else if (grade.votoNumerico) {
      numericValue = grade.votoNumerico;
      gradeKey = grade.conLode ? `${grade.votoNumerico}L` : grade.votoNumerico.toString();
    }
    
    totalScore += numericValue;
    
    // Count passing/failing
    if (isPassing(grade)) {
      passing++;
    } else {
      failing++;
    }
    
    // Update distribution
    distribution[gradeKey] = (distribution[gradeKey] || 0) + 1;
  });
  
  return {
    average: parseFloat((totalScore / grades.length).toFixed(2)),
    passing,
    failing,
    passingPercentage: parseFloat(((passing / grades.length) * 100).toFixed(2)),
    distribution
  };
};

// Calculate statistics for an exam
export const getExamStats = (examId: string): GradeStats => {
  const examGrades = getGrades().filter(g => g.examId === examId);
  return calculateStats(examGrades);
};

// Get all grades for a student
export const getStudentGrades = (matricola: string) => {
  const grades = getGrades().filter(g => g.matricola === matricola);
  const exams = getExams();
  
  return grades.map(grade => {
    const exam = exams.find(e => e.id === grade.examId);
    
    return {
      ...grade,
      examType: exam?.tipo || '',
      examDate: exam?.data || '',
      exam: exam || {}
    };
  });
};

// Calculate average grade for a student
export const getStudentAverage = (matricola: string): number => {
  const grades = getGrades().filter(g => g.matricola === matricola);
  
  if (grades.length === 0) {
    return 0;
  }
  
  let totalScore = 0;
  
  grades.forEach(grade => {
    if (grade.votoLettera) {
      totalScore += letterToNumeric(grade.votoLettera);
    } else if (grade.votoNumerico) {
      totalScore += grade.votoNumerico;
    }
  });
  
  return parseFloat((totalScore / grades.length).toFixed(2));
};

// Get analytics data for dashboard
export const getDashboardAnalytics = () => {
  const students = getStudents();
  const exams = getExams();
  const grades = getGrades();
  
  // Overall statistics
  const overallStats = calculateStats(grades);
  
  // Recent exams
  const recentExams = [...exams]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 10) // Show more exams for selection
    .map(exam => {
      const stats = getExamStats(exam.id);
      return {
        id: exam.id,
        date: exam.data,
        type: exam.tipo,
        stats
      };
    });
  
  return {
    counts: {
      students: students.length,
      exams: exams.length,
      grades: grades.length
    },
    overallStats,
    recentExams
  };
};
