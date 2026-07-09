import dns from "dns";
export async function validateEmailDomain(email: string): Promise<boolean> {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;

    const mxRecords = await dns.promises.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    console.log(`[DNS VALIDATOR] Domínio inválido ou inexistente: ${email}`);
    return false;
  }
}
