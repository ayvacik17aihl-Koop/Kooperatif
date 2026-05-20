import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. DÖNGÜ KIRICI: Giriş yapmış kullanıcı /login'e giderse Dashboard'a at
  // Bu blok HERHANGİ bir if'in içinde olmamalı, bağımsız çalışmalı.
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // 2. YETKİ KONTROLÜ: Sadece /admin yollarını denetle
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Giriş yapmamışsa login'e at
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Rolü veritabanından çek (Profiles tablosu)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role || 'personel';
    //const role = profile?.role

    const adminOnlyPaths = [
      '/admin/users',
      '/admin/stok/fiyat-yonetimi',
      '/admin/ayarlar'
    ]

    const isTryingToAccessAdminOnly = adminOnlyPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    // Personel kısıtlaması
    if (role === 'personel' && isTryingToAccessAdminOnly) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  // Hem admin'i hem login'i matcher'a eklemeliyiz ki döngü kırıcı çalışsın
  matcher: ['/admin/:path*', '/login'],
}