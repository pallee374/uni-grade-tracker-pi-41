
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardAnalytics } from "@/utils/gradeUtils";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const data = getDashboardAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const prepareChartData = () => {
    if (!analytics?.courseStats) return [];
    
    return analytics.courseStats.map((course: any) => ({
      name: course.name,
      average: course.stats.average,
      passing: course.stats.passingPercentage,
    }));
  };

  const prepareDistributionData = () => {
    if (!analytics?.overallStats?.distribution) return [];
    
    const distribution = analytics.overallStats.distribution;
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Corsi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.counts.courses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Corsi attivi nel sistema
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
              {analytics?.overallStats?.average || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Media di tutti i voti registrati
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuzione dei voti</CardTitle>
            <CardDescription>
              Frequenza dei voti assegnati
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
            <CardTitle>Statistiche per corso</CardTitle>
            <CardDescription>
              Media e percentuale di approvazione
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" name="Media" fill="#1a75ff" />
                <Bar dataKey="passing" name="% Approvazione" fill="#4d94ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                      {exam.courseName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exam.type === 'intermedio' ? 'Prova intermedia' : 'Esame completo'} - {exam.date}
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
