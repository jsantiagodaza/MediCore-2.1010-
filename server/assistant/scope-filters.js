'use strict';
/**
 * Issue #80: límites de alcance de Mol.
 * Clasificación conservadora: las reglas clínicas y las intenciones válidas
 * tienen prioridad en engine.js. No usa IA ni inventa datos personales.
 */
function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function result(reply, flag, actions = ['Consultar las herramientas de MediCore']) {
  return {
    category: 'out_of_scope',
    safety: { level: 'ok', flags: [flag] },
    reply,
    sources: [],
    suggested_actions: actions
  };
}
const UNAVAILABLE = [
  { test: /\b(?:agendar|reservar|programar|cancelar|confirmar)\b.{0,55}\b(?:cita|consulta|turno)\b|\b(?:citas|turnos)\b.{0,30}\b(?:medicore|app|plataforma)\b/, name: 'agendar o gestionar citas médicas' },
  { test: /\b(?:videollamadas?|videoconsultas?|video consulta|teleconsulta|telemedicina)\b/, name: 'realizar videoconsultas' },
  { test: /\b(?:historia clinica|historial clinico|resultados de laboratorio|examenes de laboratorio)\b/, name: 'consultar historias clínicas o resultados personales' },
  { test: /\b(?:comprar|pedir|ordenar|vender)\b.{0,45}\b(?:medicamentos|pastillas|farmacos)\b/, name: 'comprar medicamentos' },
  { test: /\b(?:recordatorios? de medicamentos|alarmas? de dosis|notificaciones? de dosis)\b/, name: 'programar recordatorios de medicamentos' },
  { test: /\b(?:sincroni\w*|compartir)\b.{0,50}\b(?:botiquin|inventario)\b/, name: 'sincronizar el botiquín entre dispositivos' }
];
const PLATFORM = /\b(?:medicore|mol|plataforma|aplicacion|app|modulo|seccion|funcion|herramienta)\b/;
const FUNCTION_REQUEST = /\b(?:puedo|tiene|hay|existe|permite|ofrece|como|donde|quiero|necesito|ayudame|usar|hacer|acceder)\b/;
const INSULTS = /\b(?:idiota|estupido|imbecil|inutil|pendejo|malparido|hijueputa|hijo de puta|mierda de bot|bot de mierda|(?:eres|es) una basura|callate)\b/;
const OUTSIDE = [
  /\b(?:programacion|programar en python|codigo javascript|codigo java|escribir codigo|depurar codigo|crear una pagina web)\b/,
  /\b(?:politica|presidente|elecciones|partido politico|congreso|senado|votaciones)\b/,
  /\b(?:futbol|mundial de futbol|resultado del partido|quien gano el mundial|liga de campeones)\b/,
  /\b(?:receta de cocina|escribe un poema|cuentame un chiste|horoscopo|astrologia)\b/
];
function scopeReply(message) {
  const text = normalize(message);
  if (!text) return null;
  // Pedidos explícitos acerca de funciones inexistentes: distinguirlos de la
  // consulta sobre el uso clínico de un medicamento o tema sanitario.
  for (const feature of UNAVAILABLE) {
    if (feature.test.test(text) && (PLATFORM.test(text) || FUNCTION_REQUEST.test(text))) {
      return result(
        `No dispongo de una herramienta para ${feature.name} desde MediCore. Sí puedo orientarte sobre las funciones disponibles, como Cuídate, Medicamentos, Me siento mal, Prepárate y Botiquín Esencial. ¿Cuál deseas consultar?`,
        'unsupported_feature'
      );
    }
  }
  if (INSULTS.test(text)) {
    return result('Quiero ayudarte con respeto. Si algo de mi respuesta no fue útil, puedes explicarme qué necesitas y trataré de orientarte sobre MediCore o información general de salud.', 'offensive_message');
  }
  if (OUTSIDE.some(pattern => pattern.test(text)) && !PLATFORM.test(text)) {
    return result('Ese tema está fuera del ámbito de Mol. Puedo ayudarte con las herramientas de MediCore y con información general de salud. ¿Hay alguna función de la plataforma que quieras conocer?', 'unrelated_topic');
  }
  // No hay datos del usuario ni conexión a cuentas, registros clínicos o servicios externos.
  if (/\b(?:mi cuenta|mi perfil|mi contrasena|mis datos personales|mis resultados|mis examenes|mi historial)\b/.test(text)
      && /\b(?:mostrar|muestra|consulta|consultar|cambiar|modificar|borrar|eliminar|recuperar|ver|acceder)\b/.test(text)) {
    return result('No tengo acceso a tu cuenta, tus datos personales ni tus resultados clínicos. Si necesitas gestionar esa información, utiliza los canales oficiales correspondientes. Puedo explicarte las herramientas informativas de MediCore.', 'unavailable_personal_data');
  }
  return null;
}
module.exports = { scopeReply };
