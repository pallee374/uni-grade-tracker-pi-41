
import { useState, useEffect } from "react";
import { Course, Student, ExamType } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getCourses, getStudents, importGradesFromCSV } from "@/utils/dataStorage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface GradeImportProps {
  onComplete: () => void;
}

const GradeImport = ({ onComplete }: GradeImportProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [csvData, setCsvData] = useState("");
  const [courseId, setCourseId] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [isNewExam, setIsNewExam] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  useEffect(() => {
    // Load courses
    setCourses(getCourses());
  }, []);
  
  // Update selected course when courseId changes
  useEffect(() => {
    if (courseId) {
      const course = courses.find(c => c.id === courseId) || null;
      setSelectedCourse(course);
    } else {
      setSelectedCourse(null);
    }
  }, [courseId, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!courseId) {
        toast.error("Seleziona un corso");
        setIsSubmitting(false);
        return;
      }
      
      if (!examDate) {
        toast.error("Seleziona una data per l'esame");
        setIsSubmitting(false);
        return;
      }
      
      if (!csvData.trim()) {
        toast.error("Inserisci i dati CSV");
        setIsSubmitting(false);
        return;
      }

      if (!selectedCourse) {
        toast.error("Errore nella selezione del corso");
        setIsSubmitting(false);
        return;
      }
      
      // Import grades with the correct exam type based on course setting
      const examType = selectedCourse.haIntermedio ? 'intermedio' : 'completo';
      
      // Import grades
      const result = importGradesFromCSV({
        csvData,
        courseId,
        examType,
        examDate,
        isNewExam,
        hasHeaderRow
      });
      
      if (result.imported === 0) {
        toast.info("Nessun voto importato. Verifica il formato del file CSV.");
      } else {
        toast.success(`Importati ${result.imported} voti con successo`);
        
        if (result.errors > 0) {
          toast.warning(`${result.errors} voti non importati a causa di errori. Verifica le matricole o il formato.`);
        }
        
        onComplete();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante l'importazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="courseId">Corso</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un corso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="examDate">Data dell'esame</Label>
            <Input 
              id="examDate"
              type="date" 
              value={examDate} 
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="isNewExam"
            checked={isNewExam}
            onCheckedChange={(checked) => setIsNewExam(!!checked)}
          />
          <Label htmlFor="isNewExam">Crea nuovo esame</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hasHeaderRow"
            checked={hasHeaderRow}
            onCheckedChange={(checked) => setHasHeaderRow(!!checked)}
          />
          <Label htmlFor="hasHeaderRow">Il CSV contiene una riga di intestazione</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="csvData" className="flex items-center gap-2">
            <FileText size={16} />
            Dati CSV
          </Label>
          <textarea
            id="csvData"
            className="w-full h-40 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={
              selectedCourse?.haIntermedio
                ? "matricola,voto\n0612710900,A\n0612710901,B"
                : "matricola,voto,lode\n0612710900,30,true\n0612710901,28,false"
            }
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />

          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Formato richiesto:</p>
            {selectedCourse?.haIntermedio ? (
              <div>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
                  <li><code>voto</code>: Voto letterale da A a F (obbligatorio)</li>
                </ul>
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium">Conversione voti:</p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <li>A = 30</li>
                    <li>B = 28-29</li>
                    <li>C = 25-27</li>
                    <li>D = 22-24</li>
                    <li>E = 18-21</li>
                    <li>F = insufficiente</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>matricola</code>: La matricola dello studente (obbligatorio)</li>
                  <li><code>voto</code>: Voto numerico da 18 a 30 (obbligatorio)</li>
                  <li><code>lode</code>: true/false se il voto è con lode (opzionale)</li>
                </ul>
                <div className="mt-2 p-2 bg-muted rounded-md flex items-center gap-2 text-amber-500">
                  <AlertCircle size={16} />
                  <p>Per i voti numerici, inserire valori compresi tra 18 e 30</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onComplete}
        >
          Annulla
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          <Upload className="mr-2" size={16} />
          Importa Voti
        </Button>
      </div>
    </form>
  );
};

export default GradeImport;
