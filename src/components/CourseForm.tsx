
import { useState } from "react";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addCourse, updateCourse } from "@/utils/dataStorage";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CourseFormProps {
  course?: Course;
  onComplete: () => void;
}

const CourseForm = ({ course, onComplete }: CourseFormProps) => {
  const [nome, setNome] = useState(course?.nome || "");
  const [votiInLettere, setVotiInLettere] = useState(course?.haIntermedio || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate
      if (!nome.trim()) {
        toast.error("Il nome del corso è obbligatorio");
        setIsSubmitting(false);
        return;
      }
      
      if (course?.id) {
        // Update
        updateCourse({
          id: course.id,
          nome,
          haIntermedio: votiInLettere // Mantenuto per compatibilità
        });
        toast.success("Corso aggiornato con successo");
      } else {
        // Create
        addCourse({ nome, haIntermedio: votiInLettere }); // Mantenuto per compatibilità
        toast.success("Corso creato con successo");
      }
      
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore durante il salvataggio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome del corso</Label>
        <Input 
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Es. Matematica Discreta"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Tipo di valutazione</Label>
        <RadioGroup 
          value={votiInLettere ? "lettere" : "numeri"}
          onValueChange={(value) => setVotiInLettere(value === "lettere")}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lettere" id="lettere" />
            <Label htmlFor="lettere">Voti in lettere (A-F)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="numeri" id="numeri" />
            <Label htmlFor="numeri">Voti numerici (18-30 e lode)</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onComplete}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {course?.id ? "Aggiorna corso" : "Crea corso"}
        </Button>
      </div>
    </form>
  );
};

export default CourseForm;
