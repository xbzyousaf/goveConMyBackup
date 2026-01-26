import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Users,
  Star
} from "lucide-react";

interface DashboardProps {
  userName?: string;
}

export function Dashboard({ userName = "John" }: DashboardProps) {
  // todo: remove mock functionality
  const mockStats = {
    activeRequests: 3,
    completedServices: 12,
    totalSpent: 8750,
    avgRating: 4.8
  };

  const mockRecentActivity = [
    {
      id: 1,
      type: "service_completed",
      title: "Cybersecurity Audit Completed",
      vendor: "TechSecure Solutions",
      date: "2 days ago",
      status: "completed",
      amount: 1500
    },
    {
      id: 2,
      type: "service_in_progress",
      title: "Contract Review",
      vendor: "Sarah Johnson",
      date: "1 week ago",
      status: "in_progress",
      progress: 75
    },
    {
      id: 3,
      type: "new_match",
      title: "New Vendor Match",
      vendor: "HR Solutions Pro",
      date: "3 days ago",
      status: "pending"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-welcome">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your services and requests
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Requests</p>
              <p className="text-2xl font-bold" data-testid="stat-active-requests">
                {mockStats.activeRequests}
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Services</p>
              <p className="text-2xl font-bold" data-testid="stat-completed-services">
                {mockStats.completedServices}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold" data-testid="stat-total-spent">
                ${mockStats.totalSpent.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold flex items-center gap-1" data-testid="stat-avg-rating">
                {mockStats.avgRating}
                <Star className="h-4 w-4 fill-current text-yellow-400" />
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {mockRecentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-600' :
                  activity.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                   activity.status === 'in_progress' ? <Clock className="h-4 w-4" /> :
                   <AlertCircle className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-medium" data-testid={`activity-title-${activity.id}`}>
                    {activity.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    by {activity.vendor} • {activity.date}
                  </p>
                  {activity.status === 'in_progress' && activity.progress && (
                    <div className="mt-2">
                      <Progress value={activity.progress} className="w-32" />
                      <span className="text-xs text-muted-foreground">
                        {activity.progress}% complete
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activity.amount && (
                  <Badge variant="outline">${activity.amount}</Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => console.log(`View details for activity: ${activity.id}`)}
                  data-testid={`button-view-activity-${activity.id}`}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}