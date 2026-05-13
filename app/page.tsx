import { redirect } from "next/navigation";

export default function Home() {
  // Kullanıcı ana sayfaya geldiğinde direkt giriş sayfasına gönderilir
  redirect("/login");
}