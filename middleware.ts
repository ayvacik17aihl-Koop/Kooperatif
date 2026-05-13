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

  // 1. ADIM: Oturum Kontrolü (Zaten vardı)
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. ADIM: Rol Bazlı Yetkilendirme
  if (user) {
    const role = user.user_metadata?.role // Kayıt ederken verdiğiniz rol

    // Personelin girmesini istemediğiniz özel sayfaları buraya ekleyin
    // Örneğin: /admin/users (Kullanıcı yönetimi) veya /admin/stok/fiyat-yonetimi
    const adminOnlyPaths = [
      '/admin/users',
      '/admin/stok/fiyat-yonetimi',
      '/admin/kasa' // Örnek: Kasaya da girmesinler diyorsanız
    ]

    const isTryingToAccessAdminOnly = adminOnlyPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )

    if (role === 'personel' && isTryingToAccessAdminOnly) {
      // Yetkisi yoksa Dashboard'a geri gönder veya bir hata sayfasına at
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}