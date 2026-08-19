// Qué se ofrece en producción y qué se queda en local.
//
// Producción = los dos instrumentos confirmados: el chat y el test de Holland.
// El examen psicométrico y el perfil corto de personalidad siguen enteros y
// accesibles en `npm run dev`, pero no salen en el build que ven los alumnos:
// todavía no está medido si aportan algo al ranking de carreras.
//
// El backend sirve esos endpoints en los dos casos: esto es qué se ofrece, no
// qué existe.
export const MODO_COMPLETO = import.meta.env.DEV
