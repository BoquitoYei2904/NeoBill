type LineItem = {
    descripcion: string;
    cantidad: number;
    precio: number;
};
type LicitationTemplateParams = {
    recipientName: string;
    licitationTitle: string;
    licitationUrl: string;
    isUpdate: boolean;
    lineItems: LineItem[];
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
};
function formatCurrency(amount: number) {
  return amount.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function licitationTemplate({
    recipientName,
    licitationTitle,
    licitationUrl,
    isUpdate,
    lineItems,
    subtotal,
    descuento,
    impuesto,
    total,
}: LicitationTemplateParams) {

    const actionWord = isUpdate ? "actualizada" : "completada";
    const introText = isUpdate
        ? "Se ha subido una nueva versión del documento asociado a esta licitación. Cualquier archivo anterior ha sido reemplazado."
        : "El documento de esta licitación ha sido cargado exitosamente y el expediente ya está listo para revisión.";

    const noticeBlock = isUpdate
        ? `
        <div style="margin-top: 16px; padding: 12px 14px; background-color: #fef9c3; border-left: 3px solid #eab308; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #713f12; line-height: 1.5;">
            <strong>Nota:</strong> si ya habías descargado una copia previa del documento, asegúrate de usar esta versión actualizada.
            </p>
        </div>
        `
        : `
        <div style="margin-top: 16px; padding: 12px 14px; background-color: #dcfce7; border-left: 3px solid #22c55e; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #14532d; line-height: 1.5;">
            El expediente ha sido marcado como completo. No se requieren más acciones por el momento.
            </p>
        </div>
        `;

     const lineItemRows = lineItems
        .map(
        (item) => `
            <tr>
            <td style="padding: 8px 10px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${item.descripcion}</td>
            <td style="padding: 8px 10px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.cantidad}</td>
            <td style="padding: 8px 10px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #e2e8f0; text-align: right;">$${formatCurrency(item.precio)}</td>
            </tr>
        `
        )
        .join("");

    const itemsTable = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
            <tr>
            <th style="padding: 8px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0;">Descripción</th>
            <th style="padding: 8px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; text-align: center; border-bottom: 2px solid #e2e8f0;">Cantidad</th>
            <th style="padding: 8px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; text-align: right; border-bottom: 2px solid #e2e8f0;">Precio</th>
            </tr>
        </thead>
        <tbody>
            ${lineItemRows}
        </tbody>
        </table>
    `;

    const totalsBlock = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
        <tr>
            <td style="padding: 4px 10px; font-size: 13px; color: #475569;">Subtotal</td>
            <td style="padding: 4px 10px; font-size: 13px; color: #1e293b; text-align: right;">$${formatCurrency(subtotal)}</td>
        </tr>
        <tr>
            <td style="padding: 4px 10px; font-size: 13px; color: #475569;">Descuento</td>
            <td style="padding: 4px 10px; font-size: 13px; color: #1e293b; text-align: right;">-$${formatCurrency(descuento)}</td>
        </tr>
        <tr>
            <td style="padding: 4px 10px; font-size: 13px; color: #475569;">Impuesto</td>
            <td style="padding: 4px 10px; font-size: 13px; color: #1e293b; text-align: right;">$${formatCurrency(impuesto)}</td>
        </tr>
        <tr>
            <td style="padding: 8px 10px 4px; font-size: 14px; font-weight: 700; color: #0f172a; border-top: 2px solid #e2e8f0;">Total</td>
            <td style="padding: 8px 10px 4px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; border-top: 2px solid #e2e8f0;">$${formatCurrency(total)}</td>
        </tr>
        </table>
    `;
    return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h2 style="font-size: 18px;">Hola ${recipientName},</h2>
        <p style="font-size: 14px; line-height: 1.6;">
            La licitación <strong>${licitationTitle}</strong> ha sido ${actionWord}.
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">
            ${introText}
        </p>

        ${noticeBlock}
        ${itemsTable}
        ${totalsBlock}

        <a
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