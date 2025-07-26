'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { School, BookUser } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <Tabs defaultValue="teacher" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="teacher">
          <School className="mr-2 h-4 w-4" /> Teacher
        </TabsTrigger>
        <TabsTrigger value="student">
          <BookUser className="mr-2 h-4 w-4" /> Student
        </TabsTrigger>
      </TabsList>
      <TabsContent value="teacher">
        <Card>
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Teacher Login</CardTitle>
              <CardDescription>
                Access your dashboard to manage classes and students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-email">Email</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="teacher@example.com"
                  defaultValue="teacher@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-password">Password</Label>
                <Input id="teacher-password" type="password" defaultValue="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">Login</Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="student">
        <Card>
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Student Login</CardTitle>
              <CardDescription>
                Access your learning materials and assignments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@example.com"
                  defaultValue="student@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input id="student-password" type="password" defaultValue="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">Login</Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
