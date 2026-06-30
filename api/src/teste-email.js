import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const remetente = "gabriel.t@osinteligenciafinanceira.com.br";
const destinatario = "gltrevisani.04@gmail.com";

async function testeEnvio() {
  try {
    console.log("Iniciando autenticação");

    const keyFilePath = path.join(__dirname, "..", "google-credentials.json");

    const auth = new google.auth.JWT({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      subject: remetente,
    });

    const gmail = google.gmail({ version: "v1", auth });

    console.log("Montando mensagem");
    const messageParts = [
      `From: <${remetente}>`,
      `To: <${destinatario}>`,
      `Subject: teste api gmail`,
      `Content-Type: text/html; charset=utf-8`,
      `Mime-Version: 1.0`,
      "",
      `<h1> Deu certo! </h1><p> Essa porra funciona</p>`,
    ];

    const message = messageParts.join("\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    console.log("Disparando para o google");
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    console.log("sucesso no envio do email!");
  } catch (error) {
    console.error("Erro no envio");
    console.error(error.message);
  }
}

testeEnvio();
