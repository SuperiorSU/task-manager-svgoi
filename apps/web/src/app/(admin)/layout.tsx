import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import { AdminShell } from '@/components/layout/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/login');
  if (session.user.role === 'EMPLOYEE') redirect('/login');

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
