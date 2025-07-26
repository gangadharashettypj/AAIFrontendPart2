'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  ImageIcon,
  LayoutGrid,
  LogOut,
  MessageCircleQuestion,
  Presentation,
  School,
  Sheet,
  User,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutGrid,
    label: 'Dashboard',
  },
  {
    href: '/dashboard/classroom',
    icon: Presentation,
    label: 'Classroom',
  },
  {
    href: '/dashboard/content-generation',
    icon: FileText,
    label: 'Content Generation',
  },
  {
    href: '/dashboard/worksheet-generation',
    icon: Sheet,
    label: 'Worksheet Generation',
  },
  {
    href: '/dashboard/qa',
    icon: MessageCircleQuestion,
    label: 'AI Q&A',
  },
  {
    href: '/dashboard/visual-aid',
    icon: ImageIcon,
    label: 'Visual Aids',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 p-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <School className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold text-primary font-headline">
              Sahayak AI
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          <div className="flex items-center gap-3">
             <Avatar>
              <AvatarImage src="https://placehold.co/40x40.png" alt="Teacher" data-ai-hint="teacher avatar" />
              <AvatarFallback>T</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm truncate">Jessica Smith</p>
                <p className="text-xs text-muted-foreground truncate">teacher@example.com</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} aria-label="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl font-semibold font-headline text-foreground">
                    {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                </h1>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
