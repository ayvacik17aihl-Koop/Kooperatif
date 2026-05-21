import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface Izin {
  modul_adi: string
  islem_tipi: string
}

interface Rol {
  rol_adi: string
  is_superadmin: boolean
  izinler: Izin[] | null
}

interface UserRoleResponse {
  roller: Rol | null
}

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
  const currentPath = request.nextUrl.pathname

  if (user && currentPath === '/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  if (currentPath.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: userRolesData } = await supabase
      .from('kullanici_rolleri')
      .select(`
        roller (
          rol_adi,
          is_superadmin,
          izinler (
            modul_adi,
            islem_tipi
          )
        )
      `)
      .eq('kullanici_id', user.id)

    const userRoles = (userRolesData as unknown as UserRoleResponse[]) || []

    const isSuperAdmin = userRoles.some(
      (ur) => ur.roller?.is_superadmin === true
    )

    if (isSuperAdmin) {
      return response
    }

    const userPermissions = userRoles.flatMap((ur) => ur.roller?.izinler || [])

    const pathModules: { [key: string]: string } = {
      '/admin/users': 'uyeler',
      '/admin/ayarlar': 'ayarlar',
      '/admin/stok': 'stok',
      '/admin/kasa': 'muhasebe',
      '/admin/faturalar': 'muhasebe'
    }

    const requiredModulePath = Object.keys(pathModules).find(path => currentPath.startsWith(path))

    if (requiredModulePath) {
      const targetModule = pathModules[requiredModulePath]
      
      const hasPermission = userPermissions.some(
        (perm) => perm.modul_adi === targetModule && (perm.islem_tipi === 'READ' || perm.islem_tipi === 'ALL')
      )

      if (!hasPermission && currentPath !== '/admin/dashboard') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}