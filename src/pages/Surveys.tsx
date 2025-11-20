import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";

interface Rating {
  id: string;
  ticket_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  tickets: {
    title: string;
    priority: string;
    profiles: {
      nickname: string | null;
    };
  };
}

const Surveys = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        toast.error("Access denied");
        navigate("/support");
        return;
      }

      setIsAdmin(true);
      fetchRatings();
    };
    getUser();
  }, [navigate]);

  const fetchRatings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ticket_ratings")
      .select(`
        *,
        tickets (
          title,
          priority,
          profiles (
            nickname
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
      toast.error("Error loading surveys");
    } else {
      setRatings(data || []);
    }
    setIsLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ticket Surveys</h1>
        <p className="text-muted-foreground">
          View customer satisfaction ratings and feedback
        </p>
      </div>

      <div className="space-y-4">
        {ratings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No surveys submitted yet
              </p>
            </CardContent>
          </Card>
        ) : (
          ratings.map((rating) => (
            <Card key={rating.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {rating.tickets.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {renderStars(rating.rating)}
                    <Badge variant="outline">
                      {rating.tickets.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      By {rating.tickets.profiles?.nickname || "Unknown"}
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(rating.created_at), "d MMMM yyyy, HH:mm", {
                        locale: enUS,
                      })}
                    </span>
                  </div>
                  {rating.feedback && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{rating.feedback}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Surveys;
