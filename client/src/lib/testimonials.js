// Customer testimonials shown on the homepage.
//
// REAL: add real customers here, only with their written permission and their actual words
// (the FTC bans fake testimonials). Shape:
//   { name: "Maria T.", state: "Texas", photo: "/testimonials/maria.jpg", quote: { en: "…", es: "…" } }
// If a customer got a free service or payment for the comment, say so on the page.
export const REAL = [];

// DUMMY: placeholder text so the layout can be reviewed locally. It is used ONLY in development
// (`npm run dev`) and is never shipped in the production build, so it cannot go live by accident.
const DUMMY = [
  { name: "Maria T.", state: "Texas", photo: "/testimonials/cris.jpg", quote: { en: "The soft check was quick, and seeing the numbers laid out before I signed anything made me feel in control.", es: "La consulta suave fue rápida y ver los números antes de firmar me hizo sentir en control." } },
  { name: "James R.", state: "Florida", photo: "/testimonials/martin.jpg", quote: { en: "Everything was explained in plain words. No pressure, just clear options.", es: "Todo se explicó en palabras sencillas. Sin presión, solo opciones claras." } },
  { name: "Dana K.", state: "California", photo: "/testimonials/marina.jpg", quote: { en: "I liked seeing the costs and risks up front, not buried in fine print.", es: "Me gustó ver los costos y riesgos desde el principio, no escondidos en letra pequeña." } },
  { name: "Luis G.", state: "Arizona", photo: "/testimonials/hellen.jpg", quote: { en: "I did the whole thing on my phone in one sitting.", es: "Hice todo en mi teléfono de una sola vez." } },
  { name: "Angela P.", state: "Georgia", photo: "/testimonials/romario.jpg", quote: { en: "It helped me understand my options before deciding what to do next.", es: "Me ayudó a entender mis opciones antes de decidir qué hacer." } },
  { name: "Robert S.", state: "Ohio", photo: "/testimonials/marrie.jpg", quote: { en: "Clear, honest and easy to follow. I knew exactly what came next.", es: "Claro, honesto y fácil de seguir. Sabía exactamente qué venía después." } },
];

export const REVIEWS = REAL.length ? REAL : DUMMY;
