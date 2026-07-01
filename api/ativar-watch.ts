import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ligarWatch() {
  try {
    const keyFilePath = path.join(__dirname, "google-credentials.json");
    const auth = new google.auth.JWT({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      subject: "gabriel.t@osinteligenciafinanceira.com.br",
    });

    const gmail = google.gmail({ version: "v1", auth });
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: "projects/apigmailsdr/topics/gmail-bounces",
        labelIds: ["INBOX"],
      },
    });

    console.log("O Gmail agora está verificando os emails recebidos");
    console.log("Dados da ativação: ", response.data);
  } catch (error: any) {
    console.error("Erro ao ativar webhook do gmail: ", error.message);
  }
}

ligarWatch();
