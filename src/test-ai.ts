import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const keyMatch = envFile.match(/^OPENAI_API_KEY=(.*)$/m);
if (keyMatch) process.env.OPENAI_API_KEY = keyMatch[1].trim();

async function run() {
    let text = `EXAMEN TIPO TEST PARA LA SELECCIÓN DE 4 PLAZAS DE FUNCIONARIO/A INTERINO/A DE 
[g_d0_f1] OFICIAL DE SERVICIOS MULTIPLES 
[g_d0_f3] 41. Los escariadores se pueden clasificar en: 
[g_d0_f3] a. Escariadores blandos y de disminución. 
[g_d0_f1] b. Escariadores sólidos y de expansión. 
[g_d0_f3] c. Escariadores sólidos, blandos, de expansión, y de disminución. 
[g_d0_f5]  
[g_d0_f3] 42. El tornillo de banco: 
[g_d0_f1] a. Está formado por dos mandíbulas una fija y otra móvil. La parte móvil se 
[g_d0_f1] mueve mediante
[g_d0_f2]  un tornillo sin fin y aprisiona a la pieza con la parte fija. 
[g_d0_f3] b. Está formado por dos mandíbulas móviles. Que se mueven mediante un tornillo 
[g_d0_f3] sin fin para redondear el corte.  
[g_d0_f3] c. Está formado por dos mandíbulas fijas. Ambas partes aprisionan la pieza para 
[g_d0_f3] su correcto corte. `;

    const optionFontRegex = /\[(.*?)\]\s*[a-d]\./ig;
    let match;
    const fontCounts: Record<string, number> = {};

    while ((match = optionFontRegex.exec(text)) !== null) {
        const font = match[1];
        fontCounts[font] = (fontCounts[font] || 0) + 1;
    }

    const fonts = Object.keys(fontCounts).sort((a, b) => fontCounts[a] - fontCounts[b]);
    if (fonts.length >= 2) {
        const rareFont = fonts[0];
        text = text.replace(new RegExp(`\\[${rareFont}\\]`, 'g'), '[ESTA ES LA RESPUESTA CORRECTA]');
    }

    console.log("=== PREPROCESSED TEXT ===");
    console.log(text);

    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
            questions: z.array(z.object({
                statement: z.string(),
                optionA: z.string(),
                optionB: z.string(),
                optionC: z.string(),
                optionD: z.string(),
                correctOption: z.number().describe("Un número entre 0 y 3 que representa la opción correcta (0 para A, 1 para B, 2 para C, 3 para D). Localiza cuál de las opciones tiene la etiqueta [ESTA ES LA RESPUESTA CORRECTA] al principio.")
            }))
        }),
        prompt: `
        Tu trabajo es limpiar analíticamente este texto y devolverme un array con las preguntas perfectas.
        Ignora absolutamente todo el texto que no pertenezca estrictamente al enunciado de una pregunta o a sus respuestas.
        Si el formato carece de algunas opciones C o D, utiliza el carácter '-' como placeholder literal.
        
        ¡MUY IMPORTANTE PARA LA RESPUESTA CORRECTA!:
        El pre-procesador ha inyectado el tag literal "[ESTA ES LA RESPUESTA CORRECTA]" justo en la línea de la opción que estaba en negrita en el PDF.
        La opción correcta será obligatoria y matemáticamente aquella que contenga o vaya precedida por ese tag.
        Mapea la correcta traduciéndolo a su índice numérico exacto (0-3).
        
        TEXTO BRUTO DEL PDF:
        ${text}
        `,
    });

    console.log(JSON.stringify(object, null, 2));
}

run().catch(console.error);
