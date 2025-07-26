'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, BookOpen, CheckSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const stats = [
  {
    title: 'Students Enrolled',
    value: '125',
    icon: Users,
    color: 'text-blue-500',
  },
  {
    title: 'Active Classes',
    value: '8',
    icon: BookOpen,
    color: 'text-green-500',
  },
  {
    title: 'Assignments Graded',
    value: '234',
    icon: CheckSquare,
    color: 'text-orange-500',
  },
];

export default function DashboardPage() {
  const [isClassMode, setIsClassMode] = React.useState(false);
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Welcome back, {user?.displayName || 'Jessica'}!
          </h2>
          <p className="text-muted-foreground">
            Here's a summary of your teaching activities.
          </p>
        </div>
        <div className="flex items-center space-x-2 p-2 rounded-lg border bg-card">
          <Label htmlFor="class-mode" className="font-medium">
            Class Mode
          </Label>
          <Switch
            id="class-mode"
            checked={isClassMode}
            onCheckedChange={setIsClassMode}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div className="bg-secondary/20 text-secondary p-2 rounded-lg">
                  <div className="font-bold text-sm">MAY</div>
                  <div className="font-bold text-lg text-center">25</div>
                </div>
                <div>
                  <p className="font-semibold">Grade 8 - Science Fair Project</p>
                  <p className="text-sm text-muted-foreground">Submission closes at 11:59 PM</p>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <div className="font-bold text-sm">MAY</div>
                  <div className="font-bold text-lg text-center">28</div>
                </div>
                <div>
                  <p className="font-semibold">Grade 7 - History Essay</p>
                  <p className="text-sm text-muted-foreground">Submission closes at 11:59 PM</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to show.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
