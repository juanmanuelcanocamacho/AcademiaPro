try {
  require('dotenv').config();
} catch (e) {
  // Ignorar si dotenv no está disponible (ej. dentro del contenedor Docker en producción)
}

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
