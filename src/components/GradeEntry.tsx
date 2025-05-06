
import { useState, useEffect } from "react";
import { 
  Exam, 
  ExamType, 
  Grade, 
  LetterGrade, 
  Student 
} from "@/types";
import { 
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
  examId: string;
  examDate: string;
  studentId: string;
  letterGrade?: string;
  numericGrade?: number;
  conLode?: boolean;
  useLetterGrades: boolean;
}

const GradeEntry = ({ onComplete }: GradeEntryProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [newExam, setNewExam] = useState(true);
  const [useLetterGrades, setUseLetterGrades] = useState(false);
  
  const form = useForm<FormData>({
    defaultValues: {
      examDate: format(new Date(), 'yyyy-MM-dd'),
      useLetterGrades: false,
      conLode: false
    }
  });
  
  const { watch, setValue } = form;
  
  const watchExamId = watch('examId');
  const watchUseLetterGrades = watch('useLetterGrades');
  
  useEffect(() => {
    // Load students and exams
    setStudents(getStudents());
    setExams(getExams());
  }, []);

  useEffect(() => {
    setUseLetterGrades(watchUseLetterGrades || false);
  }, [watchUseLetterGrades]);
  
  const onSubmit = async (data: FormData) => {
    try {
      // Find the selected student
      const student = students.find(s => s.id === data.studentId);
      if (!student) {
        toast.error("Studente non trovato");
        return;
      }
      
      let examId = data.examId;
      
      // Create new exam if needed
      if (newExam || !examId) {
        const newExamData = await addExam({
          tipo: data.useLetterGrades ? 'intermedio' : 'completo',
          data: data.examDate
        });
        examId = newExamData.id;
      }
      
      // Create the grade
      const gradeData: Partial<Grade> = {
        matricola: student.matricola,
        examId
      };
      
      // Add the appropriate grade type based on settings
      if (data.useLetterGrades) {
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
            name="useLetterGrades"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Usa voti in lettere</FormLabel>
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

          {!newExam && exams.length > 0 && (
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esame esistente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un esame" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {exams
                        .filter(exam => (exam.tipo === 'intermedio') === useLetterGrades)
                        .map((exam) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.data} - {exam.tipo === 'intermedio' ? 'Voti in lettere' : 'Voti numerici'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {exams.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="newExam"
                checked={newExam}
                onCheckedChange={(checked) => setNewExam(!!checked)}
              />
              <Label htmlFor="newExam">Crea nuovo esame</Label>
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

          {/* Grade fields based on type */}
          {useLetterGrades ? (
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
