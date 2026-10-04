# Nuestro Tiempo

Bitácora privada de pareja: calendario compartido, recuerdos, fotos, notas y presencia en tiempo real.

## Desarrollo local

1. Copia `.env.example` como `.env` y completa la clave pública de Supabase.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.

## Supabase

Ejecuta `supabase/schema.sql` una sola vez en el SQL Editor del proyecto y crea los dos usuarios desde Authentication. La interfaz permite iniciar sesión usando solo los nombres `sarellano` o `diaval`; sus correos reales se mantienen asociados en la configuración del cliente y las contraseñas nunca se guardan en el código.

## GitHub Pages

El workflow de `.github/workflows/deploy.yml` publica automáticamente cada push a `main`. Puedes proporcionar estas variables como secretos del repositorio para sobreescribir la configuración de respaldo:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
