type LicitationTemplateParams = {
    recipientName: string;
    licitationTitle: string;
    licitationUrl: string;
    isUpdate: boolean
};

export function licitationTemplate({
    recipientName,
    licitationTitle,
    licitationUrl,
    isUpdate
}: LicitationTemplateParams) {
    return `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h2 style="font-size: 18px;">Hola ${recipientName},</h2>
        <p style="font-size: 14px; line-height: 1.6;">
            La licitación <strong>${licitationTitle}</strong> ha sido ${isUpdate? "actualizada":"completada"}
        </p>
        
            href="${licitationUrl}"
            style="display: inline-block; margin-top: 16px; padding: 10px 16px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;"
        >
            Ver licitación
        </a>
        </div>
    `;
}