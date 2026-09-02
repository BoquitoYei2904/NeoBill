// src/lib/email/templates/licitationExpiring.ts
type LicitationExpiringParams = {
  recipientName: string;
  licitationTitle: string;
  limitDate: Date;
  licitationUrl: string;
};

export function licitationExpiringTemplate({
  recipientName,
  licitationTitle,
  limitDate,
  licitationUrl,
}: LicitationExpiringParams) {
  const formattedDate = limitDate.toLocaleDateString("es-PA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
      <h2 style="font-size: 18px;">Hola ${recipientName},</h2>
      <p style="font-size: 14px; line-height: 1.6;">
        La licitación <strong>${licitationTitle}</strong> vence en menos de 48 horas.
      </p>
      <div style="margin-top: 12px; padding: 12px 14px; background-color: #fee2e2; border-left: 3px solid #ef4444; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.5;">
          <strong>Fecha límite:</strong> ${formattedDate}
        </p>
      </div>
      
        href="${licitationUrl}"
        style="display: inline-block; margin-top: 20px; padding: 10px 16px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;"
      >
        Ver licitación
      </a>
      <p style="margin-top: 24px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        Este es un mensaje automático, no es necesario responder a este correo.
      </p>
    </div>
  `;
}