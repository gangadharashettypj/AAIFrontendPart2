'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/use-auth';
import {LoginForm} from '@/components/login-form';
import {School, Loader2} from 'lucide-react';

export default function Home() {
  const {user, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
          <School className="h-10 w-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline">
          Sahayak AI
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your AI-Powered Teaching Assistant
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
