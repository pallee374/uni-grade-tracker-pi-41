
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getStudents, deleteStudent } from "@/utils/dataStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface StudentTableProps {
  onEdit: (student: Student) => void;
  onView: (matricola: string) => void;
  refreshTrigger?: number;
}

const StudentTable = ({ onEdit, onView, refreshTrigger = 0 }: StudentTableProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = () => {
      const allStudents = getStudents();
      setStudents(allStudents);
      applySearch(allStudents, search);
    };

    loadStudents();
  }, [refreshTrigger, search]);

  const applySearch = (students: Student[], term: string) => {
    if (!term.trim()) {
      setFilteredStudents(students);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.matricola.includes(lowerTerm) ||
        student.nome.toLowerCase().includes(lowerTerm) ||
        student.cognome.toLowerCase().includes(lowerTerm)
    );
    
    setFilteredStudents(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    applySearch(students, newSearch);
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteStudent = () => {
    if (confirmDelete) {
      try {
        deleteStudent(confirmDelete);
        toast.success("Studente eliminato con successo");
        
        // Update the student list
        const updatedStudents = students.filter(s => s.id !== confirmDelete);
        setStudents(updatedStudents);
        applySearch(updatedStudents, search);
      } catch (error) {
        toast.error("Errore durante l'eliminazione dello studente");
      }
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Cerca per matricola, nome o cognome..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          Totale: {filteredStudents.length} studenti
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricola</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {search ? "Nessun risultato trovato" : "Nessuno studente presente"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.matricola}</TableCell>
                  <TableCell>{student.nome}</TableCell>
                  <TableCell>{student.cognome}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(student.matricola)}
                    >
                      Visualizza
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(student)}
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(student.id)}
                    >
                      Elimina
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo studente? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDeleteStudent}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentTable;
