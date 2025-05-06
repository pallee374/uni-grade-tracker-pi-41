
import { Course, Exam, Grade, GradeStats, LetterGrade } from "@/types";
import { getCourses, getExams, getGrades, getStudents } from "./dataStorage";

// Convert letter grade to numeric equivalent for calculations
export const letterToNumeric = (letter: LetterGrade): number => {
  const mapping: Record<LetterGrade, number> = {
    'A': 30,
    'B': 27,
    'C': 24,
    'D': 21,
    'E': 18,
    'F': 0
  };
  return mapping[letter];
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

// Calculate statistics for a course
export const getCourseStats = (courseId: string): GradeStats => {
  const exams = getExams().filter(e => e.courseId === courseId);
  const examIds = exams.map(e => e.id);
  const courseGrades = getGrades().filter(g => examIds.includes(g.examId));
  return calculateStats(courseGrades);
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
  const courses = getCourses();
  
  return grades.map(grade => {
    const exam = exams.find(e => e.id === grade.examId);
    const course = exam ? courses.find(c => c.id === exam.courseId) : undefined;
    
    return {
      ...grade,
      examType: exam?.tipo || '',
      examDate: exam?.data || '',
      courseName: course?.nome || ''
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
  const courses = getCourses();
  const exams = getExams();
  const grades = getGrades();
  
  // Overall statistics
  const overallStats = calculateStats(grades);
  
  // Course statistics
  const courseStats = courses.map(course => {
    const stats = getCourseStats(course.id);
    return {
      id: course.id,
      name: course.nome,
      stats
    };
  });
  
  // Recent exams
  const recentExams = [...exams]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5)
    .map(exam => {
      const course = courses.find(c => c.id === exam.courseId);
      const stats = getExamStats(exam.id);
      return {
        id: exam.id,
        date: exam.data,
        type: exam.tipo,
        courseName: course?.nome || '',
        stats
      };
    });
  
  return {
    counts: {
      students: students.length,
      courses: courses.length,
      exams: exams.length,
      grades: grades.length
    },
    overallStats,
    courseStats,
    recentExams
  };
};
