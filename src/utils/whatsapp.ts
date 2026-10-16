export const cleanPhoneNumber = (phone: string = ""): string => {
  let rawPhone = (phone || "").replace(/\D/g, "");
  if (rawPhone.length > 0) {
    if (rawPhone.startsWith("57") && rawPhone.length > 10) {
      return rawPhone;
    }
    if (rawPhone.startsWith("0")) rawPhone = rawPhone.substring(1);
    if (rawPhone.length <= 10 && !rawPhone.startsWith("57")) rawPhone = "57" + rawPhone;
    return rawPhone;
  }
  return "573100000000";
};

/**
 * Genera el enlace nativo de WhatsApp (whatsapp://send)
 * para abrir directamente la aplicación oficial instalada en el dispositivo
 * en lugar de abrir pestañas web intermedias en el explorador.
 */
export const getWhatsAppNativeUrl = (summary: string, phone: string = ""): string => {
  const rawPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(summary);
  return `whatsapp://send?phone=${rawPhone}&text=${encodedText}`;
};

export const generateWhatsAppLink = (summary: string, phone: string = ""): string => {
  return getWhatsAppNativeUrl(summary, phone);
};

/**
 * Abre la aplicación oficial de WhatsApp directamente sin abrir pestañas en blanco en el explorador.
 */
export const openWhatsAppDirect = (summary: string, phone: string = "") => {
  const url = getWhatsAppNativeUrl(summary, phone);
  try {
    window.location.href = url;
  } catch (e) {
    console.error("Error opening WhatsApp directly:", e);
  }
};

