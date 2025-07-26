import { LoginForm } from '@/components/login-form';
import { School } from 'lucide-react';

export default function Home() {
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
