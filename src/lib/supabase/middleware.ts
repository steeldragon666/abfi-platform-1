import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/supplier', '/buyer', '/admin', '/auditor'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages redirect if logged in
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && user) {
    // Get user profile to determine redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === 'supplier') {
      url.pathname = '/supplier';
    } else if (profile?.role === 'buyer') {
      url.pathname = '/buyer';
    } else if (profile?.role === 'admin') {
      url.pathname = '/admin';
    } else if (profile?.role === 'auditor') {
      url.pathname = '/auditor';
    } else {
      url.pathname = '/';
    }
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (request.nextUrl.pathname.startsWith('/supplier') && profile?.role !== 'supplier') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (request.nextUrl.pathname.startsWith('/buyer') && profile?.role !== 'buyer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (request.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Auditors and admins can access auditor routes
    if (request.nextUrl.pathname.startsWith('/auditor') &&
        profile?.role !== 'auditor' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}
