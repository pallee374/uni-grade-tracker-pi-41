
import { Student, Exam, Grade, ExamType, LetterGrade } from "@/types";
import { numericToLetter } from "./gradeUtils";

// Local storage keys
const STUDENTS_KEY = "sgvu_students";
const EXAMS_KEY = "sgvu_exams";
const GRADES_KEY = "sgvu_grades";

// Helper to generate IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Local storage getters and setters
export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const setStudents = (students: Student[]): void => {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
};

export const getExams = (): Exam[] => {
  const data = localStorage.getItem(EXAMS_KEY);
  return data ? JSON.parse(data) : [];
};

export const setExams = (exams: Exam[]): void => {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
};

export const getGrades = (): Grade[] => {
  const data = localStorage.getItem(GRADES_KEY);
  return data ? JSON.parse(data) : [];
};

export const setGrades = (grades: Grade[]): void => {
  localStorage.setItem(GRADES_KEY, JSON.stringify(grades));
};

// CRUD Operations
// Students
export const addStudent = (student: Omit<Student, "id">): Student => {
  const newStudent = { ...student, id: generateId() };
  const students = getStudents();
  
  // Check for duplicate matricola
  if (students.some(s => s.matricola === student.matricola)) {
    throw new Error("Matricola già esistente");
  }
  
  setStudents([...students, newStudent]);
  return newStudent;
};

export const updateStudent = (student: Student): Student => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === student.id);
  
  if (index === -1) {
    throw new Error("Studente non trovato");
  }
  
  // Check for duplicate matricola (excluding current student)
  if (students.some(s => s.matricola === student.matricola && s.id !== student.id)) {
    throw new Error("Matricola già esistente");
  }
  
  students[index] = student;
  setStudents(students);
  return student;
};

export const deleteStudent = (id: string): void => {
  const students = getStudents();
  setStudents(students.filter(s => s.id !== id));
  
  // Also delete related grades
  const grades = getGrades();
  const student = students.find(s => s.id === id);
  if (student) {
    setGrades(grades.filter(g => g.matricola !== student.matricola));
  }
};

// Exams
export const addExam = (exam: Omit<Exam, "id">): Exam => {
  const newExam = { ...exam, id: generateId() };
  const exams = getExams();
  setExams([...exams, newExam]);
  return newExam;
};

export const updateExam = (exam: Exam): Exam => {
  const exams = getExams();
  const index = exams.findIndex(e => e.id === exam.id);
  
  if (index === -1) {
    throw new Error("Esame non trovato");
  }
  
  exams[index] = exam;
  setExams(exams);
  return exam;
};

export const deleteExam = (id: string): void => {
  const exams = getExams();
  setExams(exams.filter(e => e.id !== id));
  
  // Also delete related grades
  const grades = getGrades();
  setGrades(grades.filter(g => g.examId !== id));
};

// Grades
export const addGrade = (grade: Omit<Grade, "id">): Grade => {
  const newGrade = { ...grade, id: generateId() };
  const grades = getGrades();
  
  // Validate grade data
  validateGrade(newGrade);
  
  setGrades([...grades, newGrade]);
  return newGrade;
};

export const updateGrade = (grade: Grade): Grade => {
  const grades = getGrades();
  const index = grades.findIndex(g => g.id === grade.id);
  
  if (index === -1) {
    throw new Error("Voto non trovato");
  }
  
  // Validate grade data
  validateGrade(grade);
  
  grades[index] = grade;
  setGrades(grades);
  return grade;
};

export const deleteGrade = (id: string): void => {
  const grades = getGrades();
  setGrades(grades.filter(g => g.id !== id));
};

// Grade validation helper
const validateGrade = (grade: Grade): void => {
  // Get the exam to check its type
  const exams = getExams();
  const exam = exams.find(e => e.id === grade.examId);
  
  if (!exam) {
    throw new Error("Esame correlato non trovato");
  }

  // For intermediate exams, require letter grade
  if (exam.tipo === 'intermedio') {
    if (!grade.votoLettera) {
      throw new Error("Il voto in lettere è richiesto per gli esami intermedi");
    }
    
    // Clear any numeric grades
    delete grade.votoNumerico;
    delete grade.conLode;
    
    // Validate the letter grade
    const validLetterGrades: LetterGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (!validLetterGrades.includes(grade.votoLettera)) {
      throw new Error(`Voto in lettere non valido: ${grade.votoLettera}. Deve essere uno tra A, B, C, D, E, F`);
    }
  }
  
  // For complete exams, require numeric grade
  if (exam.tipo === 'completo') {
    if (grade.votoNumerico === undefined) {
      throw new Error("Il voto numerico è richiesto per gli esami completi");
    }
    
    // Clear any letter grades
    delete grade.votoLettera;
    
    if (grade.votoNumerico < 18 || grade.votoNumerico > 30) {
      throw new Error("Il voto numerico deve essere compreso tra 18 e 30");
    }
    
    // Lode is only allowed with 30
    if (grade.conLode && grade.votoNumerico !== 30) {
      throw new Error("La lode può essere assegnata solo con il voto 30");
    }
  }
  
  // Check if student exists
  const students = getStudents();
  const student = students.find(s => s.matricola === grade.matricola);
  if (!student) {
    throw new Error(`Studente con matricola ${grade.matricola} non trovato`);
  }
  
  // Check for duplicate grades for the same student and exam
  const existingGrade = getGrades().find(g => 
    g.matricola === grade.matricola && 
    g.examId === grade.examId &&
    g.id !== grade.id
  );
  
  if (existingGrade) {
    throw new Error(`Esiste già un voto per lo studente ${student.cognome} ${student.nome} in questo esame`);
  }
};

// Advanced queries
export const getStudentWithGrades = (matricola: string) => {
  const students = getStudents();
  const student = students.find(s => s.matricola === matricola);
  
  if (!student) {
    return null;
  }
  
  const grades = getGrades().filter(g => g.matricola === matricola);
  const exams = getExams();
  
  const gradesWithDetails = grades.map(grade => {
    const exam = exams.find(e => e.id === grade.examId);
    
    return {
      ...grade,
      exam: exam!
    };
  }).filter(g => g.exam); // Filter out any incomplete relations
  
  return {
    ...student,
    grades: gradesWithDetails
  };
};

// Import students from CSV formatted string
export const importStudentsFromCSV = (csv: string): Student[] => {
  const rows = csv.split('\n').filter(row => row.trim());
  
  // Skip header row if it exists
  const startIndex = rows[0].includes('matricola') || 
                    rows[0].includes('nome') || 
                    rows[0].includes('cognome') ? 1 : 0;
  
  const importedStudents: Student[] = [];
  const existingStudents = getStudents();
  const existingMatricole = new Set(existingStudents.map(s => s.matricola));
  
  for (let i = startIndex; i < rows.length; i++) {
    const columns = rows[i].split(',').map(col => col.trim());
    
    if (columns.length >= 3) {
      const matricola = columns[0];
      const nome = columns[1];
      const cognome = columns[2];
      
      // Skip if matricola already exists
      if (existingMatricole.has(matricola)) {
        continue;
      }
      
      // Basic validation
      if (matricola && nome && cognome) {
        const newStudent = addStudent({
          matricola,
          nome,
          cognome
        });
        
        importedStudents.push(newStudent);
        existingMatricole.add(matricola);
      }
    }
  }
  
  return importedStudents;
};

// Import grades from CSV
interface GradeImportOptions {
  csvData: string;
  examType: ExamType;
  examDate: string;
  isNewExam: boolean;
  hasHeaderRow: boolean;
}

interface ImportResult {
  imported: number;
  errors: number;
}

export const importGradesFromCSV = (options: GradeImportOptions): ImportResult => {
  const { csvData, examType, examDate, isNewExam, hasHeaderRow } = options;
  const rows = csvData.split('\n').filter(row => row.trim());
  
  if (rows.length === 0) {
    return { imported: 0, errors: 0 };
  }
  
  // Skip header row if indicated
  const startIndex = hasHeaderRow ? 1 : 0;
  
  // Find or create an exam
  let exam: Exam;
  
  if (isNewExam) {
    // Create new exam
    exam = addExam({
      tipo: examType,
      data: examDate
    });
  } else {
    // Find existing exam with same type
    const exams = getExams();
    const existingExam = exams
      .filter(e => e.tipo === examType)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]; // most recent
    
    if (existingExam) {
      exam = existingExam;
    } else {
      // If no existing exam found, create a new one
      exam = addExam({
        tipo: examType,
        data: examDate
      });
    }
  }
  
  // Process each row
  let imported = 0;
  let errors = 0;
  const students = getStudents();
  const matricoleSet = new Set(students.map(s => s.matricola));
  const existingGrades = getGrades().filter(g => g.examId === exam.id);
  const processedMatricoleSet = new Set<string>();
  
  for (let i = startIndex; i < rows.length; i++) {
    try {
      const columns = rows[i].split(',').map(col => col.trim());
      
      if (columns.length < 2) {
        errors++;
        continue;
      }
      
      const matricola = columns[0];
      
      // Check if student exists
      if (!matricoleSet.has(matricola)) {
        errors++;
        continue;
      }
      
      // Avoid duplicate imports for the same student
      if (processedMatricoleSet.has(matricola)) {
        errors++;
        continue;
      }
      
      // Check if student already has a grade for this exam
      if (existingGrades.some(g => g.matricola === matricola)) {
        errors++;
        continue;
      }
      
      processedMatricoleSet.add(matricola);
      
      if (examType === "intermedio") {
        // For letter grade exams
        let letterGrade: LetterGrade;
        
        // Check if the input is a valid letter grade
        const validLetterGrades: LetterGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
        if (validLetterGrades.includes(columns[1].toUpperCase() as LetterGrade)) {
          letterGrade = columns[1].toUpperCase() as LetterGrade;
        } else {
          // Try to convert a numeric input to letter grade if possible
          const numericValue = parseFloat(columns[1]);
          if (!isNaN(numericValue)) {
            letterGrade = numericToLetter(numericValue);
          } else {
            errors++;
            continue;
          }
        }
        
        // Add grade
        addGrade({
          matricola,
          examId: exam.id,
          votoLettera: letterGrade
        });
        imported++;
      } else {
        // For numeric grade exams
        const votoNumerico = parseInt(columns[1]);
        
        if (isNaN(votoNumerico) || votoNumerico < 18 || votoNumerico > 30) {
          errors++;
          continue;
        }
        
        // Check for lode (optional)
        const conLode = columns.length > 2 ? 
          columns[2].toLowerCase() === 'true' || columns[2] === '1' : false;
        
        // Only allow lode with 30
        if (conLode && votoNumerico !== 30) {
          errors++;
          continue;
        }
        
        // Add grade
        addGrade({
          matricola,
          examId: exam.id,
          votoNumerico,
          conLode
        });
        imported++;
      }
    } catch (error) {
      errors++;
    }
  }
  
  return { imported, errors };
};

// Initialize with sample data if empty
export const initializeSampleData = () => {
  if (getStudents().length === 0) {
    // Sample students
    const students = [
      { matricola: "0612710901", nome: "Marco", cognome: "Rossi" },
      { matricola: "0612710902", nome: "Lucia", cognome: "Bianchi" },
      { matricola: "0612710903", nome: "Giovanni", cognome: "Verdi" },
    ];
    
    students.forEach(student => {
      try { addStudent(student); } catch(e) { /* ignore */ }
    });
    
    // Add sample exams
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    
    const interExam = addExam({
      tipo: 'intermedio',
      data: lastMonth.toISOString().split('T')[0]
    });
    
    const complExam = addExam({
      tipo: 'completo',
      data: now.toISOString().split('T')[0]
    });
    
    // Add letter grades
    students.forEach((student, index) => {
      try {
        const letterGrades: LetterGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
        addGrade({
          matricola: student.matricola,
          examId: interExam.id,
          votoLettera: letterGrades[index % letterGrades.length]
        });
      } catch(e) { /* ignore */ }
    });
    
    // Add numeric grades
    students.forEach((student, index) => {
      try {
        const baseGrade = 18 + (index * 3);
        const grade = Math.min(baseGrade, 30);
        const conLode = grade === 30 && index % 3 === 0;
        
        addGrade({
          matricola: student.matricola,
          examId: complExam.id,
          votoNumerico: grade,
          conLode
        });
      } catch(e) { /* ignore */ }
    });
  }
};
