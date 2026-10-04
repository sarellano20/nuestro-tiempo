# Nuestro Tiempo

Bitácora privada de pareja: calendario compartido, recuerdos, fotos, notas y presencia en tiempo real.

## Desarrollo local

1. Copia `.env.example` como `.env` y completa la clave pública de Supabase.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.

## Supabase

Ejecuta `supabase/schema.sql` una sola vez en el SQL Editor del proyecto. Después crea los usuarios de autenticación con los correos internos:

- `sarellano@nuestrotiempo.app`
- `diaval@nuestrotiempo.app`

La interfaz permite iniciar sesión usando solo el usuario (`sarellano` o `diaval`). La contraseña nunca se guarda en el código.

## GitHub Pages

El workflow de `.github/workflows/deploy.yml` publica automáticamente cada push a `main`. Deben existir estos secretos del repositorio:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
