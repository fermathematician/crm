import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { prismaClient } from "../../prisma/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CheckBouncesRequest {
  userId: string;
}

class CheckBouncesService {
  async execute({ userId }: CheckBouncesRequest) {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) throw new Error("Usuário não encontrado");

    const keyFilePath = path.join(
      __dirname,
      "..",
      "..",
      "google-credentials.json",
    );
    const auth = new google.auth.JWT({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/gmail.modify"],
      subject: user.email,
    });

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "from:mailer-daemon is:unread",
    });

    const messages = response.data.messages || [];
    let bouncesProcessados = 0;

    for (const msg of messages) {
      if (!msg.id) continue;

      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = msgData.data.payload?.headers;
      const failedRecepientHeader = headers?.find(
        (h) => h.name === "X-Failed-Recipients",
      );
      let emailQueFalhou = failedRecepientHeader?.value;

      if (!emailQueFalhou) {
        const snippet = msgData.data.snippet || "";
        const regexDeEmail =
          /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        const match = snippet.match(regexDeEmail);
        if (match) emailQueFalhou = match[1];
      }

      if (emailQueFalhou) {
        console.log(`[💥 BOUNCE] O e-mail falhou para: ${emailQueFalhou}`);

        const leads = await prismaClient.lead.findMany({
          where: { email: emailQueFalhou },
        });

        for (const lead of leads) {
          console.log(`Lead ID ${lead.id} atualizado por Hard Bounce.`);
        }
        bouncesProcessados++;
      }
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    }
    return { bouncesProcessados: bouncesProcessados };
  }
}

export { CheckBouncesService };
