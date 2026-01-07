import { useSession } from 'next-auth/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function useAuth() {
  const [session, loading] = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [loading, session, router]);

  return {
    session,
    user: session?.user,
    userId: (session?.user as any)?.id,
    isLoading: loading,
    isAuthenticated: !!session,
  };
}

