import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/Topbar';

/**
 * Authenticated app shell.
 * Anything inside (app)/ requires a logged-in user.
 * Renders the Topbar; pages render below.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  return (
    <>
      <Topbar profile={profile} />
      {children}
    </>
  );
}
