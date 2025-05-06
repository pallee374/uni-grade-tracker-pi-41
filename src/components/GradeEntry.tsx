
import { useState, useEffect } from "react";
import { 
  Course, 
  Exam, 
  ExamType, 
  Grade, 
  LetterGrade, 
  Student 
} from "@/types";
import { 
  getCourses, 
  getExams, 
  getStudents,
  addExam,
  addGrade
} from "@/utils/dataStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface GradeEntryProps {
  onComplete: () => void;
}

interface FormData {
  courseId: string;
  examType: ExamType;
  examDate: string;
  studentId: string;
  letterGrade?: string;
  numericGrade?: number;
  conLode?: boolean;
}

const GradeEntry = ({ onComplete }: GradeEntryProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newExam, setNewExam] = useState(true);
  
  const form = useForm<FormData>({
    defaultValues: {
      examDate: format(new Date(), 'yyyy-MM-dd'),
      examType: 'completo',
      conLode: false
    }
  });
  
  const { watch, setValue } = form;
  
  const watchCourseId = watch('courseId');
  const watchExamType = watch('examType');
  
  useEffect(() => {
    // Load courses and students
    setCourses(getCourses());
    setStudents(getStudents());
    setExams(getExams());
  }, []);
  
  // Update selected course when courseId changes
  useEffect(() => {
    if (watchCourseId) {
      const course = courses.find(c => c.id === watchCourseId) || null;
      setSelectedCourse(course);
      
      // Imposta il tipo di esame basato sul tipo di valutazione del corso
      if (course) {
        const newExamType = course.haIntermedio ? 'intermedio' : 'completo';
        setValue('examType', newExamType);
      }
    } else {
      setSelectedCourse(null);
    }
  }, [watchCourseId, courses, setValue]);
  
  // Filter exams based on selected course
  const filteredExams = watchCourseId 
    ? exams.filter(e => e.courseId === watchCourseId)
    : [];
  
  const onSubmit = async (data: FormData) => {
    try {
      // Find the selected student
      const student = students.find(s => s.id === data.studentId);
      if (!student) {
        toast.error("Studente non trovato");
        return;
      }
      
      let examId = !newExam && filteredExams.length > 0
        ? filteredExams[0].id
        : '';
      
      // Create new exam if needed
      if (newExam || !examId) {
        const examType = selectedCourse?.haIntermedio ? 'intermedio' : 'completo';
        const newExamData = await addExam({
          courseId: data.courseId,
          tipo: examType,
          data: data.examDate
        });
        examId = newExamData.id;
      }
      
      // Create the grade
      const gradeData: Partial<Grade> = {
        matricola: student.matricola,
        examId
      };
      
      // Add the appropriate grade type based on course settings
      if (selectedCourse?.haIntermedio) {
        gradeData.votoLettera = data.letterGrade as LetterGrade;
      } else {
        gradeData.votoNumerico = data.numericGrade;
        gradeData.conLode = data.conLode;
      }
      
      // Save the grade
      addGrade(gradeData as Omit<Grade, "id">);
      toast.success("Voto salvato con successo");
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Corso</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un corso" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="examDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data dell'esame</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {filteredExams.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="newExam"
                checked={newExam}
                onCheckedChange={(checked) => setNewExam(!!checked)}
              />
              <Label htmlFor="newExam">Crea nuovo esame</Label>
              {!newExam && (
                <div className="text-sm text-muted-foreground ml-4">
                  Verrà usato l'esame più recente
                </div>
              )}
            </div>
          )}

          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Studente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona uno studente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.matricola} - {student.cognome} {student.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grade fields based on course type */}
          {selectedCourse?.haIntermedio ? (
            <FormField
              control={form.control}
              name="letterGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voto (lettera)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un voto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A (Eccellente)</SelectItem>
                      <SelectItem value="B">B (Buono)</SelectItem>
                      <SelectItem value="C">C (Discreto)</SelectItem>
                      <SelectItem value="D">D (Sufficiente)</SelectItem>
                      <SelectItem value="E">E (Appena sufficiente)</SelectItem>
                      <SelectItem value="F">F (Insufficiente)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="numericGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voto (numerico)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={18} 
                        max={30} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)} 
                      />
                    </FormControl>
                    <FormDescription>Il voto deve essere compreso tra 18 e 30</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conLode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        disabled={form.watch('numericGrade') !== 30}
                      />
                    </FormControl>
                    <FormLabel>Con lode</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
          >
            Annulla
          </Button>
          <Button type="submit">
            Salva voto
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GradeEntry;
