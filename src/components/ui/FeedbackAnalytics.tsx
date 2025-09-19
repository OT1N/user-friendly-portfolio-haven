import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Star, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SuggestionData {
  id: string;
  name: string;
  age: number;
  rating: number;
  suggestion: string;
  created_at: string;
}

interface RatingData {
  rating: number;
  count: number;
}

interface AgeGroupData {
  name: string;
  count: number;
  percentage: number;
}

const FeedbackAnalytics = () => {
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<SuggestionData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Calculate ratings distribution
  const ratingsData: RatingData[] = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: suggestions.filter(s => s.rating === rating).length
  }));

  // Calculate age groups
  const ageGroups = {
    'Kids (0-12)': suggestions.filter(s => s.age <= 12).length,
    'Teenagers (13-19)': suggestions.filter(s => s.age >= 13 && s.age <= 19).length,
    'Adults (20-59)': suggestions.filter(s => s.age >= 20 && s.age <= 59).length,
    'Elderly (60+)': suggestions.filter(s => s.age >= 60).length,
  };

  const totalSuggestions = suggestions.length;
  const ageGroupData: AgeGroupData[] = Object.entries(ageGroups).map(([name, count]) => ({
    name,
    count,
    percentage: totalSuggestions > 0 ? Math.round((count / totalSuggestions) * 100) : 0
  })).filter(group => group.count > 0);

  // Calculate happiness summary
  const averageRating = totalSuggestions > 0 
    ? suggestions.reduce((sum, s) => sum + s.rating, 0) / totalSuggestions 
    : 0;

  const getHappinessSummary = () => {
    if (averageRating >= 4) return { emoji: "😊", text: "Customers are happy", color: "text-green-600" };
    if (averageRating >= 3) return { emoji: "😐", text: "Mixed feedback", color: "text-yellow-600" };
    return { emoji: "😞", text: "Customers are unhappy", color: "text-red-600" };
  };

  const happinessSummary = getHappinessSummary();

  // Colors for charts
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSuggestions}</p>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${happinessSummary.color}`}>
                {happinessSummary.emoji}
              </p>
              <p className="text-sm text-muted-foreground">Customer Mood</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {totalSuggestions > 0 ? Math.round(suggestions.reduce((sum, s) => sum + s.age, 0) / totalSuggestions) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Average Age</p>
            </div>
          </div>
        </div>
      </div>

      {/* Happiness Summary */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Satisfaction</h3>
        <div className="text-center">
          <div className="text-6xl mb-2">{happinessSummary.emoji}</div>
          <p className={`text-xl font-semibold ${happinessSummary.color}`}>
            {happinessSummary.text}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {totalSuggestions} feedback submissions
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ratings Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Ratings Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="rating" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value} ⭐`}
              />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '8px' 
                }}
                formatter={(value) => [value, 'Count']}
                labelFormatter={(label) => `${label} Star${label === 1 ? '' : 's'}`}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age Groups Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ageGroupData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="count"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {ageGroupData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '8px' 
                }}
                formatter={(value, name) => [value, 'People']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">All Feedback Submissions</h3>
        </div>
        
        {suggestions.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={64} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">No feedback yet</h4>
            <p className="text-muted-foreground">
              Feedback submissions will appear here once customers start using the feedback widget.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Age</th>
                  <th className="p-4 text-left font-medium">Rating</th>
                  <th className="p-4 text-left font-medium">Suggestion</th>
                  <th className="p-4 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((suggestion, index) => (
                  <tr 
                    key={suggestion.id} 
                    className={`border-b hover:bg-muted/20 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    onClick={() => {
                      setSelectedFeedback(suggestion);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="p-4 font-medium">{suggestion.name}</td>
                    <td className="p-4">{suggestion.age}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < suggestion.rating ? "text-yellow-400 fill-current" : "text-gray-300"} 
                          />
                        ))}
                        <span className="ml-2 text-sm">({suggestion.rating})</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-md">
                      <p className="truncate" title={suggestion.suggestion}>
                        {suggestion.suggestion}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-medium">{selectedFeedback.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age</label>
                  <p className="text-lg font-medium">{selectedFeedback.age} years old</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Rating</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={20} 
                        className={i < selectedFeedback.rating ? "text-yellow-400 fill-current" : "text-gray-300"} 
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium">({selectedFeedback.rating}/5)</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Suggestion</label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words break-all">{selectedFeedback.suggestion}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Submitted On</label>
                <p className="text-base">{new Date(selectedFeedback.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackAnalytics;