
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardAnalytics, getExamStats } from "@/utils/gradeUtils";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examStats, setExamStats] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        const data = getDashboardAnalytics();
        setAnalytics(data);
        
        // Set the first exam as selected by default if available
        if (data.recentExams.length > 0 && !selectedExamId) {
          setSelectedExamId(data.recentExams[0].id);
          setExamStats(getExamStats(data.recentExams[0].id));
        }
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const stats = getExamStats(examId);
    setExamStats(stats);
  };

  const prepareDistributionData = () => {
    // Use selected exam stats if available, otherwise use overall stats
    const distribution = examStats?.distribution || analytics?.overallStats?.distribution;
    if (!distribution) return [];
    
    return Object.keys(distribution).map(key => ({
      grade: key,
      count: distribution[key]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.counts.students || 0}</div>
            <p className="text-xs text-muted-foreground">
              Totale studenti nel sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esami</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.counts.exams || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sessioni d'esame registrate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media generale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examStats?.average || analytics?.overallStats?.average || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Media dei voti {selectedExamId ? 'dell\'esame selezionato' : 'registrati'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Seleziona Esame</CardTitle>
          <CardDescription>
            Visualizza le statistiche per uno specifico esame
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedExamId || undefined} onValueChange={handleExamChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona un esame" />
            </SelectTrigger>
            <SelectContent>
              {analytics?.recentExams.map((exam: any) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.type === 'intermedio' ? 'Voti in lettere' : 'Voti numerici'} ({exam.date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Distribuzione dei voti</CardTitle>
          <CardDescription>
            {selectedExamId ? "Per l'esame selezionato" : "Tutti gli esami"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepareDistributionData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Numero di voti" fill="#1a75ff" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Esami recenti</CardTitle>
          <CardDescription>
            Ultimi esami registrati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {analytics?.recentExams?.length > 0 ? (
              analytics.recentExams.map((exam: any) => (
                <div key={exam.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {exam.type === 'intermedio' ? 'Voti in lettere' : 'Voti numerici'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Data: {exam.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Media: {exam.stats.average}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Passati: {exam.stats.passing}/{exam.stats.passing + exam.stats.failing} ({exam.stats.passingPercentage}%)
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun esame registrato
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
